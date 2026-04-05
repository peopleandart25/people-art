import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const BUCKET = "templates"
const FILE_NAME = "profile-form.pptx"

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient.from("profiles").select("role").eq("id", user.id).single()
  if (!profile || !["admin", "sub_admin"].includes(profile.role)) return null
  return user
}

// Signed Upload URL 발급 (클라이언트가 직접 Supabase에 업로드)
export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })

  const serviceClient = createServiceClient()
  const { data, error } = await serviceClient.storage
    .from(BUCKET)
    .createSignedUploadUrl(FILE_NAME)

  if (error || !data) return NextResponse.json({ error: error?.message ?? "URL 발급 실패" }, { status: 500 })
  return NextResponse.json({ signedUrl: data.signedUrl, token: data.token })
}
