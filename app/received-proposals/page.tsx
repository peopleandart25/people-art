"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Crown, ChevronRight, Building2, Calendar, Clock, MapPin, Coins, ArrowLeft, X, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Proposal = {
  id: string
  status: "pending" | "accepted" | "rejected"
  message: string | null
  created_at: string
  expires_at: string | null
  casting_id: string | null
  director_id: string
  director_name: string
  director_company: string | null
  casting_title: string | null
  casting_category: string | null
  casting_role_type: string | null
  casting_location: string | null
  casting_work_period: string | null
  casting_fee: string | null
  casting_deadline: string | null
}

function StatusBadge({ status }: { status: Proposal["status"] }) {
  if (status === "pending")
    return <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">응답 대기</Badge>
  if (status === "accepted")
    return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">수락 완료</Badge>
  return <Badge className="bg-gray-100 text-gray-500 border-gray-200 text-xs">거절</Badge>
}

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return null
  return <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">{category}</Badge>
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\. /g, "-").replace(".", "")
}

function isExpiringSoon(iso: string | null) {
  if (!iso) return false
  return new Date(iso) > new Date() && (new Date(iso).getTime() - Date.now()) < 3 * 24 * 60 * 60 * 1000
}

export default function ReceivedProposalsPage() {
  const router = useRouter()
  const { isLoggedIn, isPremium, loading } = useAuth()
  const { toast } = useToast()

  const [proposals, setProposals] = useState<Proposal[]>([])
  const [fetching, setFetching] = useState(true)
  const [selected, setSelected] = useState<Proposal | null>(null)
  const [responding, setResponding] = useState(false)

  const fetchProposals = useCallback(async () => {
    setFetching(true)
    try {
      const res = await fetch("/api/artist/proposals")
      if (res.ok) setProposals(await res.json())
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    if (loading) return
    if (!isLoggedIn) { router.push("/login"); return }
    if (isPremium) fetchProposals()
    else setFetching(false)
  }, [loading, isLoggedIn, isPremium, router, fetchProposals])

  const handleRespond = async (proposalId: string, status: "accepted" | "rejected") => {
    setResponding(true)
    try {
      const res = await fetch("/api/artist/proposals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposal_id: proposalId, status }),
      })
      if (res.ok) {
        toast({ title: status === "accepted" ? "제안을 수락했습니다." : "제안을 거절했습니다." })
        setSelected(null)
        await fetchProposals()
      } else {
        const err = await res.json()
        toast({ title: "오류가 발생했습니다.", description: err.error, variant: "destructive" })
      }
    } finally {
      setResponding(false)
    }
  }

  const pending = proposals.filter((p) => p.status === "pending").length
  const accepted = proposals.filter((p) => p.status === "accepted").length
  const rejected = proposals.filter((p) => p.status === "rejected").length

  if (loading || fetching) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64 mb-6" />
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    )
  }

  if (!isPremium) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center py-16">
          <Crown className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">멤버십 전용 기능</h2>
          <p className="text-muted-foreground mb-4">받은 캐스팅 제안 확인은 프리미엄 멤버십 전용 기능입니다.</p>
          <Button onClick={() => router.push("/membership")}>멤버십 가입하기</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-1">
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">받은 캐스팅 제안</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6 ml-8">캐스팅 디렉터로부터 받은 제안을 확인하세요</p>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border bg-orange-50 border-orange-100 p-4 text-center">
          <p className="text-2xl font-bold text-orange-500">{pending}</p>
          <p className="text-xs text-muted-foreground mt-1">응답 대기</p>
        </div>
        <div className="rounded-xl border bg-green-50 border-green-100 p-4 text-center">
          <p className="text-2xl font-bold text-green-500">{accepted}</p>
          <p className="text-xs text-muted-foreground mt-1">수락</p>
        </div>
        <div className="rounded-xl border bg-gray-50 border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-gray-400">{rejected}</p>
          <p className="text-xs text-muted-foreground mt-1">거절</p>
        </div>
      </div>

      {/* 멤버십 안내 */}
      <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 mb-6">
        <Crown className="h-4 w-4 text-amber-500 shrink-0" />
        <p className="text-sm text-amber-700">멤버십 회원만 캐스팅 제안을 받을 수 있습니다</p>
      </div>

      {/* 제안 목록 */}
      {proposals.length === 0 ? (
        <div className="rounded-xl border bg-card py-16 text-center text-muted-foreground">
          <p className="text-sm">받은 캐스팅 제안이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {proposals.map((proposal) => (
            <div
              key={proposal.id}
              className="rounded-xl border bg-card px-5 py-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelected(proposal)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* 뱃지 행 */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <CategoryBadge category={proposal.casting_category} />
                    <StatusBadge status={proposal.status} />
                  </div>

                  {/* 제목 */}
                  <p className="font-semibold text-base leading-snug mb-0.5 truncate">
                    {proposal.casting_title ?? "캐스팅 제안"}
                  </p>

                  {/* 역할 */}
                  {proposal.casting_role_type && (
                    <p className="text-sm text-muted-foreground mb-2">{proposal.casting_role_type}</p>
                  )}

                  {/* 메타 정보 */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {proposal.director_company && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {proposal.director_company}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(proposal.created_at)}
                    </span>
                    {proposal.expires_at && (
                      <span className={`flex items-center gap-1 ${isExpiringSoon(proposal.expires_at) || proposal.status === "pending" ? "text-red-500 font-medium" : ""}`}>
                        <Clock className="h-3 w-3" />
                        {formatDate(proposal.expires_at)}까지 응답
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 상세 모달 */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CategoryBadge category={selected?.casting_category ?? null} />
                {selected && <StatusBadge status={selected.status} />}
              </div>
            </div>
            <DialogTitle className="text-lg mt-2">
              {selected?.casting_title ?? "캐스팅 제안"}
            </DialogTitle>
            {selected?.casting_role_type && (
              <p className="text-sm text-muted-foreground">{selected.casting_role_type}</p>
            )}
          </DialogHeader>

          {selected && (
            <div className="px-5 py-4 space-y-4">
              {/* 기본 정보 그리드 */}
              <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/40 p-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">제작사</p>
                  <p className="font-medium">{selected.director_company ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">담당자</p>
                  <p className="font-medium">{selected.director_name}</p>
                </div>
                {selected.casting_work_period && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />활동 기간
                    </p>
                    <p className="font-medium">{selected.casting_work_period}</p>
                  </div>
                )}
                {selected.casting_location && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />활동 장소
                    </p>
                    <p className="font-medium">{selected.casting_location}</p>
                  </div>
                )}
                {selected.casting_fee && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                      <Coins className="h-3 w-3" />응모료
                    </p>
                    <p className="font-medium">{selected.casting_fee}</p>
                  </div>
                )}
              </div>

              {/* 디렉터 메시지 */}
              {selected.message && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">캐스팅 디렉터 메시지</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap bg-muted/30 rounded-lg p-3">
                    {selected.message}
                  </p>
                </div>
              )}

              {/* 만료일 */}
              {selected.expires_at && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(selected.expires_at)}까지 응답 필요
                </p>
              )}
            </div>
          )}

          <DialogFooter className="px-5 pb-5 pt-0 gap-2">
            {selected?.status === "pending" ? (
              <>
                <Button
                  variant="outline"
                  className="flex-1 gap-1.5"
                  disabled={responding}
                  onClick={() => handleRespond(selected.id, "rejected")}
                >
                  <X className="h-4 w-4" />
                  거절하기
                </Button>
                <Button
                  className="flex-1 gap-1.5 bg-primary"
                  disabled={responding}
                  onClick={() => handleRespond(selected.id, "accepted")}
                >
                  <Check className="h-4 w-4" />
                  제안 수락
                </Button>
              </>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => setSelected(null)}>닫기</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
