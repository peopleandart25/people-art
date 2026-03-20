"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ArrowLeft, Crown, LogIn, UserPlus, CheckCircle, Ticket } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import type { Database } from "@/lib/supabase/types"

type EventRow = Database["public"]["Tables"]["events"]["Row"]

interface AdjacentEvent {
  id: string
  title: string
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { isLoggedIn, isPremium, isAdmin, user } = useAuth()

  const [eventItem, setEventItem] = useState<EventRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [prevItem, setPrevItem] = useState<AdjacentEvent | null>(null)
  const [nextItem, setNextItem] = useState<AdjacentEvent | null>(null)
  const [alreadyApplied, setAlreadyApplied] = useState(false)

  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showMembershipModal, setShowMembershipModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true)
      const supabase = createClient()

      const [{ data: event }, { data: allEvents }] = await Promise.all([
        supabase.from("events").select("*").eq("id", id).single(),
        supabase.from("events").select("id, title").order("created_at", { ascending: false }),
      ])

      if (!event) { setLoading(false); return }
      setEventItem(event)

      const idx = (allEvents ?? []).findIndex(e => e.id === id)
      setPrevItem(idx > 0 ? allEvents![idx - 1] : null)
      setNextItem(idx < (allEvents?.length ?? 0) - 1 ? allEvents![idx + 1] : null)

      // 신청 여부 확인
      if (user) {
        const { data: existing } = await supabase
          .from("event_applications")
          .select("id")
          .eq("event_id", id)
          .eq("user_id", user.id)
          .single()
        setAlreadyApplied(!!existing)
      }

      setLoading(false)
    }
    fetchEvent()
  }, [id, user])

  const handleApply = async () => {
    if (!isLoggedIn) {
      setShowLoginModal(true)
      return
    }

    if (eventItem?.is_member_only && !isPremium && !isAdmin) {
      setShowMembershipModal(true)
      return
    }

    if (alreadyApplied) {
      setShowSuccessModal(true)
      return
    }

    const supabase = createClient()
    await supabase.from("event_applications").insert({
      event_id: id,
      user_id: user!.id,
      status: "신청",
    })
    setAlreadyApplied(true)
    setShowSuccessModal(true)
  }

  if (loading) {
    return (
      <section className="py-12 lg:py-20 bg-background">
        <div className="mx-auto max-w-4xl px-4 lg:px-8 flex justify-center">
          <span className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </section>
    )
  }

  if (!eventItem) notFound()

  return (
    <section className="py-12 lg:py-20 bg-background">
      <div className="mx-auto max-w-4xl px-4 lg:px-8">
        <div className="mb-6">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>목록으로</span>
          </Link>
        </div>

        <div className="mb-8 border-b border-border pb-4">
          <div className="flex items-center gap-2 mb-3">
            <Badge
              className={
                eventItem.type === "오디션"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }
            >
              {eventItem.type}
            </Badge>
            <Badge
              className={
                eventItem.status === "진행중"
                  ? "bg-green-500 text-white"
                  : "bg-gray-500 text-white"
              }
            >
              {eventItem.status}
            </Badge>
            {eventItem.is_member_only && (
              <Badge variant="outline" className="border-primary text-primary gap-1">
                <Crown className="h-3 w-3" />
                멤버십 전용
              </Badge>
            )}
          </div>
          <h1 className="text-xl font-bold text-foreground lg:text-2xl">
            {eventItem.title} 안내
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mb-10">
          <div className="lg:w-1/2">
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-black shadow-md">
              {eventItem.image_url ? (
                <Image
                  src={eventItem.image_url}
                  alt={eventItem.title}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <Ticket className="h-24 w-24 text-white/30" />
                </div>
              )}
            </div>
          </div>

          <div className="lg:w-1/2 space-y-6">
            <div className="space-y-3 text-sm">
              {eventItem.project_name && (
                <div className="flex">
                  <span className="w-20 text-muted-foreground">작품명 :</span>
                  <span className="text-foreground">{eventItem.project_name}</span>
                </div>
              )}
              {eventItem.director && (
                <div className="flex">
                  <span className="w-20 text-muted-foreground">연출 :</span>
                  <span className="text-foreground">{eventItem.director}</span>
                </div>
              )}
              {eventItem.deadline && (
                <div className="flex">
                  <span className="w-20 text-muted-foreground">날짜 :</span>
                  <span className="text-foreground">{eventItem.deadline}</span>
                </div>
              )}
              {eventItem.location && (
                <div className="flex">
                  <span className="w-20 text-muted-foreground">장소 :</span>
                  <span className="text-foreground">{eventItem.location}</span>
                </div>
              )}
              {eventItem.event_time && (
                <div className="flex">
                  <span className="w-20 text-muted-foreground">시간 :</span>
                  <span className="text-foreground">{eventItem.event_time}</span>
                </div>
              )}
              {eventItem.deadline && (
                <div className="flex">
                  <span className="w-20 text-muted-foreground">마감일자 :</span>
                  <span className="text-foreground">{eventItem.deadline}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-foreground leading-relaxed whitespace-pre-line">
                {eventItem.detail_content ?? eventItem.description ?? "상세 내용이 없습니다."}
              </p>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleApply}
                disabled={eventItem.status === "마감" || alreadyApplied}
                size="lg"
                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground gap-2"
              >
                {eventItem.status === "마감"
                  ? "마감됨"
                  : alreadyApplied
                  ? "신청완료"
                  : "신청하기"}
                {eventItem.status !== "마감" && !alreadyApplied && <CheckCircle className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* 이전/다음 이벤트 네비게이션 */}
        <div className="flex flex-col sm:flex-row items-stretch gap-4 pt-8 border-t border-border">
          {prevItem ? (
            <Link href={`/events/${prevItem.id}`} className="flex-1">
              <div className="h-full p-4 rounded-lg border border-border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all">
                <span className="text-xs text-muted-foreground mb-1 block">이전 이벤트</span>
                <span className="font-medium text-foreground line-clamp-1">{prevItem.title}</span>
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}

          {nextItem ? (
            <Link href={`/events/${nextItem.id}`} className="flex-1">
              <div className="h-full p-4 rounded-lg border border-border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all text-right">
                <span className="text-xs text-muted-foreground mb-1 block">다음 이벤트</span>
                <span className="font-medium text-foreground line-clamp-1">{nextItem.title}</span>
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      </div>

      {/* 로그인 모달 */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              <LogIn className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl">로그인이 필요합니다</DialogTitle>
            <DialogDescription className="text-center pt-2">
              이벤트 신청은 <span className="font-semibold text-foreground">로그인 후</span> 이용 가능합니다.
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

      {/* 멤버십 모달 */}
      <Dialog open={showMembershipModal} onOpenChange={setShowMembershipModal}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pink-100 mb-4">
              <Crown className="h-8 w-8 text-pink-500" />
            </div>
            <DialogTitle className="text-center text-xl">멤버십 회원 전용</DialogTitle>
            <DialogDescription className="text-center pt-2">
              본 이벤트 신청은 <span className="font-semibold text-pink-500">멤버십 회원</span>만 가능합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted rounded-lg p-4 my-4">
            <h4 className="font-semibold text-foreground mb-2">멤버십 혜택</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><span className="text-primary">•</span> 모든 오디션/특강 무제한 신청</li>
              <li className="flex items-center gap-2"><span className="text-primary">•</span> 프로필 우선 검토</li>
              <li className="flex items-center gap-2"><span className="text-primary">•</span> 가입 시 15,000P 지급</li>
            </ul>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            <Button
              onClick={() => { setShowMembershipModal(false); router.push("/membership") }}
              className="w-full bg-pink-500 text-white hover:bg-pink-600"
            >
              멤버십 가입하기
            </Button>
            <Button variant="outline" onClick={() => setShowMembershipModal(false)} className="w-full">
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 신청 완료 모달 */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <DialogTitle className="text-center text-xl text-green-600">신청이 완료되었습니다</DialogTitle>
            <DialogDescription className="text-center pt-2">
              <span className="font-semibold text-foreground">{eventItem?.title}</span>에 성공적으로 신청되었습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button onClick={() => setShowSuccessModal(false)} className="w-full bg-green-500 text-white hover:bg-green-600">
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
