import { NextResponse } from "next/server"
import crypto from "crypto"
import { createServiceClient } from "@/lib/supabase/server"

function getCoolSMSAuthHeader(apiKey: string, apiSecret: string) {
  const date = new Date().toISOString()
  const salt = crypto.randomBytes(32).toString("hex")
  const signature = crypto.createHmac("sha256", apiSecret).update(date + salt).digest("hex")
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`
}

function formatToNational(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.startsWith("82") && cleaned.length >= 11) return "0" + cleaned.slice(2)
  if (cleaned.startsWith("0")) return cleaned
  return "0" + cleaned
}

export async function POST(request: Request) {
  const { phone } = await request.json()
  if (!phone) return NextResponse.json({ error: "전화번호가 필요합니다." }, { status: 400 })

  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  const serviceClient = createServiceClient()
  const { error: dbError } = await serviceClient
    .from("phone_verifications")
    .upsert({ phone, otp, expires_at: expiresAt }, { onConflict: "phone" })

  if (dbError) {
    return NextResponse.json({ error: "OTP 저장 실패" }, { status: 500 })
  }

  const to = formatToNational(phone)
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
    return NextResponse.json({ error: "SMS 발송 실패" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
