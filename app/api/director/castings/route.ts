import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

async function requireDirector() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "casting_director") return null
  return user
}

export async function GET(request: Request) {
  const user = await requireDirector()
  if (!user) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const castingId = searchParams.get("casting_id")

  const serviceClient = createServiceClient()

  // 지원자 목록 조회
  if (castingId) {
    // 본인 공고인지 확인
    const { data: casting } = await serviceClient
      .from("castings")
      .select("created_by")
      .eq("id", castingId)
      .single()

    if (!casting || casting.created_by !== user.id) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })
    }

    const { data: apps } = await serviceClient
      .from("casting_applications")
      .select("id, admin_status, admin_note, applied_at, user_id")
      .eq("casting_id", castingId)
      .order("applied_at", { ascending: false })

    if (!apps || apps.length === 0) return NextResponse.json([])

    // 배치 쿼리로 N+1 방지 (N×3 쿼리 → 3 쿼리)
    const userIds = apps.map((a) => a.user_id)
    const [{ data: profiles }, { data: artistProfiles }] = await Promise.all([
      serviceClient.from("profiles").select("id, name, email, phone").in("id", userIds),
      serviceClient.from("artist_profiles").select("id, user_id, portfolio_url, main_photo, gender, birth_date, height, weight").in("user_id", userIds),
    ])

    const artistProfileIds = (artistProfiles ?? []).map((ap) => ap.id)
    const { data: allStatusTags } = artistProfileIds.length > 0
      ? await serviceClient.from("artist_status_tags").select("artist_id, status_tags(name)").in("artist_id", artistProfileIds)
      : { data: [] }

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))
    const artistProfileMap = new Map((artistProfiles ?? []).map((ap) => [ap.user_id, ap]))
    const tagMap = new Map<string, string[]>()
    for (const t of (allStatusTags ?? []) as { artist_id: string; status_tags: { name: string } | null }[]) {
      const name = t.status_tags?.name
      if (name) {
        const list = tagMap.get(t.artist_id) ?? []
        list.push(name)
        tagMap.set(t.artist_id, list)
      }
    }

    const enriched = apps.map((app) => {
      const prof = profileMap.get(app.user_id)
      const ap = artistProfileMap.get(app.user_id)
      return {
        ...app,
        profile: prof ?? null,
        portfolio_url: ap?.portfolio_url ?? null,
        artist_profile_id: ap?.id ?? null,
        main_photo: ap?.main_photo ?? null,
        gender: ap?.gender ?? null,
        birth_date: ap?.birth_date ?? null,
        height: ap?.height ?? null,
        weight: ap?.weight ?? null,
        status_tags: ap?.id ? (tagMap.get(ap.id) ?? []) : [],
      }
    })
    return NextResponse.json(enriched)
  }

  // 본인 캐스팅 목록
  const { data, error } = await serviceClient
    .from("castings")
    .select("*, casting_applications(count), creator:profiles!created_by(name, activity_name, email)")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const user = await requireDirector()
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
  const user = await requireDirector()
  if (!user) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })

  const { id, admin_status, admin_note, application_id, ...payload } = await request.json()

  const serviceClient = createServiceClient()

  // 지원자 상태 변경
  if (application_id) {
    // 해당 지원이 본인 공고에 속하는지 확인
    const { data: app } = await serviceClient
      .from("casting_applications")
      .select("casting_id")
      .eq("id", application_id)
      .single()

    if (!app) return NextResponse.json({ error: "지원 정보를 찾을 수 없습니다." }, { status: 404 })

    const { data: appCasting } = await serviceClient
      .from("castings")
      .select("created_by")
      .eq("id", app.casting_id)
      .single()

    if (!appCasting || appCasting.created_by !== user.id) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })
    }

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

  // 본인 공고만 수정 가능
  const { data: existing } = await serviceClient
    .from("castings")
    .select("created_by")
    .eq("id", id)
    .single()

  if (!existing || existing.created_by !== user.id) {
    return NextResponse.json({ error: "수정 권한이 없습니다." }, { status: 403 })
  }

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
  const user = await requireDirector()
  if (!user) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 })

  const serviceClient = createServiceClient()

  // 본인 공고만 삭제 가능
  const { data: existing } = await serviceClient
    .from("castings")
    .select("created_by")
    .eq("id", id)
    .single()

  if (!existing || existing.created_by !== user.id) {
    return NextResponse.json({ error: "삭제 권한이 없습니다." }, { status: 403 })
  }

  const { error } = await serviceClient.from("castings").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
