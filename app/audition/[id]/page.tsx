"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useUser } from "@/contexts/user-context"
import { ArrowLeft, Calendar, MapPin, Clock, User, Phone, Mail, FileText, Check, Crown, Image as ImageIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

type EventType = "오디션" | "특강"
type EventStatus = "진행중" | "마감"

interface AuditionEvent {
  id: number
  type: EventType
  title: string
  deadline: string
  status: EventStatus
  description: string
  location: string
  time: string
  isMemberOnly: boolean
  roleInfo?: string
  requirements?: string[]
  productionCompany?: string
}

const eventsData: AuditionEvent[] = [
  {
    id: 1,
    type: "오디션",
    title: "이상길 대표 오디션",
    deadline: "2026-03-01",
    status: "진행중",
    description: "영화 '보통사람들' 캐스팅을 위한 내부 오디션입니다. 실제 캐스팅 검토 단계로 이어지는 중요한 기회입니다. 현재 제작사 및 캐스팅 진행 상황에 따라 작품 관련 정보는 비공개로 운영되며, 최종 픽스된 분들에 한해 상세 정보가 오픈될 예정입니다.",
    location: "서울특별시 강남구",
    time: "14:00 - 18:00",
    isMemberOnly: true,
    roleInfo: "남자 주인공 / 30대 초반 / 평범한 직장인 역할",
    requirements: ["연기 경력 1년 이상", "프로필 사진 필수", "자기소개 영상 권장"],
    productionCompany: "피플앤아트 엔터테인먼트",
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
    requirements: ["연기에 관심있는 분", "자기 PR 능력 향상을 원하시는 분"],
    productionCompany: "피플앤아트 아카데미",
  },
  {
    id: 3,
    type: "오디션",
    title: "넷플릭스 드라마 오디션",
    deadline: "2026-03-15",
    status: "진행중",
    description: "넷플릭스 오리지널 드라마 조연 캐스팅 오디션입니다. 글로벌 OTT 플랫폼에서 방영될 작품으로, 국제적인 경험을 쌓을 수 있는 기회입니다.",
    location: "서울특별시 마포구",
    time: "09:00 - 17:00",
    isMemberOnly: true,
    roleInfo: "여자 조연 / 20대 중반 / 주인공의 친구 역할",
    requirements: ["영어 대사 가능자 우대", "프로필 사진 및 포트폴리오 필수"],
    productionCompany: "스튜디오 드래곤",
  },
  {
    id: 4,
    type: "오디션",
    title: "영화 '새벽의 약속' 오디션",
    deadline: "2026-03-20",
    status: "진행중",
    description: "장편 영화 주연 및 조연 캐스팅 오디션입니다. 감동적인 드라마 장르로, 연기력을 발휘할 수 있는 좋은 기회입니다.",
    location: "서울특별시 종로구",
    time: "13:00 - 18:00",
    isMemberOnly: true,
    roleInfo: "다수 배역 모집 / 20-40대",
    requirements: ["프로필 사진 필수", "자기소개서 필수"],
    productionCompany: "CJ 엔터테인먼트",
  },
  {
    id: 5,
    type: "특강",
    title: "카메라 연기 워크샵",
    deadline: "2026-03-25",
    status: "진행중",
    description: "카메라 앞에서의 자연스러운 연기를 배우는 실전 워크샵입니다. 현업 감독이 직접 지도합니다.",
    location: "서울특별시 강남구",
    time: "15:00 - 19:00",
    isMemberOnly: false,
    requirements: ["초보자 환영", "편한 복장 권장"],
    productionCompany: "피플앤아트 아카데미",
  },
  {
    id: 6,
    type: "오디션",
    title: "광고 모델 오디션",
    deadline: "2026-04-01",
    status: "진행중",
    description: "대기업 광고 모델 캐스팅 오디션입니다. TV 및 디지털 광고에 출연할 기회입니다.",
    location: "서울특별시 서초구",
    time: "10:00 - 16:00",
    isMemberOnly: true,
    roleInfo: "남녀 모델 / 20-30대 / 건강한 이미지",
    requirements: ["프로필 사진 필수", "키 165cm 이상 권장"],
    productionCompany: "제일기획",
  },
]

export default function AuditionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { profile, status } = useUser()
  const { toast } = useToast()
  const [event, setEvent] = useState<AuditionEvent | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [applied, setApplied] = useState(false)

  useEffect(() => {
    const id = Number(params.id)
    const foundEvent = eventsData.find((e) => e.id === id)
    if (foundEvent) {
      setEvent(foundEvent)
    }
  }, [params.id])

  const handleApply = async () => {
    setIsApplying(true)
    await new Promise((resolve) => setTimeout(resolve, 1200))
    setIsApplying(false)
    setShowConfirmModal(false)
    setApplied(true)
    toast({
      title: "신청이 완료되었습니다!",
      description: `마이페이지의 프로필(${profile.name}, ${profile.phone})로 신청이 완료되었습니다.`,
    })
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">이벤트를 찾을 수 없습니다.</p>
      </div>
    )
  }

  // 비로그인 또는 비멤버십인데 멤버십 전용 이벤트인 경우 리다이렉트 처리는 events-section에서 함
  // 여기서는 이미 권한이 있는 사용자만 접근한다고 가정

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo-pa-002.png"
              alt="피플앤아트"
              width={120}
              height={40}
              className="h-10 w-auto object-contain"
            />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-8 lg:py-12">
        <div className="mx-auto max-w-3xl">
          {/* Event Header */}
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-4">
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
              {event.isMemberOnly && (
                <Badge variant="outline" className="border-primary text-primary bg-primary/5">
                  <Crown className="h-3 w-3 mr-1" />
                  멤버십 전용
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground lg:text-3xl mb-2">{event.title}</h1>
            {event.productionCompany && (
              <p className="text-muted-foreground">{event.productionCompany}</p>
            )}
          </div>

          {/* Event Details */}
          <Card className="mb-6 border-border animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <CardHeader>
              <CardTitle className="text-lg">상세 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground leading-relaxed">{event.description}</p>
              
              <div className="grid gap-3 sm:grid-cols-3 pt-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">마감일</p>
                    <p className="font-medium text-foreground">{event.deadline}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">장소</p>
                    <p className="font-medium text-foreground">{event.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">시간</p>
                    <p className="font-medium text-foreground">{event.time}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role Info */}
          {event.roleInfo && (
            <Card className="mb-6 border-border animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
              <CardHeader>
                <CardTitle className="text-lg">배역 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground">{event.roleInfo}</p>
              </CardContent>
            </Card>
          )}

          {/* Requirements */}
          {event.requirements && event.requirements.length > 0 && (
            <Card className="mb-8 border-border animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
              <CardHeader>
                <CardTitle className="text-lg">지원 요건</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {event.requirements.map((req) => (
                    <li key={req} className="flex items-center gap-2 text-foreground">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Apply Button */}
          <div className="sticky bottom-0 bg-background py-4 border-t border-border animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
            <Button
              onClick={() => setShowConfirmModal(true)}
              disabled={event.status === "마감" || applied}
              className="w-full h-14 text-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
            >
              {applied
                ? "신청 완료"
                : event.status === "마감"
                  ? "마감되었습니다"
                  : "마이페이지에 등록된 내 프로필로 신청하기"}
            </Button>
            {!applied && event.status !== "마감" && (
              <p className="text-center text-sm text-muted-foreground mt-2">
                마이페이지에 등록된 프로필 정보로 자동 신청됩니다
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Confirm Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-xl">프로필 확인</DialogTitle>
            <DialogDescription>
              아래 프로필 정보로 신청됩니다
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Profile Preview */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-card border border-border">
                {profile.profileImage ? (
                  <img
                    src={profile.profileImage}
                    alt="프로필"
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">{profile.name}</p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{profile.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{profile.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">
                  {profile.portfolioFile ? "포트폴리오 첨부됨" : "포트폴리오 미첨부"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">
                  {profile.profileImage ? "프로필 사진 등록됨" : "프로필 사진 미등록"}
                </span>
              </div>
            </div>

            <Link
              href="/mypage"
              className="block text-center text-sm text-primary hover:underline pt-2"
            >
              프로필 수정하러 가기
            </Link>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            <Button
              onClick={handleApply}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isApplying}
            >
              {isApplying ? "신청 중..." : "이 프로필로 신청하기"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              className="w-full"
            >
              취소
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}
