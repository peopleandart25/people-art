"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ChevronRight, Calendar, Crown, LogIn, UserPlus } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { useAuth, ROLE_CASTING_DIRECTOR } from "@/hooks/use-auth"
import { MembershipRequiredDialog } from "@/components/membership-required-dialog"

type Event = {
  id: string
  title: string
  type: string
  status: string
  deadline: string | null
  is_member_only: boolean | null
}

export function EventsSection({ events = [] }: { events?: Event[] }) {
  const router = useRouter()
  const { status } = useUser()
  const { profile } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showMembershipModal, setShowMembershipModal] = useState(false)
  const [showDirectorModal, setShowDirectorModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  const handleApply = (event: Event) => {
    setSelectedEvent(event)

    if (status === "guest") {
      setShowLoginModal(true)
      return
    }

    if (profile?.role === ROLE_CASTING_DIRECTOR) {
      setShowDirectorModal(true)
      return
    }

    if (event.is_member_only && status === "basic") {
      setShowMembershipModal(true)
      return
    }

    router.push(`/events/${event.id}`)
  }

  const handleLoginRedirect = () => {
    setShowLoginModal(false)
    router.push("/login")
  }

  const handleMembershipRedirect = () => {
    setShowMembershipModal(false)
    router.push("/membership")
  }

  if (events.length === 0) return null

  return (
    <section id="events" className="py-16 lg:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground lg:text-3xl">EVENT</h2>
            <p className="text-muted-foreground mt-1">오디션 및 특강 이벤트</p>
          </div>
          <a
            href="/events"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            전체보기
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>

        {/* Events Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card
              key={event.id}
              className="group flex flex-col overflow-hidden border border-border transition-all hover:shadow-lg hover:border-primary/30"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge
                    variant={event.type === "오디션" ? "default" : "secondary"}
                    className={event.type === "오디션" ? "bg-primary text-primary-foreground" : ""}
                  >
                    {event.type}
                  </Badge>
                  <Badge
                    variant={event.status === "진행중" ? "outline" : "secondary"}
                    className={
                      event.status === "진행중"
                        ? "border-green-500 text-green-600 bg-green-50"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {event.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-4 flex-1">
                <h3 className="font-semibold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                  {event.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{event.deadline ? event.deadline.slice(0, 10) : ""} 마감</span>
                </div>
                {event.is_member_only ? (
                  <div className="flex items-center gap-2 text-sm text-primary mt-2">
                    <Crown className="h-4 w-4" />
                    <span>멤버십 전용</span>
                  </div>
                ) : (
                  <div className="h-6 mt-2" />
                )}
              </CardContent>
              <CardFooter className="pt-0 mt-auto">
                <Button
                  onClick={() => handleApply(event)}
                  disabled={event.status === "마감"}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
                >
                  {event.status === "마감" ? "마감됨" : "신청하기"}
                </Button>
              </CardFooter>
            </Card>
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
                이 서비스는 <span className="font-semibold text-foreground">로그인 후</span> 이용 가능합니다.
                <br />
                로그인하고 다양한 오디션 기회를 만나보세요!
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-4">
              <Button
                onClick={handleLoginRedirect}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              >
                <LogIn className="h-4 w-4" />
                로그인하기
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowLoginModal(false)
                  router.push("/login")
                }}
                className="w-full gap-2"
              >
                <UserPlus className="h-4 w-4" />
                회원가입
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowLoginModal(false)}
                className="w-full"
              >
                닫기
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Director Block Modal */}
        <Dialog open={showDirectorModal} onOpenChange={setShowDirectorModal}>
          <DialogContent className="sm:max-w-md bg-card">
            <DialogHeader>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Crown className="h-8 w-8 text-muted-foreground" />
              </div>
              <DialogTitle className="text-center text-xl">아티스트 전용 서비스</DialogTitle>
              <DialogDescription className="text-center pt-2">
                본 이벤트는 <span className="font-semibold text-foreground">아티스트 회원</span>만 신청 가능합니다.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-4">
              <Button
                variant="outline"
                onClick={() => setShowDirectorModal(false)}
                className="w-full"
              >
                닫기
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <MembershipRequiredDialog
          open={showMembershipModal}
          onOpenChange={setShowMembershipModal}
          onConfirm={handleMembershipRedirect}
        />
      </div>
    </section>
  )
}
