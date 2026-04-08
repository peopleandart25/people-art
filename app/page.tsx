import { createServiceClient } from "@/lib/supabase/server"
import { HeroBanner } from "@/components/hero-banner"

// ISR: 공개 데이터이므로 60초 단위 재생성 - 매 요청마다 9개 쿼리 실행 방지
export const revalidate = 60
import { ArtistSlider } from "@/components/artist-slider"
import { EventsSection } from "@/components/events-section"
import { CastingSection } from "@/components/casting-section"
import { TourListSection } from "@/components/tour-list-section"
import { NewsSection } from "@/components/news-section"
import { PartnershipSection } from "@/components/partnership-section"
import { ReviewSection } from "@/components/review-section"
import { FaqSection } from "@/components/faq-section"

export default async function Home() {
  const supabase = createServiceClient()

  const [
    { data: events },
    { data: tours },
    { data: news },
    { data: partners },
    { data: reviews },
    { data: banners },
    { data: castings },
    { data: artistProfiles },
    { data: artistPhotos },
  ] = await Promise.all([
    supabase.from("events").select("id, title, type, status, deadline, is_member_only").order("created_at", { ascending: false }).limit(6),
    supabase.from("tours").select("id, title, category, status, created_at").order("created_at", { ascending: false }).limit(6),
    supabase.from("news").select("id, title, image_url, published_at").eq("is_published", true).order("published_at", { ascending: false }).limit(12),
    supabase.from("partners").select("id, name, description, image_url, link").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("reviews").select("id, title, content, user_id, category, created_at, is_hidden, image_url").eq("is_hidden", false).order("created_at", { ascending: false }).limit(5),
    supabase.from("banners").select("id, title, image_url, link_url, sort_order").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("castings" as never).select("id, title, category, role_type, gender, birth_year_start, birth_year_end, deadline, location, fee, is_closed, is_urgent, created_at").eq("is_closed", false).order("created_at", { ascending: false }).limit(6),
    supabase.from("artist_profiles").select("id, user_id, show_in_artist_list, profiles(name)" as never).limit(30),
    supabase.from("artist_photos").select("user_id, url").eq("is_main", true),
  ])

  type ArtistProfileRow = { id: string; user_id: string; show_in_artist_list: boolean; profiles: { name: string } | null }
  const photoMap = new Map((artistPhotos ?? []).map((p) => [p.user_id, p.url]))
  const artists = ((artistProfiles ?? []) as unknown as ArtistProfileRow[]).map((ap) => {
    const showPhoto = ap.show_in_artist_list !== false
    return {
      id: ap.id,
      name: ap.profiles?.name ?? "",
      profileImage: showPhoto ? (photoMap.get(ap.user_id) ?? null) : null,
    }
  })

  return (
    <>
      <HeroBanner initialBanners={banners ?? []} />
      <ArtistSlider artists={artists} />
      <EventsSection events={(events ?? []) as never[]} />
      <CastingSection initialCastings={(castings ?? []) as never[]} />
      <TourListSection tours={(tours ?? []) as never[]} />
      <NewsSection newsItems={(news ?? []) as never[]} />
      <PartnershipSection partners={(partners ?? []) as never[]} />
      <ReviewSection rawReviews={reviews ?? []} />
      <FaqSection />
    </>
  )
}
