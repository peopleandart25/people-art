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

export async function POST(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 })
  if (!file.name.endsWith(".pptx")) return NextResponse.json({ error: ".pptx 파일만 업로드할 수 있습니다." }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const serviceClient = createServiceClient()

  const { error } = await serviceClient.storage
    .from(BUCKET)
    .upload(FILE_NAME, buffer, {
      contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      upsert: true,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
