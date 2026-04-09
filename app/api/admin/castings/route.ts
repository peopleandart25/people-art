import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const castingId = searchParams.get("casting_id")

  const serviceClient = createServiceClient()

  // 특정 공고의 지원자 목록 조회
  if (castingId) {
    const { data: apps } = await serviceClient
      .from("casting_applications")
      .select("id, admin_status, admin_note, applied_at, user_id")
      .eq("casting_id", castingId)
      .order("applied_at", { ascending: false })

    if (!apps || apps.length === 0) return NextResponse.json([])

    // 배치 쿼리 (2N → 2)
    const userIds = apps.map((a) => a.user_id).filter(Boolean) as string[]
    const [{ data: profiles }, { data: artistProfiles }] = await Promise.all([
      serviceClient.from("profiles").select("id, name, email, phone").in("id", userIds),
      serviceClient.from("artist_profiles").select("user_id, portfolio_url").in("user_id", userIds),
    ])

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))
    const artistProfileMap = new Map((artistProfiles ?? []).map((ap) => [ap.user_id, ap]))

    const enriched = apps.map((app) => ({
      ...app,
      profile: (profileMap.get(app.user_id ?? "") as { name: string; email: string; phone: string } | undefined) ?? null,
      portfolio_url: (artistProfileMap.get(app.user_id ?? "") as { portfolio_url: string | null } | undefined)?.portfolio_url ?? null,
    }))
    return NextResponse.json(enriched)
  }

  const { data, error } = await serviceClient
    .from("castings")
    .select("*, casting_applications(count), creator:profiles!created_by(name, activity_name, email)")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })

  const body = await request.json()
  const serviceClient = createServiceClient()

  const { data, error } = await serviceClient
    .from("castings")
    .insert({ ...body, created_by: user.id })
    .select("id")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })

  const { id, application_id, admin_status, admin_note, ...payload } = await request.json()
  const serviceClient = createServiceClient()

  // 지원자 상태 변경
  if (application_id) {
    const { data, error } = await serviceClient
      .from("casting_applications")
      .update({ admin_status, admin_note })
      .eq("id", application_id)
      .select("id")
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 })

  const { data, error } = await serviceClient
    .from("castings")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 })

  const serviceClient = createServiceClient()
  const { error } = await serviceClient
    .from("castings")
    .delete()
    .eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
