import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

const MAX_ATTEMPTS = 5

export async function POST(request: Request) {
  const { phone, otp } = await request.json()
  if (!phone || !otp) return NextResponse.json({ error: "전화번호와 인증번호가 필요합니다." }, { status: 400 })

  const serviceClient = createServiceClient()
  const { data, error } = await serviceClient
    .from("phone_verifications")
    .select("otp, expires_at, attempts")
    .eq("phone", phone)
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ error: "인증번호를 찾을 수 없습니다." }, { status: 400 })
  }

  if (new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: "인증번호가 만료되었습니다." }, { status: 400 })
  }

  // OTP 실패 횟수 체크 (brute force 방지)
  if ((data.attempts ?? 0) >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "인증 시도 횟수를 초과했습니다. 인증번호를 다시 요청해주세요." },
      { status: 429 }
    )
  }

  if (data.otp !== otp) {
    // 실패 횟수 증가
    await serviceClient
      .from("phone_verifications")
      .update({ attempts: (data.attempts ?? 0) + 1 } as never)
      .eq("phone", phone)

    const remaining = MAX_ATTEMPTS - (data.attempts ?? 0) - 1
    return NextResponse.json(
      { error: `인증번호가 올바르지 않습니다. (남은 시도: ${remaining}회)` },
      { status: 400 }
    )
  }

  // 인증 완료 후 삭제
  await serviceClient.from("phone_verifications").delete().eq("phone", phone)

  return NextResponse.json({ success: true })
}
