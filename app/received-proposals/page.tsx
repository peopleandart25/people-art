"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Crown, Send, Clock, CheckCircle, XCircle, Building2 } from "lucide-react"
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
}

function statusBadge(status: Proposal["status"]) {
  if (status === "pending")
    return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">응답 대기</Badge>
  if (status === "accepted")
    return <Badge className="bg-green-100 text-green-800 border-green-300">수락</Badge>
  return <Badge className="bg-gray-100 text-gray-600 border-gray-300">거절</Badge>
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })
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
      if (res.ok) {
        const data = await res.json()
        setProposals(data)
      }
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    if (loading) return
    if (!isLoggedIn) {
      router.push("/login")
      return
    }
    if (isPremium) {
      fetchProposals()
    } else {
      setFetching(false)
    }
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
        toast({
          title: status === "accepted" ? "제안을 수락했습니다." : "제안을 거절했습니다.",
        })
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-4" />
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
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto text-center p-8">
          <Crown className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">멤버십 전용 기능</h2>
          <p className="text-muted-foreground mb-4">
            받은 캐스팅 제안 확인은 프리미엄 멤버십 전용 기능입니다.
          </p>
          <Button onClick={() => router.push("/membership")}>
            멤버십 가입하기
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">받은 캐스팅 제안</h1>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <Clock className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{pending}</p>
            <p className="text-sm text-muted-foreground">응답 대기</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{accepted}</p>
            <p className="text-sm text-muted-foreground">수락</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <XCircle className="h-6 w-6 text-gray-400 mx-auto mb-1" />
            <p className="text-2xl font-bold">{rejected}</p>
            <p className="text-sm text-muted-foreground">거절</p>
          </CardContent>
        </Card>
      </div>

      {/* 제안 목록 */}
      {fetching ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : proposals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Send className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>받은 캐스팅 제안이 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {proposals.map((proposal) => (
            <Card
              key={proposal.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelected(proposal)}
            >
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold truncate">{proposal.director_name}</span>
                      {proposal.director_company && (
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <Building2 className="h-3 w-3" />
                          {proposal.director_company}
                        </span>
                      )}
                    </div>
                    {proposal.casting_title && (
                      <p className="text-sm text-primary font-medium mb-1">{proposal.casting_title}</p>
                    )}
                    {proposal.message && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{proposal.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">{formatDate(proposal.created_at)}</p>
                  </div>
                  <div className="shrink-0">
                    {statusBadge(proposal.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 상세 모달 */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>캐스팅 제안 상세</DialogTitle>
            <DialogDescription>
              {selected?.director_name}
              {selected?.director_company && ` · ${selected.director_company}`}
              {" "}으로부터 받은 제안입니다.
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              {/* 공고 정보 */}
              {selected.casting_title && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">캐스팅 공고</p>
                  <p className="font-medium">{selected.casting_title}</p>
                </div>
              )}

              {/* 메시지 */}
              {selected.message && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">디렉터 메시지</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{selected.message}</p>
                </div>
              )}

              {/* 날짜 */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>제안일: {formatDate(selected.created_at)}</span>
                {selected.expires_at && (
                  <span>만료일: {formatDate(selected.expires_at)}</span>
                )}
              </div>

              {/* 현재 상태 */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">상태:</span>
                {statusBadge(selected.status)}
              </div>
            </div>
          )}

          <DialogFooter>
            {selected?.status === "pending" ? (
              <>
                <Button
                  variant="outline"
                  disabled={responding}
                  onClick={() => handleRespond(selected.id, "rejected")}
                >
                  거절하기
                </Button>
                <Button
                  disabled={responding}
                  onClick={() => handleRespond(selected.id, "accepted")}
                >
                  수락하기
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setSelected(null)}>닫기</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
