"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronRight, ChevronLeft, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { partnersData } from "@/data/content"

/**
 * [관리자 안내]
 * PARTNERSHIP 섹션 데이터는 data/content.ts의 partnersData에서 관리합니다.
 * - 제휴업체 항목: partnersData.items (이미지, 이름, 카테고리, 링크)
 * - 섹션 제목: partnersData.sectionTitle, partnersData.sectionSubtitle
 * - 전체보기 링크: partnersData.viewAllLink
 */

export function PartnershipSection() {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const autoplayPlugin = Autoplay({
    delay: 4000,
    stopOnInteraction: false,
    stopOnMouseEnter: true,
  })

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      slidesToScroll: 1,
    },
    [autoplayPlugin]
  )

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    return () => {
      emblaApi.off("select", onSelect)
    }
  }, [emblaApi, onSelect])

  return (
    <section id="partnership" className="py-20 lg:py-28 bg-background">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground lg:text-3xl">
              {partnersData.sectionTitle}
            </h2>
            <p className="text-muted-foreground mt-1">{partnersData.sectionSubtitle}</p>
          </div>
          <Link
            href="/partners"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            전체보기
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <p className="text-muted-foreground mb-10">{partnersData.description}</p>

        {/* Partners Carousel */}
        <div className="relative">
          <div ref={emblaRef} className="overflow-hidden rounded-2xl">
            <div className="flex -ml-4">
              {partnersData.items.map((partner, index) => {
                const partnerId = partner?.id ? partner.id : `partner-${index}`
                const partnerLink = partner?.link ? partner.link : "#"
                const partnerName = partner?.name ? partner.name : "업체명"
                const partnerCategory = partner?.category ? partner.category : ""
                const partnerImage = partner?.image ? partner.image : ""
                
                return (
                <div
                  key={partnerId}
                  className="flex-[0_0_100%] min-w-0 pl-4 md:flex-[0_0_33.333%]"
                >
                  <a href={partnerLink} target="_blank" rel="noopener noreferrer">
                    <Card className="group cursor-pointer border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/30 hover:-translate-y-1 overflow-hidden h-full">
                      {/* 이미지 영역 */}
                      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                        {partnerImage ? (
                          <Image
                            src={partnerImage}
                            alt={partnerName}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                            <Building2 className="h-12 w-12 text-primary/50" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4 text-center">
                        <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                          {partnerName}
                        </h3>
                        <p className="text-sm text-primary">{partnerCategory}</p>
                      </CardContent>
                    </Card>
                  </a>
                </div>
              )
              })}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button
              variant="outline"
              size="icon"
              onClick={scrollPrev}
              className="rounded-full h-10 w-10 border-border"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex gap-2">
              {partnersData.items.map((_, index) => (
                <button
                  key={index}
                  onClick={() => emblaApi?.scrollTo(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    index === selectedIndex
                      ? "bg-primary w-6"
                      : "bg-muted-foreground/30 w-2.5 hover:bg-muted-foreground/50"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={scrollNext}
              className="rounded-full h-10 w-10 border-border"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
