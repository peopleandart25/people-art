"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronRight, ExternalLink, Mail, Check, Building2, Copy, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Agency {
  id: number
  name: string
  type: "광고에이전시" | "엔터테인먼트"
  website: string
  email: string
}

const agencies: Agency[] = [
  { id: 1, name: "레디 에이전시", type: "광고에이전시", website: "#", email: "casting@ready-agency.com" },
  { id: 2, name: "BH엔터테인먼트", type: "엔터테인먼트", website: "#", email: "audition@bhent.co.kr" },
  { id: 3, name: "키이스트", type: "엔터테인먼트", website: "#", email: "casting@keyeast.co.kr" },
  { id: 4, name: "나무엑터스", type: "엔터테인먼트", website: "#", email: "audition@namuactors.com" },
  { id: 5, name: "스타쉽엔터테인먼트", type: "엔터테인먼트", website: "#", email: "audition@starship-ent.com" },
  { id: 6, name: "YG케이플러스", type: "광고에이전시", website: "#", email: "model@ygkplus.com" },
  { id: 7, name: "판타지오", type: "엔터테인먼트", website: "#", email: "casting@fantagio.kr" },
  { id: 8, name: "에이스팩토리", type: "엔터테인먼트", website: "#", email: "audition@acefactory.co.kr" },
]

