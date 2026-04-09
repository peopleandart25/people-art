import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireApprovedDirector } from "@/lib/auth/require-approved-cd"

async function requireDirector() {
  const supabase = await createClient()
  const serviceClient = createServiceClient()
  return requireApprovedDirector(supabase, serviceClient)
}

// GET /api/director/shortlists?casting_id=xxx
export async function GET(request: Request) {
  const auth = await requireDirector()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const user = { id: auth.userId }

  const { searchParams } = new URL(request.url)
  const castingId = searchParams.get("casting_id")
  if (!castingId) return NextResponse.json({ error: "casting_id가 필요합니다." }, { status: 400 })

  const serviceClient = createServiceClient()

  const { data, error } = await serviceClient
    .from("casting_shortlists" as never)
    .select("id, created_at, artist_user_id")
    .eq("director_id", user.id)
    .eq("casting_id", castingId)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })

  const items = (data as { id: string; created_at: string; artist_user_id: string }[]) ?? []
  if (items.length === 0) return NextResponse.json([])

  // 배치 쿼리 (3N → 3)
  const userIds = items.map((i) => i.artist_user_id)
  const [{ data: profiles }, { data: artistProfiles }, { data: mainPhotos }] = await Promise.all([
    serviceClient.from("profiles").select("id, name, activity_name").in("id", userIds),
    serviceClient.from("artist_profiles").select("id, user_id, gender, birth_date, height, weight, portfolio_url").in("user_id", userIds),
    serviceClient.from("artist_photos").select("user_id, url").eq("is_main", true).in("user_id", userIds),
  ])

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))
  const artistProfileMap = new Map((artistProfiles ?? []).map((ap) => [ap.user_id, ap]))
  const photoMap = new Map((mainPhotos ?? []).map((p) => [p.user_id, p.url]))

  const enriched = items.map((item) => {
    const np = profileMap.get(item.artist_user_id) as { name: string | null; activity_name: string | null } | undefined
    const ap = artistProfileMap.get(item.artist_user_id) as { id: string; gender: string | null; birth_date: string | null; height: number | null; weight: number | null; portfolio_url: string | null } | undefined
    return {
      ...item,
      name: np?.activity_name ?? np?.name ?? "이름 없음",
      artist_profile: ap ?? null,
      main_photo: photoMap.get(item.artist_user_id) ?? null,
      portfolio_url: ap?.portfolio_url ?? null,
    }
  })

  return NextResponse.json(enriched)
}

// POST /api/director/shortlists
// body: { casting_id: string, artist_user_ids: string[] }
export async function POST(request: Request) {
  const auth = await requireDirector()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const user = { id: auth.userId }

  const { casting_id, artist_user_ids } = await request.json() as {
    casting_id: string
    artist_user_ids: string[]
  }

  if (!casting_id || !artist_user_ids || artist_user_ids.length === 0) {
    return NextResponse.json({ error: "casting_id와 artist_user_ids가 필요합니다." }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  const rows = artist_user_ids.map((artist_user_id) => ({
    director_id: user.id,
    casting_id,
    artist_user_id,
  }))

  const { error } = await serviceClient
    .from("casting_shortlists" as never)
    .upsert(rows as never, { onConflict: "director_id,artist_user_id,casting_id" })

  if (error) return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })
  return NextResponse.json({ success: true }, { status: 201 })
}

// DELETE /api/director/shortlists
// body: { casting_id: string, artist_user_id: string }
export async function DELETE(request: Request) {
  const auth = await requireDirector()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const user = { id: auth.userId }

  const { casting_id, artist_user_id } = await request.json() as {
    casting_id: string
    artist_user_id: string
  }

  if (!casting_id || !artist_user_id) {
    return NextResponse.json({ error: "casting_id와 artist_user_id가 필요합니다." }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  const { error } = await serviceClient
    .from("casting_shortlists" as never)
    .delete()
    .eq("director_id", user.id)
    .eq("casting_id", casting_id)
    .eq("artist_user_id", artist_user_id)

  if (error) return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })
  return NextResponse.json({ success: true })
}
