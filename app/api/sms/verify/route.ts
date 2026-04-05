import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const { phone, otp } = await request.json()
  if (!phone || !otp) return NextResponse.json({ error: "전화번호와 인증번호가 필요합니다." }, { status: 400 })

  const serviceClient = createServiceClient()
  const { data, error } = await serviceClient
    .from("phone_verifications")
    .select("otp, expires_at")
    .eq("phone", phone)
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ error: "인증번호를 찾을 수 없습니다." }, { status: 400 })
  }

  if (new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: "인증번호가 만료되었습니다." }, { status: 400 })
  }

  if (data.otp !== otp) {
    return NextResponse.json({ error: "인증번호가 올바르지 않습니다." }, { status: 400 })
  }

  // 인증 완료 후 삭제
  await serviceClient.from("phone_verifications").delete().eq("phone", phone)

  return NextResponse.json({ success: true })
}
