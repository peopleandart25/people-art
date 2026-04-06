"use client"

import { useState, useEffect } from "react"
import { HeroBanner } from "@/components/hero-banner"
import { ArtistSlider } from "@/components/artist-slider"
import { EventsSection } from "@/components/events-section"
import { CastingSection } from "@/components/casting-section"
import { TourListSection } from "@/components/tour-list-section"
import { NewsSection } from "@/components/news-section"
import { PartnershipSection } from "@/components/partnership-section"
import { ReviewSection } from "@/components/review-section"
import { FaqSection } from "@/components/faq-section"

export default function Home() {
  const [homeData, setHomeData] = useState<{
    events: Record<string, unknown>[]
    tours: Record<string, unknown>[]
    news: Record<string, unknown>[]
    partners: Record<string, unknown>[]
    reviews: Record<string, unknown>[]
    artists: { id: string; name: string; profileImage: string | null }[]
  }>({ events: [], tours: [], news: [], partners: [], reviews: [], artists: [] })

  useEffect(() => {
    fetch("/api/home")
      .then((r) => r.json())
      .then((d) => { if (d && typeof d === "object") setHomeData(d) })
  }, [])

  return (
    <>
      <HeroBanner />
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
