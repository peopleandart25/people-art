import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || !["admin", "sub_admin"].includes(profile.role)) return null
  return user
}

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

    if (!apps) return NextResponse.json([])

    const enriched = await Promise.all(
      apps.map(async (app) => {
        const [{ data: profile }, { data: artistProfile }] = await Promise.all([
          serviceClient.from("profiles").select("name, email, phone").eq("id", app.user_id ?? "").single(),
          serviceClient.from("artist_profiles").select("portfolio_url").eq("user_id", app.user_id ?? "").single(),
        ])
        return { ...app, profile: profile ?? null, portfolio_url: artistProfile?.portfolio_url ?? null }
      })
    )
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
