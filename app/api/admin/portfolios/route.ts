import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const SETTING_KEY = "last_bulk_pdf_download_at"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const serviceClient = createServiceClient()

  // 어드민 인증 + artists 임베디드 쿼리 + last_bulk_download_at 을 병렬로 실행
  const [callerRes, artistsRes, settingRes] = await Promise.all([
    serviceClient.from("profiles").select("role").eq("id", user.id).single(),
    serviceClient
      .from("artist_profiles")
      .select(
        "user_id, portfolio_url, portfolio_file_name, portfolio_updated_at, profile:profiles!artist_profiles_user_id_fkey(name, email, activity_name)"
      )
      .not("portfolio_url", "is", null)
      .order("portfolio_updated_at", { ascending: false, nullsFirst: false }),
    serviceClient.from("app_settings").select("value").eq("key", SETTING_KEY).maybeSingle(),
  ])

  const caller = callerRes.data
  if (!caller || !["admin", "sub_admin"].includes(caller.role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })
  }

  if (artistsRes.error) {
    return NextResponse.json({ error: artistsRes.error.message }, { status: 500 })
  }

  type Row = {
    user_id: string
    portfolio_url: string | null
    portfolio_file_name: string | null
    portfolio_updated_at: string | null
    profile: { name: string | null; email: string | null; activity_name: string | null } | null
  }

  const rows = ((artistsRes.data ?? []) as unknown as Row[]).map((a) => ({
    user_id: a.user_id,
    name: a.profile?.name ?? null,
    activity_name: a.profile?.activity_name ?? null,
    email: a.profile?.email ?? null,
    portfolio_url: a.portfolio_url,
    portfolio_file_name: a.portfolio_file_name,
    portfolio_updated_at: a.portfolio_updated_at,
  }))

  const lastBulkDownloadAt =
    settingRes.data?.value && settingRes.data.value.length > 0 ? settingRes.data.value : null

  return NextResponse.json(
    { rows, last_bulk_download_at: lastBulkDownloadAt },
    {
      headers: {
        // 어드민 전용 — 30초 캐시 (profile API와 동일한 전략)
        "Cache-Control": "private, max-age=30",
      },
    }
  )
}
