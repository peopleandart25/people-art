import { NextResponse } from "next/server"

// internal path 화이트리스트 (open redirect 방지)
function sanitizeRedirectTo(raw: string | null): string {
  if (!raw) return "/"
  // 오직 `/`로 시작하고 `//` 또는 `/\`로 시작하지 않는 경로만 허용
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/"
  return raw
}

function generateNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const redirectTo = sanitizeRedirectTo(searchParams.get("redirectTo"))

  const nonce = generateNonce()
  const state = JSON.stringify({ n: nonce, r: redirectTo })

  const naverAuthUrl = new URL("https://nid.naver.com/oauth2.0/authorize")
  naverAuthUrl.searchParams.set("response_type", "code")
  naverAuthUrl.searchParams.set("client_id", process.env.NAVER_CLIENT_ID!)
  naverAuthUrl.searchParams.set("redirect_uri", `${origin}/api/auth/naver/callback`)
  naverAuthUrl.searchParams.set("state", state)

  const response = NextResponse.redirect(naverAuthUrl.toString())
  // CSRF 방어용 nonce 쿠키 (5분)
  response.cookies.set("pa_naver_oauth_nonce", nonce, {
    path: "/",
    maxAge: 300,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  })
  return response
}
