import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, phone, company, jobTitle } = await request.json() as {
    name: string
    phone: string
    company: string
    jobTitle: string
  }

  if (!name || !phone) {
    return NextResponse.json({ error: "이름과 연락처는 필수입니다." }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  const { error } = await serviceClient
    .from("profiles")
    .update({
      name: name.trim(),
      phone: phone.trim(),
      activity_name: company.trim() || null,
      job_title: jobTitle.trim() || null,
      role: "casting_director",
      status: "활성",
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
