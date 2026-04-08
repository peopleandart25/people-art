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
      privacy_agreed_at: nowIso,
      marketing_agreed_at: marketingAgreed ? nowIso : null,
      updated_at: nowIso,
    } as never)
    .eq("id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
