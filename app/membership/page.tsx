"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import * as PortOne from "@portone/browser-sdk/v2"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUserSafe } from "@/contexts/user-context"
import { useAuth } from "@/hooks/use-auth"
import { 
  Check, Crown, ChevronDown, ChevronUp, CalendarDays, CheckCircle2, 
  Sparkles, Gift, Send, FileText, Megaphone, Users, Film, CreditCard, Coins, AlertCircle, XCircle
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { usePoints } from "@/hooks/use-points"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useToast } from "@/hooks/use-toast"
import { membershipData } from "@/data/content"

/**
 * [관리자 안내]
 * 멤버십 페이지의 모든 콘텐츠는 data/content.ts의 membershipData에서 관리합니다.
 * - 가격: membershipData.price
 * - 혜택 목록: membershipData.benefits
 * - 서비스 설명: membershipData.services
 * - FAQ: membershipData.faqs
 * - 비교표: membershipData.comparison
 * - 이용 방법: membershipData.steps
 */

// 스켈레톤 컴포넌트
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded ${className}`} />
}

// 스켈레톤 로딩 UI
function MembershipSkeleton() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="h-16 border-b border-border bg-card" />
      <main className="flex-1 py-12">
        <div className="mx-auto max-w-2xl px-4">
          <div className="text-center mb-10">
            <Skeleton className="h-10 w-48 mx-auto mb-6" />
            <Skeleton className="h-8 w-64 mx-auto mb-3" />
            <Skeleton className="h-5 w-80 mx-auto" />
          </div>
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-10 w-full mt-4" />
          </div>
        </div>
      </main>
    </div>
  )
}

// [관리자 안내] 서비스/단계 데이터는 data/content.ts에서 관리됩니다
const { services: serviceDetails, steps, comparison: comparisonFeatures, faqs: membershipFaqs, benefits: topBenefitsData } = membershipData

// data/content.ts의 값은 UI 레이아웃 계산용 초기값 (DB 로드 후 교체됨)
const MEMBERSHIP_PRICE_DEFAULT = membershipData.price

// 요금제 데이터
const plans = [
  {
    name: "기본 회원",
    label: "기본",
    price: "0원",
    description: "(공개된 공식 지원 채널 기준)",
    features: [
      "광고·엔터테인먼트 프로필 지원 총 5곳 제공",
    ],
    isRecommended: false,
  },
  {
    name: "멤버십 회원",
    label: "추천",
    price: `월 ${membershipData.price.toLocaleString()}원`,
    description: "(동일 기관 월 1회 중복 지원 불가)",
    features: [
      "광고·엔터 프로필 지원 무제한",
      "자동 프로필 투어",
      "작품 오디션 및 이벤트 우선 신청",
      "연기 특강 참여 기회",
    ],
    isRecommended: true,
  },
]

// FAQ 데이터
const faqItems = [
  {
    question: "멤버십은 어떻게 가입하나요?",
    answer: "회원가입 후 결제 페이지에서 멤버십(월 44,000원)을 선택해 결제하시면 됩니다. 추천인 코드가 있으시면 가입 시 입력해 주세요.",
  },
  {
    question: "프로필 투어는 무엇인가요?",
    answer: "작품·캐스팅 기준에 맞춰 회원 프로필이 캐스팅 담당자에게 자동 전달되는 서비스입니다. 멤버십 회원에게 제공됩니다.",
  },
  {
    question: "환불이 가능한가요?",
    answer: "환불 정책에 따라 이용 일수에 따른 차감 후 환불 가능합니다. 자세한 내용은 환불 정책 페이지를 확인해 주세요.",
  },
]

// 3D 스타일 아이콘 컴포넌트들
function Icon3DPaperPlane() {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <defs>
        <linearGradient id="planeGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id="planeGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fed7aa" />
          <stop offset="100%" stopColor="#fdba74" />
        </linearGradient>
        <filter id="planeShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.2"/>
        </filter>
      </defs>
      <g filter="url(#planeShadow)">
        <path d="M10 32L54 12L44 52L32 38L10 32Z" fill="url(#planeGrad1)" />
        <path d="M10 32L32 38L28 28L10 32Z" fill="url(#planeGrad2)" />
        <path d="M32 38L44 52L36 40L32 38Z" fill="#c2410c" />
        <path d="M54 12L32 38L28 28L54 12Z" fill="#fdba74" opacity="0.6" />
      </g>
    </svg>
  )
}

function Icon3DDocument() {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <defs>
        <linearGradient id="docGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f5f5f4" />
        </linearGradient>
        <linearGradient id="docGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <filter id="docShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.15"/>
        </filter>
      </defs>
      <g filter="url(#docShadow)">
        <path d="M16 8H40L48 16V56H16V8Z" fill="url(#docGrad1)" stroke="#e7e5e4" strokeWidth="1"/>
        <path d="M40 8V16H48L40 8Z" fill="#e7e5e4" />
        <rect x="22" y="24" width="20" height="3" rx="1.5" fill="url(#docGrad2)" />
        <rect x="22" y="32" width="16" height="2" rx="1" fill="#d6d3d1" />
        <rect x="22" y="38" width="18" height="2" rx="1" fill="#d6d3d1" />
        <rect x="22" y="44" width="14" height="2" rx="1" fill="#d6d3d1" />
      </g>
    </svg>
  )
}

function Icon3DMegaphone() {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <defs>
        <linearGradient id="megaGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
        <linearGradient id="megaGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fdba74" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
        <filter id="megaShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.2"/>
        </filter>
      </defs>
      <g filter="url(#megaShadow)">
        <path d="M12 28L12 36L18 38L18 26L12 28Z" fill="#78716c" />
        <path d="M18 26L18 38L42 50L42 14L18 26Z" fill="url(#megaGrad1)" />
        <path d="M18 26L42 14L42 50L18 38" fill="url(#megaGrad2)" opacity="0.5" />
        <ellipse cx="46" cy="32" rx="6" ry="10" fill="url(#megaGrad1)" />
        <ellipse cx="47" cy="32" rx="4" ry="7" fill="#1c1917" />
        <path d="M14 38L14 48L20 48L22 38L14 38Z" fill="#a8a29e" />
      </g>
      <circle cx="52" cy="18" r="2" fill="#f97316" opacity="0.6" />
      <circle cx="56" cy="24" r="1.5" fill="#f97316" opacity="0.4" />
      <circle cx="54" cy="14" r="1" fill="#f97316" opacity="0.3" />
    </svg>
  )
}

function Icon3DMicrophone() {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <defs>
        <linearGradient id="micGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
        <linearGradient id="micGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#78716c" />
          <stop offset="100%" stopColor="#57534e" />
        </linearGradient>
        <filter id="micShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.2"/>
        </filter>
      </defs>
      <g filter="url(#micShadow)">
        <rect x="26" y="8" width="12" height="28" rx="6" fill="url(#micGrad1)" />
        <rect x="28" y="10" width="2" height="8" rx="1" fill="#fed7aa" opacity="0.4" />
        <path d="M20 28V32C20 39 25 44 32 44C39 44 44 39 44 32V28" stroke="url(#micGrad2)" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <rect x="30" y="44" width="4" height="10" fill="url(#micGrad2)" />
        <rect x="24" y="52" width="16" height="4" rx="2" fill="url(#micGrad2)" />
      </g>
    </svg>
  )
}

function Icon3DBriefcase() {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <defs>
        <linearGradient id="briefGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
        <linearGradient id="briefGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fdba74" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>
        <filter id="briefShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.2"/>
        </filter>
      </defs>
      <g filter="url(#briefShadow)">
        <path d="M24 18V14C24 11 26 9 28 9H36C38 9 40 11 40 14V18" stroke="#a8a29e" strokeWidth="2" fill="none"/>
        <rect x="8" y="18" width="48" height="32" rx="4" fill="url(#briefGrad1)" />
        <rect x="8" y="18" width="48" height="12" rx="4" fill="url(#briefGrad2)" />
        <rect x="28" y="28" width="8" height="6" rx="1" fill="#7c2d12" />
        <rect x="30" y="30" width="4" height="2" rx="0.5" fill="#fed7aa" />
        <path d="M8 30H28V34H8V30Z" fill="url(#briefGrad1)" opacity="0.3" />
        <path d="M36 30H56V34H36V30Z" fill="url(#briefGrad1)" opacity="0.3" />
      </g>
    </svg>
  )
}

// 상단 아이콘 혜택 - 3D 스타일
const topBenefits = [
  { Icon: Icon3DPaperPlane, label: "광고에이전시·엔터테인먼트로\n프로필 지원하기" },
  { Icon: Icon3DDocument, label: "프로필 양식 제공" },
  { Icon: Icon3DMegaphone, label: "작품 오디션·이벤트\n우선 신청 기회" },
  { Icon: Icon3DMicrophone, label: "연기 특강 참여 기회" },
  { Icon: Icon3DBriefcase, label: "자동 프로필 투어" },
]

export default function MembershipPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, profile } = useAuth()
  const isCastingDirector = profile?.role === "casting_director"
  
  /**
   * [중앙 집중식 포인트 관리 - Single Source of Truth]
   * 
   * 포인트 데이터는 오직 usePoints() 훅에서만 가져옵니다.
   * - userPoints: 현재 보유 포인트 (모든 UI가 이 값을 참조)
   * - setUserPoints: 포인트 변경 함수 (차감/복구 시 사용)
   * - deductPoints: 포인트 차감 (토스트 옵션 포함)
   * - addPoints: 포인트 추가 (토스트 옵션 포함)
   * 
   * 주의: useUserSafe()의 points를 직접 사용하지 마세요.
   * 모든 포인트 관련 작업은 usePoints() 훅을 통해 처리합니다.
   */
  const { 
    points: userPoints, // 중앙 관리되는 포인트 (Single Source of Truth)
    setPoints: setUserPoints, // 포인트 직접 설정
    deductPoints, 
    addPoints,
  } = usePoints()
  
  const {
    status,
    upgradeToPremium,
    membershipState,
    membershipExpiryDate,
    setMembershipExpiryDate,
    pointRenewalReservation,
    setMembershipState,
    reservePointRenewal,
    cancelPointRenewal,
    cancelMembership,
  } = useUserSafe()
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 멤버십 설정값 (DB에서 로드)
  const [MEMBERSHIP_PRICE, setMEMBERSHIP_PRICE] = useState(MEMBERSHIP_PRICE_DEFAULT)
  const [signupBonusAmount, setSignupBonusAmount] = useState(membershipData.signupBonus)

  useEffect(() => {
    fetch("/api/settings/membership")
      .then((r) => r.json())
      .then((d) => {
        if (d.membershipPrice) setMEMBERSHIP_PRICE(d.membershipPrice)
        if (d.signupBonus) setSignupBonusAmount(d.signupBonus)
      })
      .catch(() => {})

    fetch("/api/membership/status")
      .then((r) => r.json())
      .then((d) => {
        if (d.hasBillingKey) setHasBillingKey(true)
      })
      .catch(() => {})
  }, [])

  // 추천인 코드 상태 (신규 가입용)
  const [referralCodeInput, setReferralCodeInput] = useState("")
  const [referralValidating, setReferralValidating] = useState(false)
  const [referralValidResult, setReferralValidResult] = useState<{ valid: boolean; error?: string; referrerName?: string } | null>(null)

  // 포인트 사용 관련 상태 (신규 가입용)
  const [usePointsForPayment, setUsePointsForPayment] = useState(false)

  // 포인트 갱신 관련 상태 (기존 회원용)
  const [usePointsForRenewal, setUsePointsForRenewal] = useState(false)
  const [renewalPointInput, setRenewalPointInput] = useState("")
  const [isRenewing, setIsRenewing] = useState(false)

  /**
   * [상태 머신 정의]
   * 
   * 상태 흐름:
   * 1. 초기 상태: isPaid=false, isPointApplied=false, lastUsedPoints=0
   * 2. 포인트 적용: isPaid=false, isPointApplied=true, lastUsedPoints=사용포인트
   * 3. 결제 완료: isPaid=true, isPointApplied=false, lastUsedPoints=사용포인트 (취소용 보존)
   * 4. 결제 취소: isPaid=false, isPointApplied=false, lastUsedPoints=0 (초기화)
   * 
   * 불가능한 상태 조합:
   * - isPaid=true && isPointApplied=true (결제 완료 시 적용 상태는 해제됨)
   * 
   * 진실의 근원 (Single Source of Truth):
   * - 모든 포인트 표시: useUserSafe()의 points (Context)
   * - 포인트 차감/복구: setContextPoints() 사용
   */
  
  // 결제 완료 상태 (이번 달 결제 완료 여부)
  const [isPaid, setIsPaid] = useState(false) // 결제 완료 여부 (기본: 미결제)
  
  // 포인트 적용 상태 (적용 버튼 클릭 시 고정) - isPaid가 true이면 항상 false
  const [isPointApplied, setIsPointApplied] = useState(false)

  // 실제 사용된 포인트 (결제 시점에 기록, 취소 시 이 값만 환불)
  // 주의: 이 값은 취소 시에만 사용되며, 현재 보유 포인트와 무관
  const [lastUsedPoints, setLastUsedPoints] = useState(0)

  // 포인트 사용 취소 확인 팝업 상태 (Confirm Modal)
  const [showPointCancelConfirm, setShowPointCancelConfirm] = useState(false)
  const [isCancellingPoints, setIsCancellingPoints] = useState(false)

  // 자동갱신 토글 상태
  const [isTogglingAutoRenew, setIsTogglingAutoRenew] = useState(false)

  // 등록된 결제수단 여부
  const [hasBillingKey, setHasBillingKey] = useState(false)

  // 멤버십 해지 팝업 상태 (서비스 탈퇴)
  const [showTerminationDialog, setShowTerminationDialog] = useState(false)
  const [terminationReason, setTerminationReason] = useState("")
  const [terminationReasonDetail, setTerminationReasonDetail] = useState("")
  const [isTerminating, setIsTerminating] = useState(false)

  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    // 초기 로딩 시뮬레이션 (실제 API 연동 시 데이터 로딩)
    const timer = setTimeout(() => {
      setIsMounted(true)
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // 추천인 코드 검증
  const validateReferralCode = async (code: string) => {
    if (!code.trim()) {
      setReferralValidResult(null)
      return
    }
    setReferralValidating(true)
    try {
      const res = await fetch(`/api/referral/validate?code=${encodeURIComponent(code.trim())}`)
      const data = await res.json()
      setReferralValidResult(data)
    } catch {
      setReferralValidResult({ valid: false, error: "검증 중 오류가 발생했습니다." })
    } finally {
      setReferralValidating(false)
    }
  }

  // 실제 결제 금액 계산 (신규 가입용) - userPoints 사용
  const usablePoints = usePointsForPayment ? Math.min(userPoints, MEMBERSHIP_PRICE) : 0
  const finalPaymentAmount = MEMBERSHIP_PRICE - usablePoints

  // 자동갱신 토글 처리
  const handleAutoRenewToggle = async () => {
    const isCurrentlyActive = membershipState !== "pending_cancellation"
    setIsTogglingAutoRenew(true)
    try {
      const res = await fetch("/api/billing/issue", {
        method: isCurrentlyActive ? "DELETE" : "PATCH",
      })
      if (!res.ok) {
        const err = await res.json()
        toast({ title: "처리 실패", description: err.error, variant: "destructive" })
        return
      }
      if (isCurrentlyActive) {
        setMembershipState("pending_cancellation")
        toast({ title: "자동갱신이 해지되었습니다.", description: "현재 기간 만료 후 자동 결제가 중단됩니다." })
      } else {
        setMembershipState("active")
        toast({ title: "자동갱신이 재활성화되었습니다.", description: "매월 자동으로 갱신됩니다." })
      }
    } catch {
      toast({ title: "오류가 발생했습니다.", variant: "destructive" })
    } finally {
      setIsTogglingAutoRenew(false)
    }
  }

  // 결제 처리 (포트원 V2 KG이니시스)
  const handlePayment = async () => {
    if (!user) {
      toast({ title: "로그인이 필요합니다.", variant: "destructive" })
      router.push("/login?redirectTo=/membership")
      return
    }

    setIsProcessing(true)

    try {
      let billingKey: string | null = null

      // 포인트 전액 결제가 아닌 경우만 빌링키 발급
      if (finalPaymentAmount > 0) {
        const billingKeyResponse = await PortOne.requestIssueBillingKey({
          storeId: "store-dabf3ae7-8dae-40f8-911c-cc1f578fbfbe",
          channelKey: "channel-key-cf3ab2fe-e949-45df-80f4-3b7b57808ca6",
          billingKeyMethod: "CARD",
          issueId: `billing-${user.id}-${Date.now()}`,
          issueName: "피플앤아트 멤버십",
          offerPeriod: { interval: "1m" },
          customer: {
            customerId: user.id,
            email: user.email ?? undefined,
            phoneNumber: profile?.phone ?? undefined,
            fullName: profile?.name ?? undefined,
          },
        })

        if (billingKeyResponse?.code !== undefined) {
          toast({ title: "결제 실패", description: billingKeyResponse.message ?? "결제가 취소되었습니다.", variant: "destructive" })
          return
        }

        billingKey = billingKeyResponse?.billingKey ?? null
        if (!billingKey) {
          toast({ title: "빌링키 발급 실패", variant: "destructive" })
          return
        }
      }

      // 서버에서 첫 결제 실행 + 빌링키 저장 (0원 결제 시 billingKey=null)
      const issueRes = await fetch("/api/billing/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingKey, pointsUsed: usablePoints, referralCode: referralCodeInput.trim() || undefined }),
      })

      if (!issueRes.ok) {
        const err = await issueRes.json()
        console.error("[결제 실패 상세]", err)
        toast({ title: "결제 실패", description: `${err.error ?? "오류"} / ${JSON.stringify(err.details ?? "")}`, variant: "destructive" })
        return
      }

      const { newPoints, referralBonusAwarded } = await issueRes.json()
      upgradeToPremium()
      setUserPoints(newPoints)

      toast({
        title: "멤버십 가입 완료!",
        description: referralBonusAwarded
          ? `환영합니다! 가입 축하 ${signupBonusAmount.toLocaleString()}P + 추천인 보너스 포인트가 지급되었습니다.`
          : `환영합니다! 가입 축하 ${signupBonusAmount.toLocaleString()}P가 지급되었습니다. 매월 자동갱신됩니다.`,
      })

      router.refresh()
    } catch (err) {
      console.error("[결제 오류]", err)
      const message = err instanceof Error ? err.message : String(err)
      toast({ title: "결제 중 오류가 발생했습니다.", description: message, variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  // 다음 결제일 계산 (DB에서 불러온 실제 만료일 사용)
  const getNextPaymentDate = () => {
    const baseDate = membershipExpiryDate ?? (() => {
      const d = new Date(); d.setDate(d.getDate() + 30); return d
    })()
    return baseDate.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // 다음 결제일 Date 객체
  const getNextPaymentDateObj = () => {
    return membershipExpiryDate ?? (() => {
      const d = new Date(); d.setDate(d.getDate() + 30); return d
    })()
  }

  // D-7 정책: 결제일까지 남은 일수 계산
  const getDaysUntilPayment = () => {
    const today = new Date()
    const paymentDate = getNextPaymentDateObj()
    const diffTime = paymentDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // 갱신 취소 가능 여부 (D-7 정책: 결제일 7일 전부터 취소 불가)
  const canCancelRenewal = getDaysUntilPayment() > 7

  // 해지 사유 옵션
  const cancelReasonOptions = [
    { value: "price", label: "이용료가 부담됩니다" },
    { value: "no_opportunity", label: "기대한 기회를 얻지 못했습니다" },
    { value: "service_unsatisfied", label: "서비스 이용에 불만족합니다" },
    { value: "temporary_break", label: "잠시 활동을 쉬려고 합니다" },
    { value: "other", label: "기타" },
  ]

  // 포인트 사용 취소 처리 (포인트 복구 + 44,000원 자동결제 상태로 원복)
  const handleCancelPointUsage = async () => {
    setIsCancellingPoints(true)

    // 서버 요청 시뮬레이션
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // 환불할 포인트 결정: lastUsedPoints (결제 시점에 기록된 값만 사용)
    const refundPoints = lastUsedPoints

    // 포인트 갱신 예약 취소 (예약 정보만 삭제)
    if (pointRenewalReservation) {
      cancelPointRenewal()
    }

    // 정확한 포인트 복구: 현재 보유 포인트 + 실제 사용했던 포인트 (lastUsedPoints)
    if (refundPoints > 0) {
      const newPoints = userPoints + refundPoints
      setUserPoints(newPoints) // 중앙 포인트 업데이트 → 헤더 등 모든 UI 즉시 반영
    }

    // 모든 상태 초기화 → 포인트 입력 폼이 다시 나타나도록
    setUsePointsForRenewal(false)
    setRenewalPointInput("")
    setIsPointApplied(false)
    setIsPaid(false) // 결제 완료 상태도 초기화 → 초록색 박스 제거, 입력 폼 표시
    setLastUsedPoints(0) // 사용 포인트 기록 초기화
    setShowPointCancelConfirm(false)
    setIsCancellingPoints(false)

    toast({
      title: "포인트 사용이 취소되었습니다",
      description: refundPoints > 0 
        ? `${refundPoints.toLocaleString()}P가 복구되었습니다. 다음 결제일에 ${MEMBERSHIP_PRICE.toLocaleString()}원이 카드로 자동 결제됩니다.`
        : `다음 결제일에 ${MEMBERSHIP_PRICE.toLocaleString()}원이 카드로 자동 결제됩니다.`,
    })
  }

  // 멤버십 해지 처리 (서비스 탈퇴 → 해지 대기 상태로 전환)
  const handleTerminateMembership = async () => {
    if (!terminationReason) {
      toast({
        title: "해지 사유를 선택해 주세요",
        variant: "destructive",
      })
      return
    }

    setIsTerminating(true)

    // 서버 요청 시뮬레이션
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // 해지 대기 상태로 전환 (즉시 해지 X)
    cancelMembership()

    toast({
      title: "멤버십 해지 예약 완료",
      description: `${getNextPaymentDate()}까지 프리미엄 혜택을 계속 이용하실 수 있습니다. 이후 자동으로 일반 회원으로 전환됩니다.`,
    })

    // 상태 초기화
    setTerminationReason("")
    setTerminationReasonDetail("")
    setShowTerminationDialog(false)
    setIsTerminating(false)
  }

  // 갱신용 포인트 입력값 파싱 (실시간 검증) - userPoints 사용
  const renewalPointValue = parseInt(renewalPointInput.replace(/,/g, "")) || 0
  // 입력 포인트는 보유 포인트(userPoints)와 멤버십 가격 중 작은 값을 초과할 수 없음
  const renewalUsablePoints = usePointsForRenewal 
    ? Math.min(renewalPointValue, userPoints, MEMBERSHIP_PRICE) 
    : 0
  // 최종 결제 금액 = 멤버십 가격 - 사용 포인트
  const renewalFinalAmount = MEMBERSHIP_PRICE - renewalUsablePoints

  // 포인트 입력값 포맷팅
  const formatPointInput = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, "")
    const number = parseInt(numericValue) || 0
    return number.toLocaleString()
  }

  // 전액 사용 버튼 - userPoints 사용
  const handleUseAllPoints = () => {
    const maxUsable = Math.min(userPoints, MEMBERSHIP_PRICE)
    setRenewalPointInput(maxUsable.toLocaleString())
  }

  // 포인트 적용 버튼 (실시간 검증 후 적용)
  const handleApplyPoints = () => {
    // 실시간 검증: 입력값이 보유 포인트 또는 멤버십 가격을 초과하는지 확인
    if (renewalUsablePoints <= 0) {
      toast({
        title: "포인트를 입력해 주세요",
        variant: "destructive",
      })
      return
    }
    
    // 적용 시점에 사용 포인트 기록 (취소 시 이 값만 환불)
    setLastUsedPoints(renewalUsablePoints)
    setIsPointApplied(true)
    
    toast({
      title: "포인트 적용 완료",
      description: `${renewalUsablePoints.toLocaleString()}P가 적용되었습니다. 최종 결제 금액: ${renewalFinalAmount.toLocaleString()}원`,
    })
  }

  // 포인트 적용 취소 (확인 팝업 열기)
  const handleCancelPointApply = () => {
    setShowPointCancelConfirm(true)
  }

  // 포인트 갱신 예약 처리 (결제일에 자동 적용)
  const handleRenewalPayment = async () => {
    // 포인트 적용이 안 된 경우 검증
    if (usePointsForRenewal && !isPointApplied) {
      toast({
        title: "포인트를 먼저 적용해 주세요",
        description: "포인트 적용 버튼을 눌러 적용 후 결제해 주세요.",
        variant: "destructive",
      })
      return
    }

    setIsRenewing(true)

    try {
      const usedPoints = lastUsedPoints
      const renewRes = await fetch("/api/membership/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pointsUsed: usedPoints }),
      })

      if (!renewRes.ok) {
        const err = await renewRes.json()
        toast({ title: "갱신 실패", description: err.error, variant: "destructive" })
        return
      }

      const { newPoints, expiresAt } = await renewRes.json()
      setUserPoints(newPoints)
      // 만료일 업데이트
      if (expiresAt) setMembershipExpiryDate(new Date(expiresAt))

      toast({
        title: "멤버십 갱신 완료",
        description: usedPoints > 0
          ? `${usedPoints.toLocaleString()}P 사용. 잔여 포인트: ${newPoints.toLocaleString()}P`
          : "멤버십이 갱신되었습니다.",
      })

      setRenewalPointInput("")
      setUsePointsForRenewal(false)
      setIsPaid(true)
      setIsPointApplied(false)
      setLastUsedPoints(0)
    } catch {
      toast({ title: "오류가 발생했습니다.", variant: "destructive" })
    } finally {
      setIsRenewing(false)
    }
  }

  // 로딩 중 스켈레톤 표시
  if (isLoading) {
    return <MembershipSkeleton />
  }

  // 이미 멤버십 회원인 경우 - 상태 대시보드
  if (isMounted && status === "premium") {
    return (
      <section className="py-12 lg:py-20">
        <div className="mx-auto max-w-2xl px-4">
            {/* 해지 대기 상태 안내 배너 */}
            {membershipState === "pending_cancellation" && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-800">멤버십 해지 예약 중</p>
                    <p className="text-sm text-amber-700 mt-1">
                      현재 프리미엄 멤버십을 이용 중입니다. <span className="font-semibold">{getNextPaymentDate()}</span> 이후 멤버십이 자동 종료됩니다.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAutoRenewToggle}
                      disabled={isTogglingAutoRenew}
                      className="mt-3 text-amber-700 border-amber-300 hover:bg-amber-100"
                    >
                      해지 취소하고 멤버십 유지하기
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* 포인트 갱신 예약 안내 배너 */}
            {pointRenewalReservation && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <Coins className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-blue-800">포인트 갱신 예약됨</p>
                    <p className="text-sm text-blue-700 mt-1">
                      다음 결제일에 <span className="font-semibold">{pointRenewalReservation.pointsToUse.toLocaleString()}P</span> 사용 + 
                      <span className="font-semibold"> {pointRenewalReservation.finalPaymentAmount.toLocaleString()}원</span> 카드 결제가 예약되어 있습니다.
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPointCancelConfirm(true)}
                        disabled={!canCancelRenewal}
                        className="text-blue-700 border-blue-300 hover:bg-blue-100"
                      >
                        <XCircle className="h-4 w-4 mr-1.5" />
                        포인트 사용 취소
                      </Button>
                      {!canCancelRenewal && (
                        <span className="text-xs text-amber-600">결제일 1주일 전부터는 취소 불가</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 상태 안내 헤더 */}
            <div className="text-center mb-10">
              <div className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 mb-6 ${
                membershipState === "pending_cancellation" ? "bg-amber-100 text-amber-800" : "gold-badge"
              }`}>
                <Crown className="h-5 w-5" />
                <span className="font-semibold tracking-wide">
                  {membershipState === "pending_cancellation" ? "PENDING CANCELLATION" : "PREMIUM MEMBER"}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-3">
                {membershipState === "pending_cancellation" ? "멤버십 이용 중 (해지 예정)" : "멤버십 회원입니다"}
              </h1>
              <p className="text-muted-foreground text-lg">
                {membershipState === "pending_cancellation" 
                  ? `${getNextPaymentDate()}까지 프리미엄 혜택을 이용하실 수 있습니다.`
                  : "모든 프로필 지원 혜택을 무제한으로 이용 중입니다."
                }
              </p>
            </div>

            {/* 멤버십 상태 대시보드 카드 */}
            <Card className="border border-border shadow-sm mb-8">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    멤버십 상태
                  </CardTitle>
                  <Badge className={`border-0 text-xs ${
                    membershipState === "pending_cancellation" 
                      ? "bg-amber-100 text-amber-800" 
                      : "gold-badge"
                  }`}>
                    {membershipState === "pending_cancellation" ? "해지 예정" : "활성"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span className="text-sm text-muted-foreground">멤버십 상태</span>
                  </div>
                  <span className="font-medium text-foreground">프리미엄 멤버십</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    <span className="text-sm text-muted-foreground">다음 결제일</span>
                  </div>
                  <span className="font-medium text-foreground">{getNextPaymentDate()}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Gift className="h-5 w-5 text-primary" />
                    <span className="text-sm text-muted-foreground">월 이용료</span>
                  </div>
                  <span className="font-medium text-foreground">{membershipData.price.toLocaleString()}원</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <span className="text-sm text-muted-foreground">결제수단</span>
                  </div>
                  <span className="font-medium text-foreground">신용카드/체크카드</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    <div>
                      <span className="text-sm text-muted-foreground">자동갱신</span>
                      <p className="text-xs text-muted-foreground/70">
                        {membershipState === "pending_cancellation" ? "현재 기간 만료 후 종료" : "매월 자동 결제"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={membershipState !== "pending_cancellation"}
                    onCheckedChange={handleAutoRenewToggle}
                    disabled={isTogglingAutoRenew}
                  />
                </div>

                {/* 혜택 요약 */}
                <div className="pt-4 mt-4 border-t border-border">
                  <p className="text-sm font-medium text-foreground mb-4">현재 이용 중인 혜택</p>
                  <div className="grid gap-2.5">
                    {[
                      "광고/엔터테인먼트 프로필 지원 무제한",
                      "자동 프로필 투어 서비스",
                      "작품 오디션 및 이벤트 우선 신청",
                      "연기 특강 참여 기회",
                    ].map((benefit) => (
                      <div key={benefit} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm text-muted-foreground">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3 pt-2">
                <Button
                  onClick={() => router.push("/")}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11"
                >
                  홈으로 돌아가기
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/mypage")}
                  className="w-full h-11"
                >
                  마이페이지로 이동
                </Button>

                {/* 자동갱신 해지 안내 (pending_cancellation 상태일 때) */}
                {membershipState === "pending_cancellation" && (
                  <div className="w-full pt-4 border-t border-border mt-2">
                    <p className="text-xs text-center text-muted-foreground">
                      {getNextPaymentDate()}까지 프리미엄 혜택이 유지됩니다.
                    </p>
                  </div>
                )}

              </CardFooter>
            </Card>

            {/* 포인트 결제/갱신 섹션 */}
            <div className="mt-8 p-6 bg-white border border-border rounded-xl shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Coins className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">포인트로 멤버십 갱신</h2>
                  <p className="text-sm text-muted-foreground">보유 포인트를 사용하여 다음 달 멤버십을 미리 갱신하세요.</p>
                </div>
              </div>

              {/* 결제 완료 시 (isPaid === true) - 완료 메시지 + 취소 버튼 표시 */}
              {isPaid ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-800 mb-2">포인트 결제 갱신이 완료되었습니다.</h3>
                  <p className="text-sm text-green-700">
                    다음 결제일은 <span className="font-semibold">{getNextPaymentDate()}</span>입니다.
                  </p>
                  <p className="text-xs text-muted-foreground mt-4">
                    다음 결제일에 자동으로 갱신됩니다.
                  </p>
                  
                  {/* 포인트 사용 취소 버튼 */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPointCancelConfirm(true)}
                    disabled={!canCancelRenewal}
                    className="mt-4 text-green-700 border-green-300 hover:bg-green-100"
                  >
                    <XCircle className="h-4 w-4 mr-1.5" />
                    포인트 사용 취소하기
                  </Button>
                  {!canCancelRenewal && (
                    <p className="text-xs text-amber-600 mt-2">결제일 1주일 전부터는 취소가 불가능합니다.</p>
                  )}
                </div>
              ) : (
                <>
                  {/* 결제 전 (isPaid === false) - 포인트 입력 UI 표시 */}
                  
                  {/* 포인트 우선 차감 스위치 */}
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg mb-4">
                    <div className="flex items-center gap-3">
                      <Switch
                        id="use-points-renewal"
                        checked={usePointsForRenewal}
                        onCheckedChange={(checked) => {
                          if (!isPointApplied) {
                            setUsePointsForRenewal(checked)
                            if (!checked) setRenewalPointInput("")
                          }
                        }}
                        disabled={userPoints <= 0 || isPointApplied}
                      />
                      <Label htmlFor="use-points-renewal" className="cursor-pointer">
                        <span className="font-medium text-foreground">보유 포인트</span>
                        <span className="text-primary font-bold ml-1">({userPoints.toLocaleString()}P)</span>
                        <span className="text-muted-foreground ml-1">우선 차감 사용</span>
                      </Label>
                    </div>
                    
                    {/* 포인트 적용 완료 시 취소 버튼 */}
                    {isPointApplied && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelPointApply}
                        className="text-xs text-destructive hover:text-destructive"
                      >
                        취소하기
                      </Button>
                    )}
                  </div>

                  {/* 포인트 입력 섹션 - 스위치 활성화 시에만 표시 */}
                  {usePointsForRenewal && (
                    <div className="space-y-4 mb-6 p-4 border border-border rounded-lg bg-card">
                      <div className="space-y-2">
                        <Label htmlFor="point-input" className="text-sm font-medium">
                          사용할 포인트 입력
                        </Label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              id="point-input"
                              type="text"
                              inputMode="numeric"
                              value={renewalPointInput}
                              onChange={(e) => !isPointApplied && setRenewalPointInput(formatPointInput(e.target.value))}
                              placeholder="0"
                              disabled={isPointApplied}
                              className={`pr-8 text-right text-lg font-medium ${isPointApplied ? "bg-gray-100 text-gray-500" : ""}`}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                              P
                            </span>
                          </div>
                          
                          {/* 포인트 적용 전: 전액 사용 + 포인트 적용 버튼 */}
                          {!isPointApplied ? (
                            <>
                              <Button
                                variant="outline"
                                onClick={handleUseAllPoints}
                                className="whitespace-nowrap font-medium border-primary text-primary hover:bg-primary hover:text-white"
                              >
                                전액 사용
                              </Button>
                              <Button
                                onClick={handleApplyPoints}
                                disabled={renewalUsablePoints <= 0}
                                className="whitespace-nowrap font-medium bg-primary text-white hover:bg-primary/90"
                              >
                                포인트 적용
                              </Button>
                            </>
                          ) : (
                            /* 포인트 적용 후: 완료 표시 */
                            <div className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-md text-gray-500">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="text-sm font-medium">포인트 적용 완료</span>
                            </div>
                          )}
                        </div>
                        {!isPointApplied && renewalPointValue > userPoints && (
                          <p className="text-xs text-destructive">
                            보유 포인트({userPoints.toLocaleString()}P)를 초과하여 입력할 수 없습니다.
                          </p>
                        )}
                        {!isPointApplied && renewalPointValue > MEMBERSHIP_PRICE && (
                          <p className="text-xs text-amber-600">
                            최대 사용 가능 포인트는 {MEMBERSHIP_PRICE.toLocaleString()}P입니다.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 최종 결제 금액 계산 */}
                  <div className="bg-muted/50 rounded-xl p-5 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">멤버십 이용료</span>
                      <span className="font-medium text-foreground">{MEMBERSHIP_PRICE.toLocaleString()}원</span>
                    </div>
                    {isPointApplied && renewalUsablePoints > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">포인트 사용</span>
                        <span className="font-medium text-destructive">-{renewalUsablePoints.toLocaleString()}P</span>
                      </div>
                    )}
                    <div className="border-t border-border pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-foreground">최종 결제 금액</span>
                        <span className="text-2xl font-bold text-primary">
                          {isPointApplied ? renewalFinalAmount.toLocaleString() : MEMBERSHIP_PRICE.toLocaleString()}원
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 결제수단 없고 포인트로 전액 커버 안 될 때 안내 */}
                  {!hasBillingKey && renewalFinalAmount > 0 && (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
                      등록된 결제수단이 없습니다. 포인트로 전액({MEMBERSHIP_PRICE.toLocaleString()}P) 결제하시거나, 멤버십 가입 시 카드를 등록해 주세요.
                    </p>
                  )}

                  {/* 갱신 버튼 */}
                  <Button
                    onClick={handleRenewalPayment}
                    disabled={isRenewing || (usePointsForRenewal && !isPointApplied) || (!hasBillingKey && renewalFinalAmount > 0)}
                    className="w-full h-12 mt-4 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isRenewing ? (
                      "갱신 처리 중..."
                    ) : isPointApplied ? (
                      `${renewalUsablePoints.toLocaleString()}P + ${renewalFinalAmount.toLocaleString()}원 결제하기`
                    ) : (
                      `${MEMBERSHIP_PRICE.toLocaleString()}원 결제하기`
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground mt-4">
                    갱신 결제 시 다음 결제일이 30일 연장됩니다.
                  </p>
                </>
              )}
            </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            멤버십 해지 또는 문의사항은{" "}
            <a href="mailto:support@peopleart.co.kr" className="text-primary hover:underline">
              support@peopleart.co.kr
            </a>
            로 연락해주세요.
          </p>

          {/* 포인트 사용 취소 확인 팝업 (Confirm Modal) */}
          <Dialog open={showPointCancelConfirm} onOpenChange={setShowPointCancelConfirm}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-blue-600" />
                  포인트 사용을 취소하시겠습니까?
                </DialogTitle>
                <DialogDescription>
                  취소 시 포인트 결제 예약이 해제되고, 포인트 입력 화면으로 돌아갑니다.
                </DialogDescription>
              </DialogHeader>

              <div className="py-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <p className="text-sm text-blue-800 font-medium">취소 후 변경 사항:</p>
                  <ul className="text-sm text-blue-700 space-y-1 ml-4 list-disc">
                    <li>적용된 포인트가 복구됩니다.</li>
                    <li>포인트 입력 폼이 다시 표시됩니다.</li>
                    <li>다음 결제일에 <span className="font-semibold">{MEMBERSHIP_PRICE.toLocaleString()}원</span>이 카드로 자동 결제됩니다.</li>
                  </ul>
                </div>
              </div>

              <DialogFooter className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={() => setShowPointCancelConfirm(false)}
                  disabled={isCancellingPoints}
                  className="w-full sm:w-auto"
                >
                  취소
                </Button>
                <Button
                  onClick={handleCancelPointUsage}
                  disabled={isCancellingPoints}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isCancellingPoints ? "처리 중..." : "확인"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* 멤버십 해지 사유 팝업 (Dialog) */}
          <Dialog open={showTerminationDialog} onOpenChange={setShowTerminationDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-destructive" />
                  멤버십 해지
                </DialogTitle>
                <DialogDescription>
                  멤버십을 해지하시겠습니까? {getNextPaymentDate()}까지 혜택이 유지됩니다.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">해지 사유를 선택해 주세요</Label>
                  <RadioGroup value={terminationReason} onValueChange={setTerminationReason}>
                    {cancelReasonOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-3">
                        <RadioGroupItem value={option.value} id={`term-${option.value}`} />
                        <Label htmlFor={`term-${option.value}`} className="text-sm cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {terminationReason === "other" && (
                  <div className="space-y-2">
                    <Label htmlFor="termination-detail" className="text-sm font-medium">
                      상세 사유를 입력해 주세요
                    </Label>
                    <Textarea
                      id="termination-detail"
                      value={terminationReasonDetail}
                      onChange={(e) => setTerminationReasonDetail(e.target.value)}
                      placeholder="해지 사유를 자세히 적어주시면 서비스 개선에 참고하겠습니다."
                      className="resize-none"
                      rows={3}
                    />
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700">
                      해지 예약 시 현재 이용 중인 멤버십 혜택은 <span className="font-semibold">{getNextPaymentDate()}</span>까지 유지됩니다.
                      이후 자동으로 일반 회원으로 전환되며, 프로필 지원 횟수가 제한됩니다.
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={() => setShowTerminationDialog(false)}
                  disabled={isTerminating}
                  className="w-full sm:w-auto"
                >
                  취소
                </Button>
                <Button
                  onClick={handleTerminateMembership}
                  disabled={isTerminating || !terminationReason}
                  variant="destructive"
                  className="w-full sm:w-auto"
                >
                  {isTerminating ? "처리 중..." : "멤버십 해지"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </section>
    )
  }

  // 일반 회원용 - 멤버십 안내 + 결제 폼
  return (
    <>
      {/* Hero Section */}
        <section className="py-16 lg:py-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4 leading-tight">
              프로필 투어를 넘어, 실제 기회로
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10">
              피플앤아트 멤버십은 배우의 활동 전반을 서포트하며,<br className="hidden sm:block" />
              캐스팅 검토로 연결되는 플랫폼입니다.
            </p>

{/* 상단 3D 아이콘 혜택 카드 */}
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6 max-w-5xl mx-auto">
  {topBenefits.map((benefit, index) => (
  <div
  key={benefit.label}
  className="group relative flex flex-col items-center text-center p-5 rounded-2xl bg-card border border-border shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300"
  style={{
    transform: "translateY(0px)",
    animation: `float 3s ease-in-out ${index * 0.2}s infinite`,
  }}
  >
  {/* 3D 아이콘 컨테이너 - Floating 효과 */}
  <div className="relative w-16 h-16 lg:w-20 lg:h-20 mb-4">
  {/* 그림자 베이스 */}
  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-3 bg-primary/10 rounded-full blur-sm" />
  {/* 아이콘 */}
  <div className="relative z-10 w-full h-full transform group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-300">
  <benefit.Icon />
  </div>
  </div>
  {/* 텍스트 */}
  <span className="text-sm font-medium text-foreground leading-tight group-hover:text-primary transition-colors">
  {benefit.label}
  </span>
  </div>
  ))}
  </div>
          </div>
        </section>

        {/* 소개 텍스트 */}
        <section className="py-12 bg-background">
          <div className="mx-auto max-w-3xl px-4 text-center">
      <p className="text-muted-foreground leading-relaxed">
        피플앤아트는 단순히 프로필을 전달하는 곳이 아닙니다.<br />
        배우가 직접 자신을 어필할 수 있는 기회를 제공하는 플랫폼입니다.
      </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              작품과 캐스팅 기준에 맞춰 배우의 프로필이 실제 캐스팅 담당자에게 전달되며,<br className="hidden sm:block" />
              검토 가능한 배우로 연결되는 구조를 지향합니다.
            </p>
          </div>
        </section>

        {/* 이용 방법 */}
        <section className="py-16 bg-muted/30">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="text-2xl font-bold text-foreground text-center mb-10">이용 방법</h2>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-center gap-6 md:gap-8">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-start gap-4 flex-1">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 서비스 안내 - 이미지 카드 UI */}
        <section className="py-20 bg-background">
          <div className="mx-auto max-w-6xl px-4">
            {/* 섹션 헤더 */}
            <div className="text-center mb-14">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 px-4 py-1.5">
                MEMBERSHIP BENEFITS
              </Badge>
      <h2 className="text-3xl font-bold text-foreground mb-4">
        피플앤아트의 차별화된 멤버십 혜택
      </h2>
      <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
        멤버십으로 연결되는 실제 기회를 만나보세요.
      </p>
            </div>

            {/* 서비스 카드 그리드 - Flexbox 자동 높이 조절 */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 items-stretch">
              {serviceDetails.map((service, index) => (
                <div 
                  key={service.number} 
                  className="group flex flex-col overflow-hidden rounded-2xl bg-card border border-border shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
                >
                  {/* 이미지 영역 - 고정 높이 */}
                  <div className="relative h-48 shrink-0 overflow-hidden">
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* 넘버 뱃지 */}
                    <div className="absolute top-4 left-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-lg">
                      {service.number}
                    </div>
                    {/* 그라데이션 오버레이 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* 텍스트 영역 - 자동 높이, 전체 텍스트 표시 */}
                  <div className="flex-1 p-6 flex flex-col">
                    <h3 className="font-bold text-foreground text-lg mb-2 group-hover:text-primary transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-sm text-primary font-medium mb-3">
                      {service.subtitle}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed break-words">
                      {service.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 이용 요금 안내 */}
        <section className="py-16 bg-muted/30">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="text-2xl font-bold text-foreground text-center mb-10">이용 요금 안내</h2>

            <div className="grid gap-6 md:grid-cols-2">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative ${
                    plan.isRecommended
                      ? "border-2 border-primary shadow-md"
                      : "border border-border"
                  }`}
                >
                  <div className="absolute top-4 left-4">
                    <Badge 
                      variant={plan.isRecommended ? "default" : "secondary"}
                      className={plan.isRecommended ? "bg-primary text-primary-foreground" : ""}
                    >
                      {plan.label}
                    </Badge>
                  </div>
                  <CardHeader className="pt-12 pb-2">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    {plan.description && (
                      <CardDescription className="text-xs">{plan.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <span className="text-3xl font-bold text-foreground">
                        {plan.isRecommended ? `월 ${MEMBERSHIP_PRICE.toLocaleString()}원` : plan.price}
                      </span>
                    </div>
                    <ul className="space-y-2.5">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          {feature.startsWith("(") ? (
                            <span className="text-xs text-muted-foreground ml-5">{feature}</span>
                          ) : (
                            <>
                              <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                              <span className="text-sm text-foreground">{feature}</span>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 멤버십 가입 버튼 */}
            {!isCastingDirector && (
              <div className="mt-8 text-center">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-10"
                  onClick={() => {
                    if (!user) {
                      router.push("/login?redirectTo=/membership")
                      return
                    }
                    document.getElementById("payment-form")?.scrollIntoView({ behavior: "smooth" })
                  }}
                >
                  멤버십 가입하기
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* 자주 묻는 질문 */}
        <section className="py-16 bg-background">
          <div className="mx-auto max-w-2xl px-4">
            <h2 className="text-2xl font-bold text-foreground text-center mb-10">자주 묻는 질문</h2>

            <Accordion type="single" collapsible className="space-y-3">
              {faqItems.map((item, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="border border-border rounded-lg px-4 bg-card"
                >
                  <AccordionTrigger className="text-left text-foreground hover:no-underline py-4">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* 결제 폼 - 로그인한 유저에게만 표시 (캐스팅디렉터 제외) */}
        {user && !isCastingDirector && <section id="payment-form" className="py-16 bg-muted/30">
          <div className="mx-auto max-w-md px-4">
            <Card className="border border-border shadow-sm">
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">멤버십 결제</CardTitle>
                </div>
                <CardDescription>
                  KG이니시스 카드결제로 안전하게 시작하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* 결제 금액 안내 */}
                <div className="rounded-xl bg-muted/50 p-4 text-center space-y-1">
                  <p className="text-sm text-muted-foreground">멤버십 이용료 (1개월)</p>
                  <p className="text-3xl font-bold text-primary">{MEMBERSHIP_PRICE.toLocaleString()}원</p>
                  <p className="text-xs text-muted-foreground">결제 후 30일간 멤버십 혜택 제공</p>
                </div>

                {/* 포인트 사용 섹션 */}
                <div className="border-t border-border pt-5 mt-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-primary" />
                      <Label htmlFor="use-points" className="font-medium cursor-pointer">
                        보유 포인트 사용
                      </Label>
                    </div>
                    <Switch
                      id="use-points"
                      checked={usePointsForPayment}
                      onCheckedChange={setUsePointsForPayment}
                      disabled={userPoints <= 0}
                    />
                  </div>

                  {/* 포인트 정보 */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">보유 포인트</span>
                      <span className={`font-medium ${userPoints > 0 ? "text-primary" : "text-muted-foreground"}`}>
                        {userPoints.toLocaleString()}P
                      </span>
                    </div>
                    {usePointsForPayment && usablePoints > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">사용할 포인트</span>
                        <span className="font-medium text-destructive">-{usablePoints.toLocaleString()}P</span>
                      </div>
                    )}
                    <div className="border-t border-border pt-2 mt-2 flex justify-between">
                      <span className="font-medium text-foreground">최종 결제 금액</span>
                      <span className="font-bold text-lg text-foreground">
                        {finalPaymentAmount.toLocaleString()}원
                      </span>
                    </div>
                  </div>

                  {/* 포인트 부족 알림 */}
                  {userPoints <= 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      사용 가능한 포인트가 없습니다.
                    </p>
                  )}
                </div>

                {/* 추천인 코드 입력 */}
                <div className="space-y-2">
                  <Label htmlFor="referral-code" className="text-sm font-medium text-foreground">
                    추천인 코드 <span className="text-muted-foreground font-normal">(선택)</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="referral-code"
                      placeholder="추천인 코드를 입력하세요"
                      value={referralCodeInput}
                      onChange={(e) => {
                        setReferralCodeInput(e.target.value.toUpperCase())
                        setReferralValidResult(null)
                      }}
                      onBlur={() => validateReferralCode(referralCodeInput)}
                      className="bg-background uppercase"
                      maxLength={20}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => validateReferralCode(referralCodeInput)}
                      disabled={referralValidating || !referralCodeInput.trim()}
                      className="shrink-0"
                    >
                      {referralValidating ? "확인 중..." : "확인"}
                    </Button>
                  </div>
                  {referralValidResult && (
                    <p className={`text-xs ${referralValidResult.valid ? "text-green-600" : "text-destructive"}`}>
                      {referralValidResult.valid
                        ? `✓ ${referralValidResult.referrerName}님의 코드가 확인되었습니다. 가입 시 보너스 포인트가 지급됩니다.`
                        : `✗ ${referralValidResult.error}`}
                    </p>
                  )}
                  {!referralValidResult && (
                    <p className="text-xs text-muted-foreground">
                      멤버십 회원의 추천인 코드 입력 시 추천인과 가입자 모두 보너스 포인트가 지급됩니다.
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full h-12 text-base font-semibold"
                >
                  {isProcessing
                    ? "결제 처리 중..."
                    : `카드로 ${finalPaymentAmount.toLocaleString()}원 결제하기`
                  }
                </Button>
                {usePointsForPayment && usablePoints > 0 && (
                  <p className="text-xs text-center text-muted-foreground">
                    {usablePoints.toLocaleString()}P 사용 + {finalPaymentAmount.toLocaleString()}원 결제
                  </p>
                )}
              </CardFooter>
            </Card>

            {/* 안내 링크 */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>
                결제 진행 시{" "}
                <a href="#" className="text-primary hover:underline">서비스 이용약관</a>
                {" "}및{" "}
                <a href="#" className="text-primary hover:underline">개인정보 처리방침</a>
                에 동의하는 것으로 간주합니다.
              </p>
            </div>
          </div>
        </section>}
    </>
  )
}
