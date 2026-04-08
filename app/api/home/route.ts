import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createServiceClient()
  const [events, tours, news, partners, reviews, artistProfilesRes] = await Promise.all([
    supabase.from("events").select("id, title, type, status, deadline, is_member_only").order("created_at", { ascending: false }).limit(6),
    supabase.from("tours").select("id, title, category, status, created_at").order("created_at", { ascending: false }).limit(6),
    supabase.from("news").select("id, title, image_url, published_at").eq("is_published", true).order("published_at", { ascending: false }).limit(12),
    supabase.from("partners").select("id, name, description, image_url, link").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("reviews").select("id, title, content, user_id, category, created_at, is_hidden").eq("is_hidden", false).order("created_at", { ascending: false }).limit(5),
    supabase.from("artist_profiles").select("id, user_id, show_in_artist_list, profiles(name)" as never).limit(30),
  ])

  // artist_photos는 실제 아티스트 IDs로만 필터링 (전체 페칭 방지)
  const artistProfileList = (artistProfilesRes.data ?? []) as unknown as { id: string; user_id: string; show_in_artist_list: boolean; profiles: { name: string } | null }[]
  const artistUserIds = artistProfileList.map((ap) => ap.user_id)
  const { data: artistPhotos } = artistUserIds.length > 0
    ? await supabase.from("artist_photos").select("user_id, url").eq("is_main", true).in("user_id", artistUserIds)
    : { data: [] }

  const photoMap = new Map((artistPhotos ?? []).map((p) => [p.user_id, p.url]))
  const artists = artistProfileList.map((ap) => {
    const showPhoto = ap.show_in_artist_list !== false
    return {
      id: ap.id,
      name: ap.profiles?.name ?? "",
      profileImage: showPhoto ? (photoMap.get(ap.user_id) ?? null) : null,
    }
  })

  // 에러 로깅 (graceful degradation 유지)
  const errors = [events, tours, news, partners, reviews, artistProfilesRes].filter((r) => r.error).map((r) => r.error?.message)
  if (errors.length > 0) console.error("[/api/home] query errors:", errors)

  return NextResponse.json(
    { events: events.data ?? [], tours: tours.data ?? [], news: news.data ?? [], partners: partners.data ?? [], reviews: reviews.data ?? [], artists },
    { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" } }
  )
}
