import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireApprovedDirector } from "@/lib/auth/require-approved-cd"

async function requireDirector() {
  const supabase = await createClient()
  const serviceClient = createServiceClient()
  return requireApprovedDirector(supabase, serviceClient)
}

// GET /api/director/bookmarks
// ?artist_profile_id=xxx → { bookmarked: bool }
// (no param) → bookmark list
export async function GET(request: Request) {
  const auth = await requireDirector()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const user = { id: auth.userId }

  const { searchParams } = new URL(request.url)
  const artistProfileId = searchParams.get("artist_profile_id")
  const supabase = await createClient()

  if (artistProfileId) {
    const { data } = await supabase
      .from("actor_bookmarks")
      .select("id")
      .eq("director_id", user.id)
      .eq("artist_profile_id", artistProfileId)
      .maybeSingle()
    return NextResponse.json({ bookmarked: !!data })
  }

  const serviceClient = createServiceClient()
  const { data, error } = await serviceClient
    .from("actor_bookmarks")
    .select(`
      id, created_at, artist_profile_id,
      artist_profiles(
        id, user_id, gender, birth_date, height,
        profiles(name)
      )
    `)
    .eq("director_id", user.id)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // artist_photos는 user_id 기준이라 별도 조회
  const userIds = (data ?? [])
    .map((b: any) => b.artist_profiles?.user_id)
    .filter(Boolean)

  const photosMap: Record<string, string | null> = {}
  if (userIds.length > 0) {
    const { data: photos } = await serviceClient
      .from("artist_photos")
      .select("user_id, url, is_main")
      .in("user_id", userIds)
      .eq("is_main", true)
    for (const p of photos ?? []) {
      photosMap[p.user_id] = p.url
    }
  }

  const result = (data ?? []).map((b: any) => ({
    ...b,
    main_photo: photosMap[b.artist_profiles?.user_id] ?? null,
  }))

  return NextResponse.json(result)
}

// POST /api/director/bookmarks — add
export async function POST(request: Request) {
  const auth = await requireDirector()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const user = { id: auth.userId }

  const { artist_profile_id } = await request.json()
  if (!artist_profile_id) return NextResponse.json({ error: "artist_profile_id required" }, { status: 400 })

  const supabase = await createClient()
  const { error } = await supabase
    .from("actor_bookmarks")
    .insert({ director_id: user.id, artist_profile_id })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE /api/director/bookmarks — remove
export async function DELETE(request: Request) {
  const auth = await requireDirector()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const user = { id: auth.userId }

  const { artist_profile_id } = await request.json()
  if (!artist_profile_id) return NextResponse.json({ error: "artist_profile_id required" }, { status: 400 })

  const supabase = await createClient()
  const { error } = await supabase
    .from("actor_bookmarks")
    .delete()
    .eq("director_id", user.id)
    .eq("artist_profile_id", artist_profile_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
