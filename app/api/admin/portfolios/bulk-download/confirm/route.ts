import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const SETTING_KEY = "last_bulk_pdf_download_at"

/**
 * 클라이언트가 zip 다운로드를 모두 저장한 후 호출.
 * 워터마크를 advance 시켜 다음 다운로드부터 동일 파일이 제외되도록 함.
 * 클라이언트가 호출하지 않으면 다음 다운로드에서 동일 파일이 다시 포함됨 (중복 > 손실).
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const serviceClient = createServiceClient()
  const { data: caller } = await serviceClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (!caller || !["admin", "sub_admin"].includes(caller.role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })
  }

  const { watermark } = (await request.json()) as { watermark?: string }
  if (!watermark) {
    return NextResponse.json({ error: "watermark가 필요합니다." }, { status: 400 })
  }

  // 잘못된 ISO date면 거절
  if (Number.isNaN(Date.parse(watermark))) {
    return NextResponse.json({ error: "유효하지 않은 watermark 형식입니다." }, { status: 400 })
  }

  const { error } = await serviceClient
    .from("app_settings")
    .upsert(
      { key: SETTING_KEY, value: watermark, description: "Last bulk PDF download timestamp" },
      { onConflict: "key" }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, watermark })
}
