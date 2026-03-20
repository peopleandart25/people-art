"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronRight, ChevronLeft, Newspaper } from "lucide-react"
import { Button } from "@/components/ui/button"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { newsData } from "@/data/content"

/**
 * [관리자 안내]
 * NEWS 섹션 데이터는 data/content.ts의 newsData에서 관리합니다.
 * - 뉴스 항목: newsData.items (이미지, 제목, 날짜, 링크)
 * - 섹션 제목: newsData.sectionTitle, newsData.sectionSubtitle
 * - 전체보기 링크: newsData.viewAllLink
 */

export function NewsSection() {
  const [isPaused, setIsPaused] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const autoplayPlugin = Autoplay({
    delay: 3500,
    stopOnInteraction: false,
    stopOnMouseEnter: true,
  })

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      slidesToScroll: 1,
      breakpoints: {
        "(min-width: 768px)": { slidesToScroll: 1 },
      },
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
    <section id="news" className="py-16 lg:py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground lg:text-3xl">
              {newsData.sectionTitle}
            </h2>
            <p className="text-muted-foreground mt-1">{newsData.sectionSubtitle}</p>
          </div>
          <Link
            href={newsData.viewAllLink ? newsData.viewAllLink : "#"}
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            전체보기
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* News Carousel */}
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div ref={emblaRef} className="overflow-hidden rounded-2xl">
            <div className="flex -ml-4">
              {newsData.items.map((item, index) => {
                const itemId = item?.id ? item.id : `news-item-${index}`
                const itemLink = item?.id ? `/news/${item.id.replace("news-", "")}` : "#"
                const itemTitle = item?.title ? item.title : "제목 없음"
                const itemDate = item?.date ? item.date : ""
                const itemImage = item?.image ? item.image : ""
                
                return (
                <div
                  key={itemId}
                  className="flex-[0_0_100%] min-w-0 pl-4 md:flex-[0_0_33.333%]"
                >
                  <Link href={itemLink}>
                    <Card className="group cursor-pointer border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/30 hover:-translate-y-1 overflow-hidden h-full">
                      {/* 이미지 영역 */}
                      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                        {itemImage ? (
                          <Image
                            src={itemImage}
                            alt={itemTitle}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                            <Newspaper className="h-12 w-12 text-primary/50" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                          {itemTitle}
                        </h3>
                        <p className="text-sm text-muted-foreground">{itemDate}</p>
                      </CardContent>
                    </Card>
                  </Link>
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
              {newsData.items.map((_, index) => (
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
