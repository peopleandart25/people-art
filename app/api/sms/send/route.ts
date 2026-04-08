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

const SMS_COOLDOWN_SECONDS = 60
const SMS_DAILY_LIMIT = 10

export async function POST(request: Request) {
  const { phone, checkDuplicate } = await request.json()
  if (!phone) return NextResponse.json({ error: "전화번호가 필요합니다." }, { status: 400 })

  const serviceClient = createServiceClient()

  // 이미 가입된 번호인지 확인 (온보딩 시에만) — 동일 응답으로 enumeration 방지
  if (checkDuplicate !== false) {
    const { data: existing } = await serviceClient
      .from("profiles")
      .select("id")
      .eq("phone", phone)
      .maybeSingle()

    if (existing) {
      // enumeration 방지: 성공과 동일한 응답 반환
      return NextResponse.json({ success: true })
    }
  }

  // Rate limiting: 재발송 쿨다운 + 일일 한도 체크
  const { data: prevVerification } = await serviceClient
    .from("phone_verifications")
    .select("last_sent_at, attempts")
    .eq("phone", phone)
    .maybeSingle()

  if (prevVerification) {
    // 60초 쿨다운 체크
    if (prevVerification.last_sent_at) {
      const secondsSinceLast = (Date.now() - new Date(prevVerification.last_sent_at).getTime()) / 1000
      if (secondsSinceLast < SMS_COOLDOWN_SECONDS) {
        const waitSeconds = Math.ceil(SMS_COOLDOWN_SECONDS - secondsSinceLast)
        return NextResponse.json(
          { error: `${waitSeconds}초 후 다시 시도해주세요.` },
          { status: 429 }
        )
      }
    }
    // 일일 발송 한도 체크
    if (prevVerification.attempts >= SMS_DAILY_LIMIT) {
      return NextResponse.json(
        { error: "오늘 인증번호 발송 한도를 초과했습니다. 내일 다시 시도해주세요." },
        { status: 429 }
      )
    }
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
  const now = new Date().toISOString()

  const { error: dbError } = await serviceClient
    .from("phone_verifications")
    .upsert(
      {
        phone,
        otp,
        expires_at: expiresAt,
        last_sent_at: now,
        attempts: (prevVerification?.attempts ?? 0) + 1,
      },
      { onConflict: "phone" }
    )

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
