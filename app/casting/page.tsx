"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar, Search, Film, Tv, Video, Camera, Music, Folder } from "lucide-react"
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
  location: string | null
  fee: string | null
  is_closed: boolean
  is_urgent: boolean
  created_at: string
}

const categoryIcons: Record<string, React.ElementType> = {
  "영화": Film,
  "드라마": Tv,
  "웹드라마": Video,
  "광고": Camera,
  "뮤직비디오": Music,
  "기타": Folder,
}

const CATEGORIES = ["전체", "영화", "드라마", "웹드라마", "광고", "뮤직비디오", "기타"]

function getDaysLeft(deadline: string | null): string {
  if (!deadline) return "마감일 미정"
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return "마감"
  if (diff === 0) return "오늘 마감"
  return `D-${diff}`
}

export default function CastingPage() {
  const router = useRouter()
  const { status } = useUser()
  const [castings, setCastings] = useState<Casting[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [category, setCategory] = useState("전체")
  const [includeClosed, setIncludeClosed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set("search", debouncedSearch)
    if (category !== "전체") params.set("category", category)
    if (includeClosed) params.set("include_closed", "true")

    setLoading(true)
    fetch(`/api/castings?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCastings(data)
        setLoading(false)
      })
  }, [debouncedSearch, category, includeClosed])

  const handleCardClick = (id: string) => {
    if (status === "guest") {
      router.push("/login")
      return
    }
    router.push(`/casting/${id}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">캐스팅 공고</h1>
          <p className="text-muted-foreground mt-2">다양한 캐스팅 기회를 확인하세요</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="공고 제목 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="카테고리" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeClosed}
              onChange={(e) => setIncludeClosed(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            마감 공고 포함
          </label>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col overflow-hidden rounded-lg border border-border">
                <div className="p-6 pb-3 flex items-center justify-between">
                  <div className="h-5 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-5 w-12 bg-muted animate-pulse rounded" />
                </div>
                <div className="px-6 pb-4 flex-1 space-y-2">
                  <div className="h-4 w-full bg-muted animate-pulse rounded" />
                  <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                </div>
                <div className="px-6 pt-0 pb-6 flex items-center justify-between">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : castings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-muted-foreground gap-2">
            <Film className="h-12 w-12 opacity-30" />
            <p>공고가 없습니다</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {castings.map((casting) => {
              const Icon = categoryIcons[casting.category] ?? Folder
              const daysLeft = getDaysLeft(casting.deadline)
              return (
                <Card
                  key={casting.id}
                  onClick={() => handleCardClick(casting.id)}
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
                        <p>{casting.role_type}{casting.gender ? ` · ${casting.gender}` : ""}</p>
                      )}
                      {(casting.birth_year_start || casting.birth_year_end) && (
                        <p>출생: {casting.birth_year_start ?? "?"}~{casting.birth_year_end ?? "?"}년</p>
                      )}
                      {casting.location && <p>{casting.location}</p>}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{daysLeft}</span>
                    </div>
                    <Button
                      size="sm"
                      variant={casting.is_closed ? "secondary" : "default"}
                      className="text-xs"
                      disabled={casting.is_closed}
                    >
                      {casting.is_closed ? "마감됨" : "지원하기"}
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
