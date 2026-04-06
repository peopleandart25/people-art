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
  return (
    <>
      <HeroBanner />
      <ArtistSlider />
      <EventsSection />
      <CastingSection />
      <TourListSection />
      <NewsSection />
      <PartnershipSection />
      <ReviewSection />
      <FaqSection />
    </>
  )
}
