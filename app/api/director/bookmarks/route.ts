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

  if (!profile || (profile.role !== "casting_director" && profile.role !== "admin")) return null
  return user
}

// GET /api/director/bookmarks
// ?artist_profile_id=xxx → { bookmarked: bool }
// (no param) → bookmark list
export async function GET(request: Request) {
  const user = await requireDirector()
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

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
        id, gender, birth_date, height,
        profiles(name),
        artist_photos(url, is_main)
      )
    `)
    .eq("director_id", user.id)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/director/bookmarks — add
export async function POST(request: Request) {
  const user = await requireDirector()
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

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
  const user = await requireDirector()
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

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
