import { NextResponse } from "next/server"
import crypto from "crypto"

function getCoolSMSAuthHeader(apiKey: string, apiSecret: string) {
  const date = new Date().toISOString()
  const salt = crypto.randomBytes(32).toString("hex")
  const signature = crypto.createHmac("sha256", apiSecret).update(date + salt).digest("hex")
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`
}

function verifyBearerToken(authHeader: string | null): boolean {
  const secret = process.env.SUPABASE_HOOK_SECRET ?? ""
  if (!secret || !authHeader) return false
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
  if (!token) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(secret))
  } catch {
    return false
  }
}

function verifySupabaseHookSignature(
  webhookId: string | null,
  webhookTimestamp: string | null,
  webhookSignature: string | null,
  rawBody: string
): boolean {
  if (!webhookId || !webhookTimestamp || !webhookSignature) return false

  const secret = process.env.SUPABASE_HOOK_SECRET ?? ""
  const secretBytes = secret.startsWith("v1,whsec_")
    ? Buffer.from(secret.replace(/^v1,whsec_/, ""), "base64")
    : Buffer.from(secret, "hex")

  const msg = `${webhookId}.${webhookTimestamp}.${rawBody}`
  const computed = crypto.createHmac("sha256", secretBytes).update(msg).digest("base64")

  // webhook-signature 헤더는 공백으로 구분된 "v1,<sig>" 목록일 수 있음
  return webhookSignature.split(" ").some((sig) => {
    const sigValue = sig.startsWith("v1,") ? sig.slice(3) : sig
    try {
      return crypto.timingSafeEqual(Buffer.from(sigValue), Buffer.from(computed))
    } catch {
      return false
    }
  })
}

export async function POST(request: Request) {
  let rawBody: string
  try {
    rawBody = await request.text()
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const isValid =
    verifyBearerToken(request.headers.get("authorization")) ||
    verifySupabaseHookSignature(
      request.headers.get("webhook-id"),
      request.headers.get("webhook-timestamp"),
      request.headers.get("webhook-signature"),
      rawBody
    )
  if (!isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { user?: { phone?: string }; sms?: { otp?: string } }
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  // Supabase SMS hook payload: { user: { phone }, sms: { otp } }
  const phone = body.user?.phone
  const otp = body.sms?.otp
  if (!phone || !otp) {
    return NextResponse.json({ error: "Missing phone or otp" }, { status: 400 })
  }

  // +82XXXXXXXXXX → 82XXXXXXXXXX (coolsms는 + 없이)
  const to = phone.replace(/^\+/, "")
  const from = (process.env.COOLSMS_FROM ?? "").replace(/-/g, "")

  const apiKey = process.env.COOLSMS_API_KEY!
  const apiSecret = process.env.COOLSMS_API_SECRET!

  const res = await fetch("https://api.coolsms.co.kr/messages/v4/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getCoolSMSAuthHeader(apiKey, apiSecret),
    },
    body: JSON.stringify({
      message: {
        to,
        from,
        text: `[피플앤아트] 인증번호는 ${otp}입니다. (5분 이내 입력)`,
        type: "SMS",
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error("coolsms error:", err)
    return NextResponse.json({ error: "SMS send failed" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
