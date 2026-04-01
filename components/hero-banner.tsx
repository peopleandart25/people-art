"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { heroBanners, quickLinks as quickLinksData } from "@/data/content"
import { useUserSafe } from "@/contexts/user-context"
import { useToast } from "@/hooks/use-toast"

// 3D 스타일 아이콘 컴포넌트들
function Icon3DDocument() {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <defs>
        <linearGradient id="docGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f5f5f4" />
        </linearGradient>
        <linearGradient id="docGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <filter id="docShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.15"/>
        </filter>
      </defs>
      <g filter="url(#docShadow)">
        <path d="M16 8H40L48 16V56H16V8Z" fill="url(#docGrad1)" stroke="#e7e5e4" strokeWidth="1"/>
        <path d="M40 8V16H48L40 8Z" fill="#e7e5e4" />
        <rect x="22" y="24" width="20" height="3" rx="1.5" fill="url(#docGrad2)" />
        <rect x="22" y="32" width="16" height="2" rx="1" fill="#d6d3d1" />
        <rect x="22" y="38" width="18" height="2" rx="1" fill="#d6d3d1" />
        <rect x="22" y="44" width="14" height="2" rx="1" fill="#d6d3d1" />
      </g>
    </svg>
  )
}

function Icon3DDownload() {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <defs>
        <linearGradient id="dlGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
        <linearGradient id="dlGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fdba74" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>
        <filter id="dlShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.2"/>
        </filter>
      </defs>
      <g filter="url(#dlShadow)">
        <rect x="12" y="44" width="40" height="12" rx="3" fill="url(#dlGrad1)" />
        <rect x="14" y="46" width="36" height="8" rx="2" fill="#7c2d12" opacity="0.3" />
        <path d="M32 10V38" stroke="url(#dlGrad2)" strokeWidth="6" strokeLinecap="round" />
        <path d="M20 28L32 40L44 28" stroke="url(#dlGrad2)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
    </svg>
  )
}

function Icon3DHeadset() {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <defs>
        <linearGradient id="hsGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
        <linearGradient id="hsGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#78716c" />
          <stop offset="100%" stopColor="#57534e" />
        </linearGradient>
        <filter id="hsShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.2"/>
        </filter>
      </defs>
      <g filter="url(#hsShadow)">
        <path d="M12 32C12 21 21 12 32 12C43 12 52 21 52 32V36" stroke="url(#hsGrad2)" strokeWidth="4" fill="none" strokeLinecap="round"/>
        <rect x="8" y="32" width="10" height="18" rx="5" fill="url(#hsGrad1)" />
        <rect x="46" y="32" width="10" height="18" rx="5" fill="url(#hsGrad1)" />
        <rect x="10" y="34" width="6" height="14" rx="3" fill="#fdba74" opacity="0.4" />
        <rect x="48" y="34" width="6" height="14" rx="3" fill="#fdba74" opacity="0.4" />
        <path d="M46 50C46 54 40 58 32 58" stroke="url(#hsGrad2)" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <rect x="26" y="55" width="10" height="5" rx="2.5" fill="url(#hsGrad1)" />
      </g>
    </svg>
  )
}

function Icon3DCrown() {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <defs>
        <linearGradient id="crGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="crGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
        <filter id="crShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.2"/>
        </filter>
      </defs>
      <g filter="url(#crShadow)">
        <path d="M8 44L14 20L26 32L32 12L38 32L50 20L56 44H8Z" fill="url(#crGrad1)" />
        <path d="M8 44L14 20L26 32L32 12L38 32L50 20L56 44" fill="url(#crGrad2)" opacity="0.5" />
        <rect x="8" y="44" width="48" height="8" rx="2" fill="url(#crGrad1)" />
        <rect x="10" y="46" width="44" height="4" rx="1" fill="#92400e" opacity="0.2" />
        <circle cx="14" cy="20" r="3" fill="url(#crGrad2)" />
        <circle cx="32" cy="12" r="4" fill="url(#crGrad2)" />
        <circle cx="50" cy="20" r="3" fill="url(#crGrad2)" />
      </g>
    </svg>
  )
}

