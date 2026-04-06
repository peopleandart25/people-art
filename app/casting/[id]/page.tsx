"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Calendar, MapPin, Banknote, Clock, User, Users, Film, Tv, Video, Camera, Music, Folder, ArrowLeft, CheckCircle, LogIn } from "lucide-react"
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
  work_period: string | null
  location: string | null
  fee: string | null
  description: string | null
  requirements: string[] | null
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

export default function CastingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { status } = useUser()

  const [casting, setCasting] = useState<Casting | null>(null)
  const [loading, setLoading] = useState(true)
  const [applied, setApplied] = useState(false)
  const [applying, setApplying] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/castings/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) { router.replace("/casting"); return }
        setCasting(data)
        setLoading(false)
      })
  }, [id, router])

  useEffect(() => {
    if (status !== "guest") {
      fetch(`/api/castings/${id}/apply`)
        .then((res) => res.json())
        .then((data) => setApplied(data.applied ?? false))
    }
  }, [id, status])

  const handleApply = async () => {
    if (status === "guest") {
      setShowLoginModal(true)
      return
    }

    setApplying(true)
    setError(null)
    try {
      const res = await fetch(`/api/castings/${id}/apply`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "지원 실패")
        return
      }
      setApplied(true)
      setShowSuccessModal(true)
    } catch {
      setError("지원 중 오류가 발생했습니다.")
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!casting) return null

  const Icon = categoryIcons[casting.category] ?? Folder

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 lg:px-8 py-12">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6 gap-2 text-muted-foreground"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Icon className="h-3 w-3" />
              {casting.category}
            </Badge>
            {casting.is_urgent && (
              <Badge className="bg-red-500 text-white">긴급</Badge>
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
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">{casting.title}</h1>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {casting.role_type && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
              <User className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">역할</p>
                <p className="font-medium text-foreground">{casting.role_type}</p>
              </div>
            </div>
          )}
          {casting.gender && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
              <Users className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">성별</p>
                <p className="font-medium text-foreground">{casting.gender}</p>
              </div>
            </div>
          )}
          {(casting.birth_year_start || casting.birth_year_end) && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
              <Calendar className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">출생년도</p>
                <p className="font-medium text-foreground">
                  {casting.birth_year_start ?? "?"}~{casting.birth_year_end ?? "?"}년
                </p>
              </div>
            </div>
          )}
          {casting.deadline && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
              <Calendar className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">마감일</p>
                <p className="font-medium text-foreground">{casting.deadline.slice(0, 10)}</p>
              </div>
            </div>
          )}
          {casting.work_period && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
              <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">촬영 기간</p>
                <p className="font-medium text-foreground">{casting.work_period}</p>
              </div>
            </div>
          )}
          {casting.location && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
              <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">촬영 장소</p>
                <p className="font-medium text-foreground">{casting.location}</p>
              </div>
            </div>
          )}
          {casting.fee && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
              <Banknote className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">출연료</p>
                <p className="font-medium text-foreground">{casting.fee}</p>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {casting.description && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">공고 내용</h2>
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {casting.description}
              </p>
            </div>
          </div>
        )}

        {/* Requirements */}
        {casting.requirements && casting.requirements.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-3">지원 조건</h2>
            <ul className="space-y-2">
              {casting.requirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="text-primary mt-0.5">•</span>
                  {req}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Apply Button */}
        {error && (
          <p className="text-sm text-red-500 mb-3 text-center">{error}</p>
        )}
        <div className="sticky bottom-4">
          {applied ? (
            <Button
              disabled
              className="w-full h-12 text-base bg-green-100 text-green-700 border border-green-200 gap-2"
            >
              <CheckCircle className="h-5 w-5" />
              지원 완료
            </Button>
          ) : (
            <Button
              onClick={handleApply}
              disabled={casting.is_closed || applying}
              className="w-full h-12 text-base bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
            >
              {casting.is_closed ? "마감된 공고입니다" : applying ? "지원 중..." : "지원하기"}
            </Button>
          )}
        </div>
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
              캐스팅 지원은 <span className="font-semibold text-foreground">로그인 후</span> 가능합니다.
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
            <Button variant="ghost" onClick={() => setShowLoginModal(false)} className="w-full">닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-center text-xl">지원이 완료되었습니다!</DialogTitle>
            <DialogDescription className="text-center pt-2">
              캐스팅 지원이 정상적으로 접수되었습니다.
              <br />결과는 개별 연락드릴 예정입니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button onClick={() => setShowSuccessModal(false)} className="w-full">확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
