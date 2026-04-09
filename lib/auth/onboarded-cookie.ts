/**
 * pa_onboarded 쿠키 HMAC 서명/검증
 *
 * 쿠키 format: `<role>:<userId>.<base64url(hmac-sha256)>`
 *   role ∈ { a (artist), d (director), s (skip/admin) }
 *
 * HMAC key는 `PA_ONBOARDED_SECRET` 환경변수. 미설정 시 `SUPABASE_SERVICE_ROLE_KEY`를
 * 폴백으로 사용(운영에도 존재하는 고정 시크릿이라 안전).
 */

const encoder = new TextEncoder()

export type OnboardedRole = "a" | "d" | "s"

function getSecret(): string {
  return process.env.PA_ONBOARDED_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ""
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

async function hmac(payload: string): Promise<string> {
  const secret = getSecret()
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload))
  return toBase64Url(new Uint8Array(sig))
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function signOnboardedCookie(role: OnboardedRole, userId: string): Promise<string> {
  const payload = `${role}:${userId}`
  const sig = await hmac(payload)
  return `${payload}.${sig}`
}

export async function verifyOnboardedCookie(
  cookie: string | undefined,
  userId: string,
): Promise<OnboardedRole | null> {
  if (!cookie) return null
  const dot = cookie.lastIndexOf(".")
  if (dot < 3) return null
  const payload = cookie.slice(0, dot)
  const sig = cookie.slice(dot + 1)
  // payload는 `<role>:<userId>` 형태여야 함
  if (!payload.endsWith(`:${userId}`)) return null
  const role = payload.slice(0, payload.indexOf(":")) as OnboardedRole
  if (role !== "a" && role !== "d" && role !== "s") return null
  const expected = await hmac(payload)
  if (!timingSafeEqual(sig, expected)) return null
  return role
}