// 아이콘 타입 매핑
// [관리자 안내] iconType에 따라 3D 아이콘이 자동 선택됩니다
const iconMap: Record<string, React.ComponentType> = {
  document: Icon3DDocument,
  download: Icon3DDownload,
  headset: Icon3DHeadset,
  crown: Icon3DCrown,
}

// 데이터 파일에서 가져온 quickLinks를 아이콘 컴포넌트와 매핑
const quickLinks = quickLinksData.map((link) => ({
  ...link,
  Icon: iconMap[link.iconType] || Icon3DDocument,
}))

// [관리자 안내] 슬라이드 데이터는 data/content.ts의 heroBanners에서 관리합니다
// 배경색, 제목, 설명, CTA 버튼 등을 수정하면 자동 반영됩니다
const slides = heroBanners.map((banner) => ({
  id: banner.id,
  badge: banner.badge,
  title: banner.title[0],
  highlight: banner.title[1],
  description: banner.description,
  primaryBtn: banner.ctaButton,
  secondaryBtn: banner.secondaryButton,
  bgStyle: banner.backgroundImage 
    ? { backgroundImage: `url(${banner.backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: banner.backgroundColor },
}))

export function HeroBanner() {
  const router = useRouter()
  const { status } = useUserSafe()
  const { toast } = useToast()
  const [isMounted, setIsMounted] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [direction, setDirection] = useState<"left" | "right">("right")
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 로그인 상태 확인
  const isLoggedIn = isMounted && status !== "guest"

  // 프로필 양식 다운로드 핸들러
  const handleDownloadClick = (e: React.MouseEvent<HTMLAnchorElement>, linkId: string) => {
    // 프로필 양식 다운로드 버튼(id: "quick-2")인 경우에만 인증 체크
    if (linkId === "quick-2") {
      e.preventDefault()
      
      if (!isLoggedIn) {
        // 비로그인 상태: 로그인 페이지로 리다이렉트
        toast({
          title: "로그인이 필요합니다",
          description: "프로필 양식 다운로드는 로그인 후 이용 가능합니다.",
          variant: "destructive",
        })
        router.push("/login")
        return
      }
      
      // 로그인 상태: 같은 도메인 API 라우트로 다운로드
      window.location.href = "/api/download/template"
      
      toast({
        title: "다운로드 시작",
        description: "배우 프로필 양식 다운로드가 시작되었습니다.",
      })
    }
  }

  // 다음 슬라이드
  const nextSlide = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setDirection("right")
    setCurrentSlide((prev) => (prev + 1) % slides.length)
    setTimeout(() => setIsAnimating(false), 500)
  }, [isAnimating])

  // 이전 슬라이드
  const prevSlide = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setDirection("left")
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
    setTimeout(() => setIsAnimating(false), 500)
  }, [isAnimating])

  // 특정 슬라이드로 이동
  const goToSlide = (index: number) => {
    if (isAnimating || index === currentSlide) return
    setIsAnimating(true)
    setDirection(index > currentSlide ? "right" : "left")
    setCurrentSlide(index)
    setTimeout(() => setIsAnimating(false), 500)
  }

  // 자동 재생
  useEffect(() => {
    if (!isAutoPlaying) return
    const interval = setInterval(nextSlide, 5000)
    return () => clearInterval(interval)
  }, [isAutoPlaying, nextSlide])

  // 터치 스와이프 처리
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
    setIsAutoPlaying(false)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      nextSlide()
    } else if (isRightSwipe) {
      prevSlide()
    }

    setTimeout(() => setIsAutoPlaying(true), 3000)
  }

  const slide = slides[currentSlide]

  return (
    <section 
      className="relative overflow-hidden transition-all duration-700"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ ...slide.bgStyle, touchAction: "pan-y" }}
    >
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
          {/* Left Content - 애니메이션 적용 */}
          <div 
            key={currentSlide}
            className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary w-fit">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
              </span>
              {slide.badge}
            </div>
            
            <h1 className="text-3xl font-bold leading-tight text-foreground md:text-4xl lg:text-5xl text-balance">
              {slide.title}<br />
              <span className="text-primary">{slide.highlight}</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
              {slide.description}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              {slide.primaryBtn && (
                <Link href={slide.primaryBtn?.link ? slide.primaryBtn.link : "#"}>
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    {slide.primaryBtn?.text ? slide.primaryBtn.text : "바로가기"}
                  </Button>
                </Link>
              )}
              {slide.secondaryBtn && (
                <Link href={slide.secondaryBtn?.link ? slide.secondaryBtn.link : "#"}>
                  <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/5">
                    {slide.secondaryBtn?.text ? slide.secondaryBtn.text : "더 알아보기"}
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Right - Quick Links Grid */}
          <div className="grid grid-cols-2 gap-4">
            {quickLinks.map((link, index) => {
              // 외부 링크인 경우 (고객센터 등)
              const isExternal = "isExternal" in link && link.isExternal
              
              const linkContent = (
                <>
                  <div className="relative w-14 h-14 lg:w-16 lg:h-16 mb-3 transform group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-300">
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-2 bg-primary/10 rounded-full blur-sm opacity-60" />
                    <div className="relative z-10 w-full h-full">
                      <link.Icon />
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center text-center max-w-full h-[48px]" style={{ wordBreak: "keep-all" }}>
                    {link?.lines ? link.lines.map((line, lineIndex) => (
                      <span 
                        key={lineIndex} 
                        className="font-semibold text-foreground text-sm leading-snug"
                      >
                        {line ? line : "메뉴"}
                      </span>
                    )) : <span className="font-semibold text-foreground text-sm leading-snug">메뉴</span>}
                    {link?.sublabel && (
                      <span className="text-xs text-muted-foreground mt-0.5 leading-tight">
                        {link.sublabel}
                      </span>
                    )}
                  </div>
                </>
              )
              
              const className = "group relative flex flex-col items-center justify-center rounded-2xl bg-card p-5 border border-border transition-all duration-300 hover:shadow-xl hover:border-primary/40 hover:-translate-y-1 h-[160px] lg:h-[180px]"
              const style = { animation: `float 3s ease-in-out ${index * 0.15}s infinite` }
              
              // 외부 링크는 <a> 태그 사용
              if (isExternal) {
                return (
                  <a
                    key={link?.lines?.[0] ? link.lines[0] : `quick-link-${index}`}
                    href={link?.href ? link.href : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                    style={style}
                  >
                    {linkContent}
                  </a>
                )
              }
              
              // 내부 링크는 <Link> 컴포넌트 사용
              return (
                <Link
                  key={link?.lines?.[0] ? link.lines[0] : `quick-link-${index}`}
                  href={link?.href ? link.href : "#"}
                  onClick={(e) => handleDownloadClick(e, link.id)}
                  className={className}
                  style={style}
                >
                  {linkContent}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Slider Controls */}
        <div className="flex items-center justify-center gap-4 mt-8">
          {/* 좌측 화살표 */}
          <button
            onClick={prevSlide}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border text-foreground hover:bg-primary/10 hover:border-primary/40 transition-colors"
            aria-label="이전 슬라이드"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* 인디케이터 */}
          <div className="flex items-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? "w-8 bg-primary"
                    : "w-2.5 bg-border hover:bg-primary/40"
                }`}
                aria-label={`슬라이드 ${index + 1}`}
              />
            ))}
          </div>

          {/* 우측 화살표 */}
          <button
            onClick={nextSlide}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border text-foreground hover:bg-primary/10 hover:border-primary/40 transition-colors"
            aria-label="다음 슬라이드"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  )
}
