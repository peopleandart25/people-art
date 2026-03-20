"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/use-auth"
import { ExternalLink, Mail, Check, Building2, Lock, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react"

// 지원 기록 타입
interface SupportRecord {
  id: number
  last_sent: string // YYYY-MM-DD 형식
}

interface Agency {
  id: number
  name: string
  type: "광고에이전시" | "엔터테인먼트"
  email: string
  website: string
}

// 실제 기관 데이터 (이메일 주소 포함)
const agencies: Agency[] = [
  { id: 1, name: "레디 에이전시", type: "광고에이전시", email: "casting@ready.co.kr", website: "https://www.readyagency.co.kr" },
  { id: 2, name: "BH엔터테인먼트", type: "엔터테인먼트", email: "audition@bhent.co.kr", website: "https://www.bhent.co.kr" },
  { id: 3, name: "키이스트", type: "엔터테인먼트", email: "newface@keyeast.co.kr", website: "https://www.keyeast.co.kr" },
  { id: 4, name: "나무엑터스", type: "엔터테인먼트", email: "casting@namuactors.com", website: "https://www.namuactors.com" },
  { id: 5, name: "스타쉽엔터테인먼트", type: "엔터테인먼트", email: "actor@starship.co.kr", website: "https://www.starship.co.kr" },
  { id: 6, name: "YG케이플러스", type: "광고에이전시", email: "model@ygkplus.com", website: "https://www.ygkplus.com" },
  { id: 7, name: "판타지오", type: "엔터테인먼트", email: "newface@fantagio.kr", website: "https://www.fantagio.kr" },
  { id: 8, name: "에이스팩토리", type: "엔터테인먼트", email: "audition@acefactory.co.kr", website: "https://www.acefactory.co.kr" },
  { id: 9, name: "매니지먼트 숲", type: "엔터테인먼트", email: "casting@soop.co.kr", website: "https://www.soop.co.kr" },
  { id: 10, name: "사람엔터테인먼트", type: "엔터테인먼트", email: "audition@sarament.co.kr", website: "https://www.sarament.co.kr" },
  { id: 11, name: "이너스커뮤니티", type: "광고에이전시", email: "casting@innerscommunity.com", website: "https://www.innerscommunity.com" },
  { id: 12, name: "디에이미디어", type: "광고에이전시", email: "model@damedia.co.kr", website: "https://www.damedia.co.kr" },
  { id: 13, name: "제이와이드컴퍼니", type: "엔터테인먼트", email: "newface@jwidecompany.com", website: "https://www.jwidecompany.com" },
  { id: 14, name: "아티스트컴퍼니", type: "엔터테인먼트", email: "audition@artistcompany.co.kr", website: "https://www.artistcompany.co.kr" },
  { id: 15, name: "에스엠씨앤씨", type: "광고에이전시", email: "casting@smcnc.co.kr", website: "https://www.smcnc.co.kr" },
  { id: 16, name: "하이브레이블즈", type: "엔터테인먼트", email: "audition@hibelabels.com", website: "https://www.hibelabels.com" },
  { id: 17, name: "에이엠오엔터", type: "광고에이전시", email: "model@amoent.co.kr", website: "https://www.amoent.co.kr" },
  { id: 18, name: "젤리피쉬", type: "엔터테인먼트", email: "actor@jellyfish.co.kr", website: "https://www.jellyfish.co.kr" },
  { id: 19, name: "울림엔터테인먼트", type: "엔터테인먼트", email: "casting@woolliment.com", website: "https://www.woolliment.com" },
  { id: 20, name: "플레디스", type: "엔터테인먼트", email: "audition@pledis.co.kr", website: "https://www.pledis.co.kr" },
  { id: 21, name: "큐브엔터", type: "엔터테인먼트", email: "newface@cubeent.co.kr", website: "https://www.cubeent.co.kr" },
  { id: 22, name: "스튜디오산타클로스", type: "광고에이전시", email: "casting@studiosanta.co.kr", website: "https://www.studiosanta.co.kr" },
  { id: 23, name: "YNK엔터", type: "엔터테인먼트", email: "audition@ynkent.co.kr", website: "https://www.ynkent.co.kr" },
  { id: 24, name: "후너스", type: "엔터테인먼트", email: "casting@hoonersentertainment.com", website: "https://www.hoonersentertainment.com" },
]

const ITEMS_PER_PAGE = 12
const STORAGE_KEY = "supported_agencies"
const NON_MEMBER_LIMIT = 3

// 30일 경과 여부 확인
const isWithin30Days = (dateStr: string): boolean => {
  const sentDate = new Date(dateStr)
  const today = new Date()
  const diffTime = today.getTime() - sentDate.getTime()
  const diffDays = diffTime / (1000 * 60 * 60 * 24)
  return diffDays < 30
}

// 오늘 날짜 (YYYY-MM-DD)
const getTodayString = (): string => {
  const today = new Date()
  return today.toISOString().split("T")[0]
}

export default function SupportPage() {
  const router = useRouter()
  const { isLoggedIn, isPremium, profile: authProfile, user } = useAuth()
  const [selectedAgencies, setSelectedAgencies] = useState<number[]>([])
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [supportRecords, setSupportRecords] = useState<SupportRecord[]>([])
  const [isMounted, setIsMounted] = useState(false)

  // 클라이언트에서만 localStorage 접근
  useEffect(() => {
    setIsMounted(true)
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SupportRecord[]
        // 30일 이내 기록만 유지
        const validRecords = parsed.filter((record) => isWithin30Days(record.last_sent))
        setSupportRecords(validRecords)
        // 만료된 기록 정리
        if (validRecords.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(validRecords))
        }
      } catch {
        setSupportRecords([])
      }
    }
  }, [])

  // 비회원 총 지원 횟수 (30일 이내)
  const nonMemberTotalSupports = useMemo(() => {
    if (isPremium) return 0
    return supportRecords.length
  }, [supportRecords, isPremium])

  // 30일 이내에 지원한 기관 ID 목록
  const recentlySupportedIds = useMemo(() => {
    return new Set(supportRecords.map((r) => r.id))
  }, [supportRecords])

  // 필터링된 기관
  const filteredAgencies = useMemo(() => {
    return agencies.filter((agency) => {
      if (activeTab === "all") return true
      if (activeTab === "agency") return agency.type === "광고에이전시"
      if (activeTab === "entertainment") return agency.type === "엔터테인먼트"
      return true
    })
  }, [activeTab])

  // 페이지네이션
  const totalPages = Math.ceil(filteredAgencies.length / ITEMS_PER_PAGE)
  const paginatedAgencies = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredAgencies.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredAgencies, currentPage])

  // 탭 변경 시 페이지 리셋
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab])

  // 체크박스 토글 (체크박스 클릭 전용)
  const toggleAgency = (id: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }

    if (!isLoggedIn) {
      setShowLoginModal(true)
      return
    }

    // 이미 30일 이내에 지원한 기관인지 확인
    if (recentlySupportedIds.has(id)) {
      alert("해당 기관에는 이번 달에 이미 프로필을 전송하셨습니다. 다음 달에 다시 시도해주세요.")
      return
    }

    setSelectedAgencies((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  // 홈페이지 바로가기 (별도 함수로 분리)
  const openWebsite = (website: string, e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(website, "_blank", "noopener,noreferrer")
  }

  // 메일 전송 핸들러
  const handleSendEmail = () => {
    if (selectedAgencies.length === 0) {
      alert("기관을 최소 1곳 이상 선택해주세요.")
      return
    }

    // 비회원 제한 체크
    if (!isPremium) {
      const totalAfterSend = nonMemberTotalSupports + selectedAgencies.length
      if (totalAfterSend > NON_MEMBER_LIMIT) {
        alert(`비회원은 월 최대 ${NON_MEMBER_LIMIT}곳까지만 지원 가능합니다. 무제한 지원을 원하시면 멤버십에 가입해주세요.`)
        router.push("/membership")
        return
      }
    }

    // 중복 지원 체크 (한번 더)
    const duplicates = selectedAgencies.filter((id) => recentlySupportedIds.has(id))
    if (duplicates.length > 0) {
      const duplicateNames = duplicates
        .map((id) => agencies.find((a) => a.id === id)?.name)
        .filter(Boolean)
        .join(", ")
      alert(`다음 기관은 이미 30일 이내에 지원하셨습니다: ${duplicateNames}`)
      setSelectedAgencies((prev) => prev.filter((id) => !duplicates.includes(id)))
      return
    }

    setShowConfirmModal(true)
  }

  // 실제 전송 확인
  const confirmSend = () => {
    // 선택된 기관들의 이메일 수집
    const selectedAgencyData = selectedAgencies
      .map((id) => agencies.find((a) => a.id === id))
      .filter((a): a is Agency => a !== undefined)

    const emailAddresses = selectedAgencyData.map((a) => a.email).join(",")
    const name = authProfile?.name ?? ""
    const phone = authProfile?.phone ?? ""
    const email = user?.email ?? ""
    const subject = encodeURIComponent(`[프로필 지원] ${name} 배우 프로필 제출`)
    const body = encodeURIComponent(
      `안녕하세요.\n\n피플앤아트를 통해 프로필을 지원드립니다.\n\n` +
      `이름: ${name}\n` +
      `연락처: ${phone}\n` +
      `이메일: ${email}\n\n` +
      `프로필 및 포트폴리오는 첨부 파일로 전달드립니다.\n\n` +
      `검토 부탁드립니다.\n감사합니다.`
    )

    // mailto 링크 생성 및 열기
    const mailtoLink = `mailto:${emailAddresses}?subject=${subject}&body=${body}`
    window.location.href = mailtoLink

    // 전송 기록 저장
    const today = getTodayString()
    const newRecords: SupportRecord[] = [
      ...supportRecords,
      ...selectedAgencies.map((id) => ({ id, last_sent: today })),
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords))
    setSupportRecords(newRecords)

    setShowConfirmModal(false)
    setShowSuccessModal(true)
    setSelectedAgencies([])
  }

  // 페이지네이션 버튼 렌더링
  const renderPaginationButtons = () => {
    const buttons = []
    const maxVisiblePages = 5

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={i}
          variant={currentPage === i ? "default" : "outline"}
          size="sm"
          onClick={() => setCurrentPage(i)}
          className={currentPage === i ? "bg-primary text-primary-foreground" : ""}
        >
          {i}
        </Button>
      )
    }

    return buttons
  }

  return (
    <>
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            {/* Page Header */}
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold text-foreground lg:text-4xl mb-4">
                프로필 지원하기
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                광고에이전시 및 엔터테인먼트사에 프로필을 직접 지원하세요.
                <br />
                공개된 공식 이메일 주소로 회원이 직접 프로필을 전달할 수 있습니다.
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-card border border-border rounded-xl p-6 mb-8 max-w-4xl mx-auto">
              <h3 className="font-semibold text-foreground mb-3">프로필 지원 안내</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>동일 기관에는 스팸 방지를 위해 월 1회(30일)만 지원 가능하며, 중복 지원은 제한됩니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>본 기능은 광고에이전시 및 기획사에서 공개한 공식 이메일 주소로 회원이 직접 프로필을 지원할 수 있도록 돕는 서비스입니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>회원은 본인 프로필 지원 목적 외의 사용을 할 수 없으며, 관련 법령 위반 시 책임은 회원에게 있습니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    <strong className="text-foreground">기본 회원은 월 {NON_MEMBER_LIMIT}곳까지</strong> 지원 가능하며, 
<strong className="text-primary"> 멤버십 회원은 무제한</strong> 지원이 가능합니다.
  {isMounted && !isPremium && (
  <>
  <span className="text-muted-foreground ml-1">
  (남은 지원: {Math.max(0, NON_MEMBER_LIMIT - nonMemberTotalSupports)}곳)
  </span>
  <Button
  variant="link"
  size="sm"
  className="text-primary p-0 h-auto ml-2 underline"
  onClick={() => router.push("/membership")}
  >
  멤버십 가입하기
  </Button>
  </>
  )}
                  </span>
                </li>
              </ul>
            </div>

            {/* Tabs and Send Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 max-w-6xl mx-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                <TabsList className="grid w-full sm:w-auto grid-cols-3 bg-muted">
                  <TabsTrigger value="all">전체 ({agencies.length})</TabsTrigger>
                  <TabsTrigger value="agency">광고에이전시 ({agencies.filter(a => a.type === "광고에이전시").length})</TabsTrigger>
                  <TabsTrigger value="entertainment">엔터테인먼트 ({agencies.filter(a => a.type === "엔터테인먼트").length})</TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                onClick={handleSendEmail}
                disabled={selectedAgencies.length === 0}
                className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
              >
                <Mail className="h-4 w-4 mr-2" />
                메일 전송하기 ({selectedAgencies.length})
              </Button>
            </div>

            {/* Agency Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-6xl mx-auto">
              {paginatedAgencies.map((agency) => {
                const isRecentlySupported = recentlySupportedIds.has(agency.id)
                const isSelected = selectedAgencies.includes(agency.id)

                return (
                  <Card
                    key={agency.id}
                    className={`transition-all ${
                      isRecentlySupported
                        ? "border-muted bg-muted/50 opacity-60"
                        : isSelected
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary/30"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          disabled={isRecentlySupported}
                          onCheckedChange={() => toggleAgency(agency.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                agency.type === "광고에이전시"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-blue-50 text-blue-600"
                              }`}
                            >
                              {agency.type}
                            </span>
                            {isRecentlySupported && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                                지원완료
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-foreground">{agency.name}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => openWebsite(agency.website, e)}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary p-0 h-auto mt-2"
                          >
                            공식 홈페이지 바로가기
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {renderPaginationButtons()}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </section>

      {/* Login Required Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <DialogTitle className="text-center text-xl">로그인이 필요합니다</DialogTitle>
            <DialogDescription className="text-center pt-2">
              프로필 지원 기능을 이용하려면 로그인이 필요합니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setShowLoginModal(false)} className="flex-1">
              취소
            </Button>
            <Button
              onClick={() => router.push("/login")}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              로그인하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle>프로필 지원 확인</DialogTitle>
            <DialogDescription>
              선택한 {selectedAgencies.length}개 기관에 프로필을 지원하시겠습니까?
              <br />
              <span className="text-xs text-muted-foreground">
                (메일 앱이 열리며, 직접 전송 버튼을 눌러 전송해주세요)
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
            {selectedAgencies.map((id) => {
              const agency = agencies.find((a) => a.id === id)
              return agency ? (
                <div key={id} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  <span>{agency.name}</span>
                  <span className="text-muted-foreground">({agency.type})</span>
                </div>
              ) : null
            })}
          </div>
          {!isPremium && (
<div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
  <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
  <div className="text-xs text-yellow-700">
  <p>
  기본 회원은 월 {NON_MEMBER_LIMIT}곳까지만 지원 가능합니다.
  <br />
  전송 후 남은 지원: {Math.max(0, NON_MEMBER_LIMIT - nonMemberTotalSupports - selectedAgencies.length)}곳
  </p>
  <Button
  variant="link"
  size="sm"
  className="text-yellow-800 p-0 h-auto mt-1 underline font-semibold"
  onClick={() => {
  setShowConfirmModal(false)
  router.push("/membership")
  }}
  >
  무제한 지원을 위해 멤버십 가입하기
  </Button>
  </div>
  </div>
          )}
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              취소
            </Button>
            <Button
              onClick={confirmSend}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              메일 앱 열기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-center text-xl">프로필 지원 준비 완료</DialogTitle>
            <DialogDescription className="text-center pt-2">
              메일 앱에서 전송 버튼을 눌러 프로필을 전달해주세요.
              <br />
              <span className="text-sm text-muted-foreground mt-2 block">
                동일 기관에는 30일 이후에 다시 지원할 수 있습니다.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
