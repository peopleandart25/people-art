import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

function maskEmail(email: string): string {
  const [local, domain] = email.split("@")
  if (local.length <= 1) return `*@${domain}`
  return `${local[0]}${"*".repeat(local.length - 1)}@${domain}`
}

export async function POST(request: Request) {
  let body: { phone?: string }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 })
  }
  const { phone } = body

  if (!phone || typeof phone !== "string") {
    return NextResponse.json({ error: "휴대폰 번호를 입력해주세요." }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  // 전화번호로 profiles 테이블 조회
  const { data: profile, error: profileError } = await serviceClient
    .from("profiles")
    .select("email, id")
    .eq("phone", phone)
    .maybeSingle()

  if (profileError) {
    return NextResponse.json({ error: "계정 조회 중 오류가 발생했습니다." }, { status: 500 })
  }

  if (!profile || !profile.email) {
    return NextResponse.json({ error: "해당 휴대폰 번호로 가입된 계정이 없습니다." }, { status: 404 })
  }

  // provider 정보 조회
  const { data: userData } = await serviceClient.auth.admin.getUserById(profile.id)
  const identities = userData?.user?.identities ?? []
  const provider = identities.length > 0 ? identities[0].provider : "email"

  return NextResponse.json({
    maskedEmail: maskEmail(profile.email),
    provider,
  })
}
