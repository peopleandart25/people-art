"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { HeroBanner } from "@/components/hero-banner"
import { ArtistSlider } from "@/components/artist-slider"
import { EventsSection } from "@/components/events-section"
import { CastingSection } from "@/components/casting-section"
import { TourListSection } from "@/components/tour-list-section"
import { NewsSection } from "@/components/news-section"
import { PartnershipSection } from "@/components/partnership-section"
import { ReviewSection } from "@/components/review-section"
import { FaqSection } from "@/components/faq-section"
import { Badge } from "@/components/ui/badge"
import { Send } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export default function Home() {
  const { isLoggedIn, isPremium, profile } = useAuth()
  const [homeData, setHomeData] = useState<{
    events: Record<string, unknown>[]
    tours: Record<string, unknown>[]
    news: Record<string, unknown>[]
    partners: Record<string, unknown>[]
    reviews: Record<string, unknown>[]
    artists: { id: string; name: string; profileImage: string | null }[]
  }>({ events: [], tours: [], news: [], partners: [], reviews: [], artists: [] })
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    fetch("/api/home")
      .then((r) => r.json())
      .then((d) => { if (d && typeof d === "object") setHomeData(d) })
  }, [])

  useEffect(() => {
    if (!isLoggedIn || !isPremium) return
    if (profile?.role === "casting_director" || profile?.role === "admin") return
    fetch("/api/artist/proposals?count=true")
      .then((r) => r.json())
      .then((d) => { if (typeof d?.count === "number") setPendingCount(d.count) })
  }, [isLoggedIn, isPremium, profile?.role])

  const showArtistTiles =
    isLoggedIn &&
    isPremium &&
    profile?.role !== "casting_director" &&
    profile?.role !== "admin"

  return (
    <>
      <HeroBanner />
      {showArtistTiles && (
        <section className="py-6 bg-primary/5 border-y border-primary/10">
          <div className="container mx-auto px-4">
            <p className="text-xs font-semibold text-primary mb-3 uppercase tracking-wide">프리미엄 멤버 메뉴</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/received-proposals">
                <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-white px-4 py-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 py-0">
                    PREMIUM
                  </Badge>
                  <Send className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">받은 제안</span>
                  {pendingCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                      {pendingCount}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          </div>
        </section>
      )}
      <ArtistSlider artists={homeData.artists} />
      <EventsSection events={homeData.events as never[]} />
      <CastingSection />
      <TourListSection tours={homeData.tours as never[]} />
      <NewsSection newsItems={homeData.news as never[]} />
      <PartnershipSection partners={homeData.partners as never[]} />
      <ReviewSection rawReviews={homeData.reviews} />
      <FaqSection />
    </>
  )
}
