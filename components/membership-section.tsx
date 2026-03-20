"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Check, Crown, Mail, FileText, Megaphone, Users, User, ArrowRight } from "lucide-react"

const membershipBenefits = [
  {
    icon: Mail,
    title: "광고에이전시·엔터테인먼트로 프로필 지원하기",
    description: "공개된 공식 지원 채널을 통한 무제한 프로필 지원",
  },
  {
    icon: FileText,
    title: "프로필 양식 제공",
    description: "처음 시작하는 배우를 위한 전용 양식 다운로드",
  },
  {
    icon: Megaphone,
    title: "작품 오디션·이벤트 우선 신청 기회",
    description: "멤버십 회원 대상 우선 오디션 및 이벤트 참여",
  },
  {
    icon: Users,
    title: "연기 특강 참여 기회",
    description: "현업 배우가 직접 진행하는 실전 중심 특강",
  },
  {
    icon: User,
    title: "자동 프로필 투어",
    description: "캐스팅 담당자에게 직접 전달되는 프로필 투어",
  },
]

const plans = [
  {
    name: "기본 회원",
    price: "0원",
    description: "기본 서비스 이용",
    features: [
      "프로필 양식 다운로드",
      "광고·엔터 프로필 지원 (월 5곳 제한)",
    ],
    isRecommended: false,
  },
  {
    name: "멤버십 회원",
    price: "월 44,000원",
    description: "모든 서비스 이용 가능",
    features: [
      "프로필 양식 다운로드",
      "광고·엔터 프로필 지원 무제한",
      "자동 프로필 투어",
      "작품 오디션 및 이벤트 우선 신청",
      "연기 특강 참여 기회",
    ],
    isRecommended: true,
  },
]

const steps = [
  { number: 1, title: "회원가입", description: "사이트에서 회원가입 후 로그인합니다." },
  { number: 2, title: "멤버십 결제", description: "결제 페이지에서 멤버십(월 44,000원)을 선택해 결제합니다." },
  { number: 3, title: "기회 연결", description: "프로필 투어, 오디션 이벤트·특강 등 멤버십 혜택을 이용합니다." },
]

export function MembershipSection() {
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [referralCode, setReferralCode] = useState("")

  return (
    <section id="membership" className="py-16 lg:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-foreground lg:text-3xl">피플앤아트 MEMBERSHIP</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            프로필 투어를 넘어, 실제 기회로 연결되는 플랫폼<br />
            피플앤아트 멤버십은 배우의 활동 전반을 서포트하며, 캐스팅 검토로 연결되는 플랫폼입니다.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-16">
          {membershipBenefits.map((benefit) => (
            <div
              key={benefit.title}
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                <benefit.icon className="h-7 w-7" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-2">{benefit.title}</h3>
              <p className="text-xs text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* How to Use */}
        <div className="mb-16">
          <h3 className="text-xl font-bold text-foreground text-center mb-8">이용 방법</h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center gap-4">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg mb-2">
                    {step.number}
                  </div>
                  <h4 className="font-semibold text-foreground">{step.title}</h4>
                  <p className="text-sm text-muted-foreground max-w-[200px] mt-1">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="hidden md:block h-6 w-6 text-muted-foreground mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto mb-12">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative overflow-hidden ${
                plan.isRecommended
                  ? "border-2 border-primary shadow-lg"
                  : "border border-border"
              }`}
            >
              {plan.isRecommended && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-bl-lg">
                  추천
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {plan.isRecommended && <Crown className="h-5 w-5 text-primary" />}
                  {plan.name}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => plan.isRecommended && setShowPaymentModal(true)}
                  className={`w-full ${
                    plan.isRecommended
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground hover:bg-muted"
                  }`}
                  disabled={!plan.isRecommended}
                >
                  {plan.isRecommended ? "멤버십 가입하기" : "현재 이용중"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Referral Code Section */}
        <div className="max-w-md mx-auto text-center">
          <p className="text-sm text-muted-foreground mb-4">
            추천인 코드가 있으시다면 멤버십 결제 시 입력하세요.
          </p>
        </div>

        {/* Payment Modal */}
        <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
          <DialogContent className="sm:max-w-md bg-card">
            <DialogHeader>
              <DialogTitle className="text-xl">멤버십 결제</DialogTitle>
              <DialogDescription>
                본 멤버십은 월 단위 자동 결제 방식으로 운영됩니다.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="card-number">카드번호</Label>
                <Input
                  id="card-number"
                  placeholder="0000 0000 0000 0000"
                  className="bg-background"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">유효기간</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birth">생년월일 (6자리)</Label>
                  <Input
                    id="birth"
                    placeholder="000000"
                    className="bg-background"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호 (앞 두자리)</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="00"
                  maxLength={2}
                  className="bg-background"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="referral">추천인 ID (선택)</Label>
                <Input
                  id="referral"
                  placeholder="추천인 ID를 입력하세요"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  추천인 ID를 입력하면 결제 완료 후 추천인과 가입자에게 각각 10,000P가 지급됩니다.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                onClick={() => setShowPaymentModal(false)}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                멤버십 가입 하기
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}
