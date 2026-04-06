import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createServiceClient()
  const [events, tours, news, partners, reviews, artistProfiles, artistPhotos, profiles] = await Promise.all([
    supabase.from("events").select("id, title, type, status, deadline, is_member_only").order("created_at", { ascending: false }).limit(6),
    supabase.from("tours").select("id, title, category, status, created_at").order("created_at", { ascending: false }).limit(6),
    supabase.from("news").select("id, title, image_url, published_at").eq("is_published", true).order("published_at", { ascending: false }).limit(12),
    supabase.from("partners").select("id, name, description, image_url, link").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("reviews").select("id, title, content, author_id, category, created_at, is_hidden").eq("is_hidden", false).order("created_at", { ascending: false }).limit(5),
    supabase.from("artist_profiles").select("id, user_id").limit(30),
    supabase.from("artist_photos").select("user_id, url").eq("is_main", true),
    supabase.from("profiles").select("id, name"),
  ])

  const photoMap = new Map((artistPhotos.data ?? []).map((p) => [p.user_id, p.url]))
  const nameMap = new Map((profiles.data ?? []).map((p) => [p.id, p.name]))
  const artists = (artistProfiles.data ?? []).map((ap) => ({
    id: ap.id,
    name: nameMap.get(ap.user_id) ?? "",
    profileImage: photoMap.get(ap.user_id) ?? null,
  }))

  // 에러 로깅 (graceful degradation 유지)
  const errors = [events, tours, news, partners, reviews, artistProfiles].filter((r) => r.error).map((r) => r.error?.message)
  if (errors.length > 0) console.error("[/api/home] query errors:", errors)

  return NextResponse.json(
    { events: events.data ?? [], tours: tours.data ?? [], news: news.data ?? [], partners: partners.data ?? [], reviews: reviews.data ?? [], artists },
    { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" } }
  )
}
