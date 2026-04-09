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
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/types"

type Agency = Database["public"]["Tables"]["support_agencies"]["Row"]

interface SupportRecord {
  id: string
  last_sent: string
}

const ITEMS_PER_PAGE = 12
const STORAGE_KEY = "supported_agencies"

const isWithin30Days = (dateStr: string): boolean => {
  const diffDays = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  return diffDays < 30
}

const getTodayString = (): string => new Date().toISOString().split("T")[0]

export default function SupportPage() {
  const router = useRouter()
  const { isLoggedIn, isPremium, profile: authProfile, user } = useAuth()
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>([])
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [supportRecords, setSupportRecords] = useState<SupportRecord[]>([])
  const [isMounted, setIsMounted] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [partialFailedNames, setPartialFailedNames] = useState<string[]>([])
  const [nonMemberLimit, setNonMemberLimit] = useState(1)

  useEffect(() => {
    const fetchAgencies = async () => {
      const supabase = createClient()
      const [{ data }, { data: limitData }] = await Promise.all([
        supabase
          .from("support_agencies")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("app_settings")
          .select("value")
          .eq("key", "non_member_monthly_limit")
          .maybeSingle(),
      ])
      setAgencies(data ?? [])
      if (limitData) setNonMemberLimit(parseInt((limitData as { value: string }).value, 10))
      setLoading(false)
    }
    fetchAgencies()
  }, [])

  useEffect(() => {
    setIsMounted(true)

    const loadSupportHistory = async () => {
      // 로그인 사용자는 서버 이력 우선, 비로그인은 localStorage fallback
      if (isLoggedIn && user) {
        const supabase = createClient()
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const { data } = await supabase
          .from("support_history")
          .select("agency_id, sent_at")
          .eq("user_id", user.id)
          .gte("sent_at", thirtyDaysAgo.toISOString().split("T")[0])
        if (data) {
          const records = data.map((h) => ({ id: h.agency_id!, last_sent: h.sent_at }))
          setSupportRecords(records)
          return
        }
      }

      // 비로그인 fallback: localStorage
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as SupportRecord[]
          const validRecords = parsed.filter((r) => isWithin30Days(r.last_sent))
          setSupportRecords(validRecords)
          if (validRecords.length !== parsed.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(validRecords))
          }
        } catch {
          setSupportRecords([])
        }
      }
    }

    loadSupportHistory()
  }, [isLoggedIn, user])

  const nonMemberTotalSupports = useMemo(() => {
    if (isPremium) return 0
    return supportRecords.length
  }, [supportRecords, isPremium])

  const recentlySupportedIds = useMemo(
    () => new Set(supportRecords.map((r) => r.id)),
    [supportRecords]
  )

  const filteredAgencies = useMemo(() => {
    return agencies.filter((a) => {
      if (activeTab === "all") return true
      if (activeTab === "agency") return a.category === "광고에이전시"
      if (activeTab === "entertainment") return a.category === "엔터테인먼트"
      return true
    })
  }, [agencies, activeTab])

  const totalPages = Math.ceil(filteredAgencies.length / ITEMS_PER_PAGE)
  const paginatedAgencies = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredAgencies.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredAgencies, currentPage])

  useEffect(() => { setCurrentPage(1) }, [activeTab])

  const toggleAgency = (id: string) => {
    if (!isLoggedIn) { setShowLoginModal(true); return }
    if (recentlySupportedIds.has(id)) {
      alert("해당 기관에는 이번 달에 이미 프로필을 전송하셨습니다. 다음 달에 다시 시도해주세요.")
      return
    }
    setSelectedAgencies((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id])
  }

  const openWebsite = (website: string, e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(website, "_blank", "noopener,noreferrer")
  }

  const handleSendEmail = () => {
    if (selectedAgencies.length === 0) { alert("기관을 최소 1곳 이상 선택해주세요."); return }
    if (!isPremium) {
      const totalAfterSend = nonMemberTotalSupports + selectedAgencies.length
      if (totalAfterSend > nonMemberLimit) {
        alert(`비회원은 월 최대 ${nonMemberLimit}곳까지만 지원 가능합니다.`)
        router.push("/membership")
        return
      }
    }
    const duplicates = selectedAgencies.filter((id) => recentlySupportedIds.has(id))
    if (duplicates.length > 0) {
      const names = duplicates.map((id) => agencies.find((a) => a.id === id)?.name).filter(Boolean).join(", ")
      alert(`다음 기관은 이미 30일 이내에 지원하셨습니다: ${names}`)
      setSelectedAgencies((prev) => prev.filter((id) => !duplicates.includes(id)))
      return
    }
    setShowConfirmModal(true)
  }

  const confirmSend = async () => {
    setIsSending(true)
    try {
      const res = await fetch("/api/support/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agency_ids: selectedAgencies }),
      })

      if (!res.ok && res.status !== 207) {
        const err = await res.json()
        alert(err.error ?? "발송에 실패했습니다. 다시 시도해주세요.")
        return
      }

      const result = await res.json()

      // 서버 이력 재조회 (로그인 사용자)
      if (isLoggedIn && user) {
        const supabase = createClient()
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const { data } = await supabase
          .from("support_history")
          .select("agency_id, sent_at")
          .eq("user_id", user.id)
          .gte("sent_at", thirtyDaysAgo.toISOString().split("T")[0])
        if (data) {
          setSupportRecords(data.map((h) => ({ id: h.agency_id!, last_sent: h.sent_at })))
        }
      } else {
        // 비로그인 fallback: localStorage 갱신
        const today = getTodayString()
        const newRecords = [...supportRecords, ...selectedAgencies.map((id) => ({ id, last_sent: today }))]
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords))
        setSupportRecords(newRecords)
      }

      setPartialFailedNames(result.failed ?? [])
      setShowConfirmModal(false)
      setShowSuccessModal(true)
      setSelectedAgencies([])
    } finally {
      setIsSending(false)
    }
  }

  const renderPaginationButtons = () => {
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
    if (endPage - startPage + 1 < maxVisiblePages) startPage = Math.max(1, endPage - maxVisiblePages + 1)
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((i) => (
      <Button key={i} variant={currentPage === i ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(i)}
        className={currentPage === i ? "bg-primary text-primary-foreground" : ""}>{i}</Button>
    ))
  }

  const agencyCount = agencies.filter((a) => a.category === "광고에이전시").length
  const entertainmentCount = agencies.filter((a) => a.category === "엔터테인먼트").length

  return (
    <>
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-foreground lg:text-4xl mb-4">프로필 지원하기</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              광고에이전시 및 엔터테인먼트사에 프로필을 직접 지원하세요.<br />
              공개된 공식 이메일 주소로 회원이 직접 프로필을 전달할 수 있습니다.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 mb-8 max-w-4xl mx-auto">
            <h3 className="font-semibold text-foreground mb-3">프로필 지원 안내</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2"><span className="text-primary">•</span><span>동일 기관에는 스팸 방지를 위해 월 1회(30일)만 지원 가능하며, 중복 지원은 제한됩니다.</span></li>
              <li className="flex items-start gap-2"><span className="text-primary">•</span><span>본 기능은 광고에이전시 및 기획사에서 공개한 공식 이메일 주소로 회원이 직접 프로필을 지원할 수 있도록 돕는 서비스입니다.</span></li>
              <li className="flex items-start gap-2"><span className="text-primary">•</span><span>회원은 본인 프로필 지원 목적 외의 사용을 할 수 없으며, 관련 법령 위반 시 책임은 회원에게 있습니다.</span></li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>
                  <strong className="text-foreground">기본 회원은 월 {nonMemberLimit}곳까지</strong> 지원 가능하며,{" "}
                  <strong className="text-primary">멤버십 회원은 무제한</strong> 지원이 가능합니다.
                  {isMounted && !isPremium && (
                    <>
                      <span className="text-muted-foreground ml-1">(남은 지원: {Math.max(0, nonMemberLimit - nonMemberTotalSupports)}곳)</span>
                      <Button variant="link" size="sm" className="text-primary p-0 h-auto ml-2 underline" onClick={() => router.push("/membership")}>멤버십 가입하기</Button>
                    </>
                  )}
                </span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 max-w-6xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList className="grid w-full sm:w-auto grid-cols-3 bg-muted">
                <TabsTrigger value="all">전체 ({agencies.length})</TabsTrigger>
                <TabsTrigger value="agency">광고에이전시 ({agencyCount})</TabsTrigger>
                <TabsTrigger value="entertainment">엔터테인먼트 ({entertainmentCount})</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={handleSendEmail} disabled={selectedAgencies.length === 0}
              className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground">
              <Mail className="h-4 w-4 mr-2" />
              메일 전송하기 ({selectedAgencies.length})
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <span className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-6xl mx-auto">
              {paginatedAgencies.map((agency) => {
                const isRecentlySupported = recentlySupportedIds.has(agency.id)
                const isSelected = selectedAgencies.includes(agency.id)
                return (
                  <Card key={agency.id} className={`transition-all ${isRecentlySupported ? "border-muted bg-muted/50 opacity-60" : isSelected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/30"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox checked={isSelected} disabled={isRecentlySupported}
                          onCheckedChange={() => toggleAgency(agency.id)}
                          onClick={(e) => e.stopPropagation()} className="mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className={`text-xs px-2 py-0.5 rounded-full ${agency.category === "광고에이전시" ? "bg-primary/10 text-primary" : "bg-blue-50 text-blue-600"}`}>
                              {agency.category}
                            </span>
                            {isRecentlySupported && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">지원완료</span>}
                          </div>
                          <h3 className="font-semibold text-foreground">{agency.name}</h3>
                          {agency.website && (
                            <Button variant="ghost" size="sm" onClick={(e) => openWebsite(agency.website!, e)}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary p-0 h-auto mt-2">
                              공식 홈페이지 바로가기 <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {renderPaginationButtons()}
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </section>

      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4"><Lock className="h-8 w-8 text-muted-foreground" /></div>
            <DialogTitle className="text-center text-xl">로그인이 필요합니다</DialogTitle>
            <DialogDescription className="text-center pt-2">프로필 지원 기능을 이용하려면 로그인이 필요합니다.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setShowLoginModal(false)} className="flex-1">취소</Button>
            <Button onClick={() => router.push("/login")} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">로그인하기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle>프로필 지원 확인</DialogTitle>
            <DialogDescription>
              선택한 {selectedAgencies.length}개 기관에 프로필 이메일을 발송하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
            {selectedAgencies.map((id) => {
              const agency = agencies.find((a) => a.id === id)
              return agency ? (
                <div key={id} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  <span>{agency.name}</span>
                  <span className="text-muted-foreground">({agency.category})</span>
                </div>
              ) : null
            })}
          </div>
          {!isPremium && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
              <div className="text-xs text-yellow-700">
                <p>기본 회원은 월 {nonMemberLimit}곳까지만 지원 가능합니다.<br />전송 후 남은 지원: {Math.max(0, nonMemberLimit - nonMemberTotalSupports - selectedAgencies.length)}곳</p>
                <Button variant="link" size="sm" className="text-yellow-800 p-0 h-auto mt-1 underline font-semibold" onClick={() => { setShowConfirmModal(false); router.push("/membership") }}>무제한 지원을 위해 멤버십 가입하기</Button>
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            마이페이지에서 설정한 지원 템플릿으로 이메일이 발송됩니다.<br />
            발신자에 내 이름이 표시되며, 회신은 등록된 지원 이메일로 받을 수 있습니다.
          </p>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)} disabled={isSending}>취소</Button>
            <Button onClick={confirmSend} disabled={isSending} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {isSending ? "발송 중..." : "이메일 발송"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4 ${partialFailedNames.length > 0 ? "bg-yellow-100" : "bg-green-100"}`}>
              {partialFailedNames.length > 0
                ? <AlertTriangle className="h-8 w-8 text-yellow-600" />
                : <Check className="h-8 w-8 text-green-600" />}
            </div>
            <DialogTitle className="text-center text-xl">
              {partialFailedNames.length > 0 ? "일부 발송 완료" : "프로필 지원 완료"}
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              {partialFailedNames.length > 0 ? (
                <>
                  일부 기관에 발송이 실패했습니다.<br />
                  <span className="text-xs text-red-500 mt-1 block">실패: {partialFailedNames.join(", ")}</span>
                </>
              ) : (
                <>선택한 기관에 이메일이 발송되었습니다.</>
              )}
              <span className="text-sm text-muted-foreground mt-2 block">동일 기관에는 30일 이후에 다시 지원할 수 있습니다.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => { setShowSuccessModal(false); setPartialFailedNames([]) }} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
