import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, phone, company, jobTitle, privacyAgreed, marketingAgreed } = await request.json() as {
    name: string
    phone: string
    company: string
    jobTitle: string
    privacyAgreed?: boolean
    marketingAgreed?: boolean
  }

  if (!name || !phone) {
    return NextResponse.json({ error: "이름과 연락처는 필수입니다." }, { status: 400 })
  }

  if (!privacyAgreed) {
    return NextResponse.json({ error: "개인정보 수집 및 이용에 동의해주세요." }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  // 거절된 CD는 재제출 불가 (관리자 문의 유도)
  const { data: existing } = await serviceClient
    .from("profiles")
    .select("cd_approval_status")
    .eq("id", user.id)
    .single()
  if ((existing as { cd_approval_status: string | null } | null)?.cd_approval_status === "rejected") {
    return NextResponse.json(
      { error: "가입이 거절되었습니다. 관리자에게 문의하세요." },
      { status: 409 }
    )
  }

  const nowIso = new Date().toISOString()
  const { error } = await serviceClient
    .from("profiles")
    .update({
      name: name.trim(),
      phone: phone.trim(),
      company: company.trim() || null,
      job_title: jobTitle.trim() || null,
      role: "casting_director",
      status: "활성",
      cd_approval_status: "pending",
      privacy_agreed_at: nowIso,
      marketing_agreed_at: marketingAgreed ? nowIso : null,
      updated_at: nowIso,
    } as never)
    .eq("id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const response = NextResponse.json({ ok: true })
  response.cookies.set("pa_onboarded", "", { path: "/", maxAge: 0 })
  return response
}
