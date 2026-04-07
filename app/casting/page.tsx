"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  production_company?: string | null
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

const CATEGORIES = ["전체", "영화", "드라마", "웹드라마", "광고", "뮤직비디오", "기타"]

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
      <div className="mx-auto max-w-4xl px-4 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-1">CASTING</p>
          <h1 className="text-3xl font-bold text-foreground">캐스팅 공고</h1>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8 items-start sm:items-center">
          <div className="relative flex-1 w-full">
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
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none whitespace-nowrap">
            <input
              type="checkbox"
              checked={includeClosed}
              onChange={(e) => setIncludeClosed(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            마감 공고 포함
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setSearch(""); setCategory("전체"); setIncludeClosed(false) }}
            className="whitespace-nowrap"
          >
            전체 보기
          </Button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <CastingCardSkeleton key={i} />
            ))}
          </div>
        ) : castings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-muted-foreground gap-2">
            <Film className="h-12 w-12 opacity-30" />
            <p>공고가 없습니다</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {castings.map((casting) => {
              const Icon = categoryIcons[casting.category] ?? Folder
              const colorClass = categoryColors[casting.category] ?? "bg-gray-100 text-gray-500"
              const daysLeft = getDaysLeft(casting.deadline)
              const isExpired = daysLeft === "마감"

              return (
                <div
                  key={casting.id}
                  onClick={() => handleCardClick(casting.id)}
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
                        <span className={isExpired ? "text-muted-foreground" : "text-orange-500 font-medium"}>
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
            })}
          </div>
        )}
      </div>
    </div>
  )
}