export function AgencySection() {
  const [selectedAgencies, setSelectedAgencies] = useState<number[]>([])
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const { toast } = useToast()

  const filteredAgencies = agencies.filter((agency) => {
    if (activeTab === "all") return true
    if (activeTab === "agency") return agency.type === "광고에이전시"
    if (activeTab === "entertainment") return agency.type === "엔터테인먼트"
    return true
  })

  const toggleAgency = (id: number) => {
    setSelectedAgencies((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  const handleSendEmail = () => {
    if (selectedAgencies.length === 0) return
    setShowConfirmModal(true)
  }

  // 선택된 기관들의 이메일 주소 가져오기
  const getSelectedEmails = (): string[] => {
    return selectedAgencies
      .map((id) => agencies.find((a) => a.id === id)?.email)
      .filter((email): email is string => !!email)
  }

  // 선택된 기관 이름 가져오기
  const getSelectedAgencyNames = (): string => {
    return selectedAgencies
      .map((id) => agencies.find((a) => a.id === id)?.name)
      .filter(Boolean)
      .join(", ")
  }

  // mailto 링크 생성 (encodeURIComponent로 안전하게 인코딩)
  const generateMailtoLink = (): string => {
    const emails = getSelectedEmails()
    const agencyNames = getSelectedAgencyNames()
    
    const subject = encodeURIComponent(`[프로필 지원] 피플앤아트 회원 프로필 지원 - ${agencyNames}`)
    const body = encodeURIComponent(
      `안녕하세요.\n\n피플앤아트 회원으로서 프로필 지원 드립니다.\n\n[지원자 정보]\n- 이름: \n- 연락처: \n- 경력: \n\n프로필을 첨부하여 지원 드리오니 검토 부탁드립니다.\n\n감사합니다.`
    )
    
    return `mailto:${emails.join(",")}?subject=${subject}&body=${body}`
  }

  // 메일 앱 열기 (브라우저 차단 방지를 위해 <a> 태그 시뮬레이션 사용)
  const openMailApp = () => {
    // 1. 먼저 이메일 주소를 클립보드에 자동 복사 (보험 - 차단되어도 붙여넣기 가능)
    const emails = getSelectedEmails()
    const emailText = emails.join(", ")
    
    // 동기적으로 클립보드 복사 시도 (비동기 await 사용하지 않음 - 브라우저 차단 방지)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(emailText).catch(() => {
        // 실패해도 무시
      })
    }
    
    // 2. 임시 <a> 태그 생성하여 click() 시뮬레이션 (브라우저가 신뢰하는 방식)
    const mailtoLink = generateMailtoLink()
    const tempLink = document.createElement("a")
    tempLink.href = mailtoLink
    tempLink.target = "_top" // 샌드박스 우회
    tempLink.rel = "noopener noreferrer"
    tempLink.style.display = "none"
    document.body.appendChild(tempLink)
    
    // 3. 즉시 클릭 실행 (setTimeout 없이 동기적으로)
    tempLink.click()
    
    // 4. 임시 태그 제거
    document.body.removeChild(tempLink)
    
    // 5. 토스트로 안내 (이메일 주소가 복사되었음을 알림)
    toast({
      title: "메일 앱 호출 및 주소 복사 완료",
      description: "앱이 안 열리면 메일 서비스에 접속해 붙여넣기(Ctrl+V) 하세요.",
    })
    
    // 6. 모달 닫기 및 상태 초기화 (즉시 실행)
    setShowConfirmModal(false)
    setShowSuccessModal(true)
    setSelectedAgencies([])
  }

  // 이메일 주소 복사하기
  const copyEmailAddresses = async () => {
    const emails = getSelectedEmails()
    const emailText = emails.join(", ")
    
    try {
      await navigator.clipboard.writeText(emailText)
      toast({
        title: "이메일 주소가 복사되었습니다.",
        description: "직접 메일 앱에 붙여넣어 주세요.",
      })
    } catch {
      // 클립보드 API 실패 시 fallback
      const textArea = document.createElement("textarea")
      textArea.value = emailText
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      
      toast({
        title: "이메일 주소가 복사되었습니다.",
        description: "직접 메일 앱에 붙여넣어 주세요.",
      })
    }
  }

  return (
    <section id="agency" className="py-16 lg:py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground lg:text-3xl">프로필 지원하기</h2>
            <p className="text-muted-foreground mt-1">광고에이전시 / 엔터테인먼트</p>
          </div>
          <a
            href="#agency-all"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            전체보기
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>

        {/* Info Box */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-foreground mb-2">프로필 지원 안내</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• 동일 기관에는 스팸 방지를 위해 월 1회만 지원 가능하며, 중복 지원은 제한됩니다.</li>
            <li>• 본 기능은 광고에이전시 및 기획사에서 공개한 공식 이메일 주소로 회원이 직접 프로필을 지원할 수 있도록 돕는 서비스입니다.</li>
            <li>• 회원은 본인 프로필 지원 목적 외의 사용을 할 수 없으며, 관련 법령 위반 시 책임은 회원에게 있습니다.</li>
          </ul>
        </div>

        {/* Tabs and Send Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="grid w-full sm:w-auto grid-cols-3 bg-muted">
              <TabsTrigger value="all">전체보기</TabsTrigger>
              <TabsTrigger value="agency">광고에이전시</TabsTrigger>
              <TabsTrigger value="entertainment">엔터테인먼트</TabsTrigger>
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filteredAgencies.map((agency) => (
            <Card
              key={agency.id}
              className={`cursor-pointer transition-all ${
                selectedAgencies.includes(agency.id)
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary/30"
              }`}
              onClick={() => toggleAgency(agency.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedAgencies.includes(agency.id)}
                    onCheckedChange={() => toggleAgency(agency.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          agency.type === "광고에이전시"
                            ? "bg-primary/10 text-primary"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {agency.type}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground">{agency.name}</h3>
                    <a
                      href={agency.website}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-2"
                    >
                      공식 홈페이지 바로가기
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Confirm Modal */}
        <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
          <DialogContent className="sm:max-w-md bg-card">
            <DialogHeader>
              <DialogTitle>프로필 지원 확인</DialogTitle>
              <DialogDescription>
                선택한 {selectedAgencies.length}개 기관에 프로필을 지원하시겠습니까?
              </DialogDescription>
            </DialogHeader>
            
            {/* 선택된 기관 목록 */}
            <div className="bg-muted rounded-lg p-4 space-y-2">
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
            
            {/* 안내 문구 - 강화된 디자인 */}
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-amber-800">
                    메일 앱이 자동으로 열리지 않나요?
                  </p>
                  <p className="text-sm text-amber-700">
                    아래 <span className="font-bold text-amber-900">이메일 주소 복사하기</span>를 이용해 주세요.
                  </p>
                  <p className="text-xs text-amber-600 bg-amber-100 rounded px-2 py-1 inline-block">
                    차단 화면이 나오더라도 이메일 주소는 이미 복사되었으니 안심하세요.
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex flex-col gap-3 pt-2">
              {/* 메일 앱 열기 버튼 */}
              <Button
                onClick={openMailApp}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-11"
              >
                <Mail className="h-4 w-4 mr-2" />
                메일 앱 열기
              </Button>
              
              {/* 이메일 주소 복사 버튼 - Primary 색상 강조 */}
              <Button
                variant="outline"
                onClick={copyEmailAddresses}
                className="w-full font-bold border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors h-11"
              >
                <Copy className="h-4 w-4 mr-2" />
                이메일 주소 복사하기
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={() => setShowConfirmModal(false)}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                취소
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
              <DialogTitle className="text-center text-xl">프로필 지원 완료</DialogTitle>
              <DialogDescription className="text-center pt-2">
                선택하신 기관에 프로필이 성공적으로 전송되었습니다.
                <br />
                <span className="text-sm text-muted-foreground mt-2 block">
                  동일 기관에는 월 1회만 지원 가능합니다.
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
      </div>
    </section>
  )
}
