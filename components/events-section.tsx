"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ChevronRight, Calendar, Clock, Crown, LogIn, UserPlus } from "lucide-react"
import { useUser } from "@/contexts/user-context"

type EventType = "오디션" | "특강"
type EventStatus = "진행중" | "마감"

interface Event {
  id: number
  type: EventType
  title: string
  deadline: string
  status: EventStatus
  description?: string
  location?: string
  time?: string
  isMemberOnly?: boolean
}

const events: Event[] = [
  {
    id: 1,
    type: "오디션",
    title: "이상길 대표 오디션",
    deadline: "2026-03-01",
    status: "진행중",
    description: "영화 '보통사람들' 캐스팅을 위한 내부 오디션입니다.",
    location: "서울특별시 강남구",
    time: "14:00 - 18:00",
    isMemberOnly: true,
  },
  {
    id: 2,
    type: "특강",
    title: '연기특강 "오디션 피드백"',
    deadline: "2026-03-01",
    status: "마감",
    description: "현업 배우가 직접 진행하는 오디션 피드백 특강입니다.",
    location: "서울특별시 성북구",
    time: "10:00 - 13:00",
    isMemberOnly: true,
  },
  {
    id: 3,
    type: "오디션",
    title: "넷플릭스 드라마 오디션",
    deadline: "2026-03-15",
    status: "진행중",
    description: "넷플릭스 오리지널 드라마 조연 캐스팅 오디션입니다.",
    location: "서울특별시 마포구",
    time: "09:00 - 17:00",
    isMemberOnly: true,
  },
  {
    id: 4,
    type: "오디션",
    title: "영화 '새벽의 약속' 오디션",
    deadline: "2026-03-20",
    status: "진행중",
    description: "장편 영화 주연 및 조연 캐스팅 오디션입니다.",
    location: "서울특별시 종로구",
    time: "13:00 - 18:00",
    isMemberOnly: true,
  },
  {
    id: 5,
    type: "특강",
    title: "카메라 연기 워크샵",
    deadline: "2026-03-25",
    status: "진행중",
    description: "카메라 앞에서의 자연스러운 연기를 배우는 실전 워크샵입니다.",
    location: "서울특별시 강남구",
    time: "15:00 - 19:00",
    isMemberOnly: false,
  },
  {
    id: 6,
    type: "오디션",
    title: "광고 모델 오디션",
    deadline: "2026-04-01",
    status: "진행중",
    description: "대기업 광고 모델 캐스팅 오디션입니다.",
    location: "서울특별시 서초구",
    time: "10:00 - 16:00",
    isMemberOnly: true,
  },
]

export function EventsSection() {
  const router = useRouter()
  const { status } = useUser()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showMembershipModal, setShowMembershipModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  const handleApply = (event: Event) => {
    setSelectedEvent(event)

    // 1. 비로그인 상태
    if (status === "guest") {
      setShowLoginModal(true)
      return
    }

    // 2. 로그인했지만 멤버십 전용 이벤트에 비멤버십 회원이 접근
    if (event.isMemberOnly && status === "basic") {
      setShowMembershipModal(true)
      return
    }

    // 3. 멤버십 회원이거나, 멤버십 전용이 아닌 이벤트
    router.push(`/audition/${event.id}`)
  }

  const handleLoginRedirect = () => {
    setShowLoginModal(false)
    router.push("/login")
  }

  const handleMembershipRedirect = () => {
    setShowMembershipModal(false)
    router.push("/membership")
  }

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
                  <span>{event.deadline} 마감</span>
                </div>
                {event.isMemberOnly ? (
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

        {/* Membership Required Modal */}
        <Dialog open={showMembershipModal} onOpenChange={setShowMembershipModal}>
          <DialogContent className="sm:max-w-md bg-card">
            <DialogHeader>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Crown className="h-8 w-8 text-primary" />
              </div>
              <DialogTitle className="text-center text-xl">멤버십 회원 전용 혜택</DialogTitle>
              <DialogDescription className="text-center pt-2">
                본 이벤트 신청은 <span className="font-semibold text-primary">멤버십 회원</span>만 가능합니다.
                <br />
                멤버십에 가입하고 무제한 오디션 신청 혜택을 받아보세요!
              </DialogDescription>
            </DialogHeader>
            <div className="bg-muted rounded-lg p-4 my-4">
              <h4 className="font-semibold text-foreground mb-2">멤버십 혜택</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-primary">•</span> 모든 오디션/특강 무제한 신청
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">•</span> 프로필 우선 검토
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">•</span> 가입 시 15,000P 지급
                </li>
              </ul>
            </div>
            <DialogFooter className="flex flex-col gap-2 sm:flex-col">
              <Button
                onClick={handleMembershipRedirect}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                멤버십 가입 안내 보기
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowMembershipModal(false)}
                className="w-full"
              >
                닫기
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}
