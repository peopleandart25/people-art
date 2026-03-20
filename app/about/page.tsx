import { Metadata } from "next"
import { aboutPageData } from "@/data/content"
import { AboutHero } from "@/components/about/about-hero"
import { AboutDirectSystem } from "@/components/about/about-direct-system"
import { AboutServices } from "@/components/about/about-services"
import { AboutCta } from "@/components/about/about-cta"

export const metadata: Metadata = {
  title: "회사 소개 | 피플앤아트",
  description:
    "피플앤아트는 배우의 프로필이 실제 캐스팅 현장에 도달할 수 있도록 설계된 프로필 전달 및 기회 연결 플랫폼입니다.",
}

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <AboutHero data={aboutPageData.hero} />

      {/* Direct System Section */}
      <AboutDirectSystem data={aboutPageData.directSystem} />

      {/* Services Section */}
      <AboutServices data={aboutPageData.services} />

      {/* CTA Section */}
      <AboutCta data={aboutPageData.cta} />
    </>
  )
}
