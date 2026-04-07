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

// GET /api/director/shortlists?casting_id=xxx
export async function GET(request: Request) {
  const user = await requireDirector()
  if (!user) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })

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

  // artist 정보 조인
  const enriched = await Promise.all(
    items.map(async (item) => {
      const [{ data: profile }, { data: artistProfile }, { data: photo }] = await Promise.all([
        serviceClient.from("profiles").select("name, activity_name").eq("id", item.artist_user_id).single(),
        serviceClient
          .from("artist_profiles")
          .select("id, gender, birth_date, height, weight, portfolio_url")
          .eq("user_id", item.artist_user_id)
          .single(),
        serviceClient
          .from("artist_photos")
          .select("url")
          .eq("user_id", item.artist_user_id)
          .eq("is_main", true)
          .maybeSingle(),
      ])

      const np = profile as { name: string | null; activity_name: string | null } | null
      const ap = artistProfile as { id: string; gender: string | null; birth_date: string | null; height: number | null; weight: number | null; portfolio_url: string | null } | null
      return {
        ...item,
        name: np?.activity_name ?? np?.name ?? "이름 없음",
        artist_profile: ap ?? null,
        main_photo: (photo as { url: string } | null)?.url ?? null,
        portfolio_url: ap?.portfolio_url ?? null,
      }
    })
  )

  return NextResponse.json(enriched)
}

// POST /api/director/shortlists
// body: { casting_id: string, artist_user_ids: string[] }
export async function POST(request: Request) {
  const user = await requireDirector()
  if (!user) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })

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
  const user = await requireDirector()
  if (!user) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })

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
