"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronRight, ChevronLeft, Newspaper } from "lucide-react"
import { Button } from "@/components/ui/button"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { createClient } from "@/lib/supabase/client"

type NewsItem = {
  id: string
  title: string
  image_url: string | null
  published_at: string | null
}

export function NewsSection() {
  const [isPaused, setIsPaused] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("news")
      .select("id, title, image_url, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(12)
      .then(({ data }) => {
        if (data) setNewsItems(data)
      })
  }, [])

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

  if (newsItems.length === 0) return null

  return (
    <section id="news" className="py-16 lg:py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground lg:text-3xl">NEWS</h2>
            <p className="text-muted-foreground mt-1">소식</p>
          </div>
          <Link
            href="/news"
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
              {newsItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex-[0_0_100%] min-w-0 pl-4 md:flex-[0_0_33.333%]"
                >
                  <Link href={`/news/${item.id}`}>
                    <Card className="group cursor-pointer border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/30 hover:-translate-y-1 overflow-hidden h-full">
                      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={item.title}
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
                          {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {item.published_at ? item.published_at.slice(0, 10) : ""}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              ))}
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
              {newsItems.map((_, index) => (
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
