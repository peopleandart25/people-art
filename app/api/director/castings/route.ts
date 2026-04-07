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

    if (!apps) return NextResponse.json([])

    const enriched = await Promise.all(
      apps.map(async (app) => {
        const [{ data: profile }, { data: artistProfile }] = await Promise.all([
          serviceClient.from("profiles").select("name, email, phone").eq("id", app.user_id).single(),
          serviceClient.from("artist_profiles").select("id, portfolio_url, main_photo, gender, birth_date, height, weight").eq("user_id", app.user_id).single(),
        ])
        return {
          ...app,
          profile: profile ?? null,
          portfolio_url: artistProfile?.portfolio_url ?? null,
          artist_profile_id: artistProfile?.id ?? null,
          main_photo: artistProfile?.main_photo ?? null,
          gender: artistProfile?.gender ?? null,
          birth_date: artistProfile?.birth_date ?? null,
          height: artistProfile?.height ?? null,
          weight: artistProfile?.weight ?? null,
        }
      })
    )
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
