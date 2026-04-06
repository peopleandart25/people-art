"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ChevronRight, Calendar, Film, Tv, Video, Camera, Music, Folder, LogIn, UserPlus } from "lucide-react"
import { useUser } from "@/contexts/user-context"

function CastingCardSkeleton() {
  return (
    <Card className="flex flex-col overflow-hidden border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-20 bg-muted animate-pulse rounded" />
          <div className="h-5 w-12 bg-muted animate-pulse rounded" />
        </div>
      </CardHeader>
      <CardContent className="pb-4 flex-1">
        <div className="h-4 w-full bg-muted animate-pulse rounded mb-2" />
        <div className="h-4 w-2/3 bg-muted animate-pulse rounded mb-1" />
        <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
      </CardContent>
      <CardFooter className="pt-0 mt-auto flex items-center justify-between">
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        <div className="h-8 w-16 bg-muted animate-pulse rounded" />
      </CardFooter>
    </Card>
  )
}

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
}

const categoryIcons: Record<string, React.ElementType> = {
  "영화": Film,
  "드라마": Tv,
  "웹드라마": Video,
  "광고": Camera,
  "뮤직비디오": Music,
  "기타": Folder,
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
            <h2 className="text-2xl font-bold text-foreground lg:text-3xl">CASTING</h2>
            <p className="text-muted-foreground mt-1">캐스팅 공고 모집</p>
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <CastingCardSkeleton key={i} />)
            : castings.map((casting) => {
            const Icon = categoryIcons[casting.category] ?? Folder
            return (
              <Card
                key={casting.id}
                onClick={() => handleCardClick(casting)}
                className="group flex flex-col overflow-hidden border border-border transition-all hover:shadow-lg hover:border-primary/30 cursor-pointer"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Icon className="h-3 w-3" />
                      {casting.category}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {casting.is_urgent && (
                        <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5">긴급</Badge>
                      )}
                      <Badge
                        variant={casting.is_closed ? "secondary" : "outline"}
                        className={
                          casting.is_closed
                            ? "bg-muted text-muted-foreground"
                            : "border-green-500 text-green-600 bg-green-50"
                        }
                      >
                        {casting.is_closed ? "마감" : "모집중"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4 flex-1">
                  <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {casting.title}
                  </h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {casting.role_type && (
                      <p>{casting.role_type} {casting.gender && `· ${casting.gender}`}</p>
                    )}
                    {(casting.birth_year_start || casting.birth_year_end) && (
                      <p>
                        출생년도: {casting.birth_year_start ?? "?"}~{casting.birth_year_end ?? "?"}년
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-0 mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{casting.deadline ? casting.deadline.slice(0, 10) : "마감일 미정"}</span>
                  </div>
                  <Button
                    size="sm"
                    variant={casting.is_closed ? "secondary" : "default"}
                    className="text-xs"
                    disabled={casting.is_closed}
                  >
                    {casting.is_closed ? "마감" : "지원하기"}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
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
