"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { User } from "lucide-react"
import Autoplay from "embla-carousel-autoplay"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { useUserSafe, isLoggedIn as checkLoggedIn } from "@/contexts/user-context"
import { useToast } from "@/hooks/use-toast"

type SliderArtist = { id: string; name: string; profileImage: string | null }

export function ArtistSlider({ artists = [] }: { artists?: SliderArtist[] }) {
  const router = useRouter()
  const { status } = useUserSafe()
  const { toast } = useToast()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const isLoggedIn = isMounted && checkLoggedIn(status)

  const handleArtistClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isLoggedIn) {
      e.preventDefault()
      toast({
        title: "로그인이 필요합니다",
        description: "로그인 및 회원가입 후 이용할 수 있습니다.",
        variant: "destructive",
      })
      router.push("/login")
    }
  }

  if (!isMounted || artists.length === 0) {
    return null
  }

  return (
    <section className="w-full py-12 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 섹션 헤더 - EVENT 섹션과 동일한 왼쪽 정렬 스타일 */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
              ARTIST
            </h2>
            <p className="text-muted-foreground text-sm md:text-base">
              다양한 분야에서 활동하는 아티스트들을 만나보세요
            </p>
          </div>
          <Link
            href="/artists"
            onClick={handleArtistClick}
            className="hidden sm:flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            전체보기
            <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* 자동 무한 슬라이더 */}
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 3000,
              stopOnInteraction: false,
              stopOnMouseEnter: true,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {artists.map((artist) => (
              <CarouselItem
                key={artist.id}
                className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/6"
              >
                <Link
                  href={`/artists/${artist.id}`}
                  onClick={handleArtistClick}
                  className="block group"
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
                    {artist.profileImage ? (
                      <Image
                        src={artist.profileImage}
                        alt={artist.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <User className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    
                    {/* 호버 오버레이 (이름 표시) */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-sm font-medium truncate">
                          {artist.name}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* 모바일 전체 보기 버튼 */}
        <div className="mt-6 sm:hidden text-center">
          <Link
            href="/artists"
            onClick={handleArtistClick}
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            전체보기
            <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
