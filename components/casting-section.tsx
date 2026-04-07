"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronRight, Calendar, Film, Tv, Video, Camera, Music, Folder, LogIn, UserPlus } from "lucide-react"
import { useUser } from "@/contexts/user-context"

type Casting = {
  id: string
  title: string
  category: string
  role_type: string | null
  gender: string | null
  birth_year_start: number | null
  birth_year_end: number | null
  deadline: string | null
  is_closed: boolean
  is_urgent: boolean
  production_company?: string | null
  fee?: string | null
}

const categoryIcons: Record<string, React.ElementType> = {
  "영화": Film,
  "드라마": Tv,
  "웹드라마": Video,
  "광고": Camera,
  "뮤직비디오": Music,
  "기타": Folder,
}

const categoryColors: Record<string, string> = {
  "영화": "bg-purple-100 text-purple-600",
  "드라마": "bg-sky-100 text-sky-600",
  "웹드라마": "bg-sky-100 text-sky-600",
  "광고": "bg-green-100 text-green-600",
  "뮤직비디오": "bg-blue-100 text-blue-600",
  "기타": "bg-gray-100 text-gray-500",
}

function getDaysLeft(deadline: string | null): string {
  if (!deadline) return "마감일 미정"
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return "마감"
  if (diff === 0) return "D-0"
  return `D-${diff}`
}

function CastingCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="h-10 w-10 bg-muted animate-pulse rounded-lg" />
        <div className="flex gap-1">
          <div className="h-5 w-14 bg-muted animate-pulse rounded-full" />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-4 w-full bg-muted animate-pulse rounded" />
        <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
      </div>
      <div className="h-3.5 w-1/2 bg-muted animate-pulse rounded" />
      <div className="h-3.5 w-2/3 bg-muted animate-pulse rounded" />
    </div>
  )
}

function CastingCard({ casting, onClick }: { casting: Casting; onClick: () => void }) {
  const Icon = categoryIcons[casting.category] ?? Folder
  const colorClass = categoryColors[casting.category] ?? "bg-gray-100 text-gray-500"
  const daysLeft = getDaysLeft(casting.deadline)
  const isExpired = daysLeft === "마감"

  return (
    <div
      onClick={onClick}
      className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
    >
      {/* Top row: icon + badges */}
      <div className="flex items-start justify-between">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex items-center gap-1 flex-wrap justify-end">
          <Badge variant="secondary" className="text-xs px-2 py-0.5">{casting.category}</Badge>
          {casting.is_urgent && (
            <Badge className="bg-red-500 text-white text-xs px-2 py-0.5">긴급</Badge>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="font-bold text-foreground line-clamp-2 leading-snug text-sm">
        {casting.title}
      </h3>

      {/* Role info */}
      {(casting.gender || casting.birth_year_start || casting.birth_year_end) && (
        <p className="text-xs text-muted-foreground">
          {[
            casting.gender,
            (casting.birth_year_start || casting.birth_year_end)
              ? `${casting.birth_year_start ?? "?"}~${casting.birth_year_end ?? "?"}년생`
              : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}

      {/* Bottom meta */}
      <div className="mt-auto flex flex-col gap-1">
        {casting.production_company && (
          <p className="text-xs text-muted-foreground">{casting.production_company}</p>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {casting.deadline && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {casting.deadline.slice(0, 10)}
            </span>
          )}
          {casting.deadline && (
            <span
              className={
                isExpired
                  ? "text-muted-foreground"
                  : "text-orange-500 font-medium"
              }
            >
              {isExpired ? "마감" : daysLeft}
            </span>
          )}
        </div>
        {casting.fee && (
          <p className="text-xs text-muted-foreground">출연료: {casting.fee}</p>
        )}
      </div>
    </div>
  )
}

export function CastingSection() {
  const router = useRouter()
  const { status } = useUser()
  const [castings, setCastings] = useState<Casting[]>([])
  const [loading, setLoading] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    fetch("/api/castings?limit=6")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCastings(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleCardClick = (casting: Casting) => {
    if (status === "guest") {
      setShowLoginModal(true)
      return
    }
    router.push(`/casting/${casting.id}`)
  }

  if (!loading && castings.length === 0) return null

  return (
    <section id="casting" className="py-16 lg:py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-1">CASTING</p>
            <h2 className="text-2xl font-bold text-foreground lg:text-3xl">캐스팅 공고</h2>
          </div>
          <a
            href="/casting"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            전체보기
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>

        {/* Castings Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <CastingCardSkeleton key={i} />)
            : castings.map((casting) => (
                <CastingCard
                  key={casting.id}
                  casting={casting}
                  onClick={() => handleCardClick(casting)}
                />
              ))}
        </div>

        {/* Login Required Modal */}
        <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
          <DialogContent className="sm:max-w-md bg-card">
            <DialogHeader>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <LogIn className="h-8 w-8 text-primary" />
              </div>
              <DialogTitle className="text-center text-xl">로그인이 필요합니다</DialogTitle>
              <DialogDescription className="text-center pt-2">
                캐스팅 공고는 <span className="font-semibold text-foreground">로그인 후</span> 확인 가능합니다.
                <br />
                로그인하고 다양한 캐스팅 기회를 만나보세요!
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-4">
              <Button
                onClick={() => { setShowLoginModal(false); router.push("/login") }}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              >
                <LogIn className="h-4 w-4" />
                로그인하기
              </Button>
              <Button
                variant="outline"
                onClick={() => { setShowLoginModal(false); router.push("/login") }}
                className="w-full gap-2"
              >
                <UserPlus className="h-4 w-4" />
                회원가입
              </Button>
              <Button variant="ghost" onClick={() => setShowLoginModal(false)} className="w-full">
                닫기
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}
