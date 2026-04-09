"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Calendar, Film, Tv, Video, Camera, Music, Folder, ArrowLeft, CheckCircle, LogIn } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { useAuth, ROLE_CASTING_DIRECTOR } from "@/hooks/use-auth"
import { MembershipRequiredDialog } from "@/components/membership-required-dialog"

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

function getDaysLeft(deadline: string | null): string {
  if (!deadline) return ""
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return "마감"
  if (diff === 0) return "D-0"
  return `D-${diff}`
}

function isNewCasting(createdAt: string): boolean {
  const diff = Date.now() - new Date(createdAt).getTime()
  return diff < 7 * 24 * 60 * 60 * 1000
}

const NOTICE_ITEMS = [
  "배우 프로필 제출 시 비매너 행위는 불이익이 있을 수 있습니다.",
  "제출 자료는 본 캐스팅 목적 이외에는 사용되지 않습니다.",
  "세부 일정은 캐스팅 확정 후 개별 공지됩니다.",
  "제출된 프로필은 반환되지 않습니다.",
]

export default function CastingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { status } = useUser()
  const { profile } = useAuth()
  const isCastingDirector = profile?.role === ROLE_CASTING_DIRECTOR

  const [casting, setCasting] = useState<Casting | null>(null)
  const [loading, setLoading] = useState(true)
  const [applied, setApplied] = useState(false)
  const [applying, setApplying] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showMembershipModal, setShowMembershipModal] = useState(false)
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

    if (status !== "premium" && status !== "admin" && !isCastingDirector) {
      setShowMembershipModal(true)
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
  const colorClass = categoryColors[casting.category] ?? "bg-gray-100 text-gray-500"
  const daysLeft = getDaysLeft(casting.deadline)
  const isExpired = daysLeft === "마감"
  const isNew = isNewCasting(casting.created_at)

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="mx-auto max-w-2xl px-4 lg:px-8 py-8">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </button>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge variant="secondary" className="flex items-center gap-1 text-xs">
            <Icon className="h-3 w-3" />
            {casting.category}
          </Badge>
          {casting.is_urgent && (
            <Badge className="bg-red-500 text-white text-xs">긴급</Badge>
          )}
          <Badge
            variant={casting.is_closed ? "secondary" : "outline"}
            className={
              casting.is_closed
                ? "bg-muted text-muted-foreground text-xs"
                : "border-green-500 text-green-600 bg-green-50 text-xs"
            }
          >
            {casting.is_closed ? "마감" : "모집중"}
          </Badge>
          {isNew && (
            <Badge className="bg-orange-500 text-white text-xs">NEW</Badge>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground lg:text-3xl mb-4 leading-snug">
          {casting.title}
        </h1>

        {/* Deadline row */}
        {casting.deadline && (
          <div className="flex items-center gap-3 mb-6">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              마감일: {casting.deadline.slice(0, 10)}
            </span>
            {daysLeft && (
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isExpired
                    ? "bg-muted text-muted-foreground"
                    : "bg-orange-100 text-orange-600"
                }`}
              >
                {isExpired ? "마감" : daysLeft}
              </span>
            )}
          </div>
        )}

        <hr className="border-border mb-6" />

        {/* Info grid: 모집 조건 + 활동 정보 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          {/* 모집 조건 */}
          {(casting.gender || casting.birth_year_start || casting.birth_year_end) && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded border border-border inline-block" />
                모집 조건
              </h2>
              <dl className="space-y-2 text-sm">
                {casting.gender && (
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground w-16 shrink-0">성별</dt>
                    <dd className="text-foreground">{casting.gender}</dd>
                  </div>
                )}
                {(casting.birth_year_start || casting.birth_year_end) && (
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground w-16 shrink-0">나이대</dt>
                    <dd className="text-foreground">
                      {casting.birth_year_start ?? "?"}~{casting.birth_year_end ?? "?"}년생
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* 활동 정보 */}
          {(casting.work_period || casting.location || casting.fee) && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded border border-border inline-block" />
                활동 정보
              </h2>
              <dl className="space-y-2 text-sm">
                {casting.work_period && (
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground w-20 shrink-0">촬영 일자</dt>
                    <dd className="text-foreground">{casting.work_period}</dd>
                  </div>
                )}
                {casting.location && (
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground w-20 shrink-0">촬영 장소</dt>
                    <dd className="text-foreground">{casting.location}</dd>
                  </div>
                )}
                {casting.fee && (
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground w-20 shrink-0">응모료</dt>
                    <dd className="text-foreground">{casting.fee}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>

        <hr className="border-border mb-6" />

        {/* Description */}
        {casting.description && (
          <>
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded border border-border inline-block" />
                작품 설명
              </h2>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {casting.description}
              </p>
            </div>
            <hr className="border-border mb-6" />
          </>
        )}

        {/* Requirements */}
        {casting.requirements && casting.requirements.length > 0 && (
          <>
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded border border-border inline-block" />
                지원 자격 및 모집사항
              </h2>
              <ul className="space-y-2">
                {casting.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
            <hr className="border-border mb-6" />
          </>
        )}

        {/* Notice box */}
        <div className="rounded-xl bg-orange-50 border border-orange-100 p-4 mb-6">
          <p className="text-sm font-semibold text-orange-700 mb-2">지원 시 유의사항</p>
          <ul className="space-y-1.5">
            {NOTICE_ITEMS.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5 text-xs text-orange-700">
                <span className="mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Fixed bottom apply button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-3">
        <div className="mx-auto max-w-2xl">
          {error && (
            <p className="text-xs text-red-500 mb-2 text-center">{error}</p>
          )}
          {isCastingDirector ? (
            <Button disabled className="w-full h-12 text-base bg-muted text-muted-foreground">
              본 공고는 아티스트를 위한 공고입니다.
            </Button>
          ) : applied ? (
            <Button disabled className="w-full h-12 text-base bg-green-100 text-green-700 border border-green-200 gap-2">
              <CheckCircle className="h-5 w-5" />
              지원 완료
            </Button>
          ) : (
            <Button
              onClick={handleApply}
              disabled={casting.is_closed || applying}
              className="w-full h-12 text-base bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
            >
              {casting.is_closed ? "마감된 공고입니다" : applying ? "지원 중..." : "이 공고에 지원하기"}
            </Button>
          )}
        </div>
      </div>

      <MembershipRequiredDialog
        open={showMembershipModal}
        onOpenChange={setShowMembershipModal}
        onConfirm={() => { setShowMembershipModal(false); router.push("/membership") }}
      />

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
