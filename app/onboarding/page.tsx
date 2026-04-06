"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { useUser } from "@/contexts/user-context"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Toaster } from "@/components/ui/toaster"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  User,
  Phone,
  Check,
  X,
} from "lucide-react"
import { AlertCircle } from "lucide-react"

export default function OnboardingPage() {
  const router = useRouter()
  const { updateProfile, login } = useUser()
  const { toast } = useToast()

  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 2

  const [isCompleting, setIsCompleting] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    activityName: "",
    phone: "",
    email: "",
    birthDate: "",
    gender: "",
    height: "",
    weight: "",
    bio: "",
    etcInfo: "",
    career: [] as { year: string; channel: string; title: string; role: string }[],
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setFormData((prev) => ({ ...prev, email: prev.email || user.email! }))
      }
    })
  }, [])

  const [phoneOtpSent, setPhoneOtpSent] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [phoneOtp, setPhoneOtp] = useState("")
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [phoneVerifying, setPhoneVerifying] = useState(false)

  const handleAddCareer = () => {
    setFormData((prev) => ({
      ...prev,
      career: [...prev.career, { year: "", channel: "", title: "", role: "" }],
    }))
  }

  const handleUpdateCareer = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      career: prev.career.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    }))
  }

  const handleRemoveCareer = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      career: prev.career.filter((_, i) => i !== index),
    }))
  }

  const detectCategory = (channel: string): string => {
    const ch = channel.toLowerCase()
    if (ch.includes("kbs") || ch.includes("mbc") || ch.includes("sbs") || ch.includes("tvn") || ch.includes("jtbc")) return "드라마"
    if (ch.includes("cgv") || ch.includes("롯데") || ch.includes("메가박스") || ch.includes("영화")) return "영화"
    if (ch.includes("넷플릭스") || ch.includes("티빙") || ch.includes("웨이브") || ch.includes("왓챠") || ch.includes("디즈니")) return "OTT"
    if (ch.includes("광고") || ch.includes("cf")) return "광고"
    if (ch.includes("독립")) return "독립"
    if (ch.includes("뮤지컬")) return "뮤지컬"
    if (ch.includes("연극")) return "연극"
    return "드라마"
  }

  const handleComplete = async () => {
    if (isCompleting) return
    setIsCompleting(true)

    const careerList = formData.career
      .filter((c) => c.title.trim() !== "")
      .map((c, idx) => ({
        id: `onboarding-${idx}`,
        category: detectCategory(c.channel) as "드라마" | "영화" | "광고" | "OTT" | "숏폼" | "단편" | "독립" | "웹드라마" | "연극" | "뮤지컬" | "뮤직비디오",
        year: c.year,
        title: c.channel ? `${c.title} (${c.channel})` : c.title,
        role: c.role,
      }))

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          activityName: formData.activityName,
          phone: formData.phone,
          email: formData.email,
          birthDate: formData.birthDate,
          gender: formData.gender,
          height: formData.height,
          weight: formData.weight,
          bio: formData.bio,
          etcInfo: formData.etcInfo,
          careerList,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast({ title: "저장 실패", description: err.error ?? "잠시 후 다시 시도해주세요.", variant: "destructive" })
        setIsCompleting(false)
        return
      }
    } catch {
      toast({ title: "저장 실패", description: "네트워크 오류가 발생했습니다.", variant: "destructive" })
      setIsCompleting(false)
      return
    }

    updateProfile({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      birthDate: formData.birthDate,
      gender: formData.gender,
      height: formData.height,
      weight: formData.weight,
      bio: formData.bio,
      etcInfo: formData.etcInfo,
      careerList,
      portfolioFile: null,
      portfolioFileName: null,
    })

    login(false)
    toast({ title: "회원가입 완료", description: "피플앤아트에 오신 것을 환영합니다!" })
    window.location.href = "/"
  }

  const handleSendPhoneOtp = async () => {
    if (!formData.phone) return
    setPhoneVerifying(true)
    setPhoneError(null)
    const res = await fetch("/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: formData.phone }),
    })
    if (!res.ok) {
      const err = await res.json()
      if (err.code === "phone_already_exists") {
        setPhoneError("이미 가입된 휴대폰 번호입니다.")
      } else {
        toast({ title: "인증번호 발송 실패", description: err.error ?? "잠시 후 다시 시도해주세요.", variant: "destructive" })
      }
    } else {
      setPhoneOtpSent(true)
      toast({ title: "인증번호 발송", description: "휴대폰으로 인증번호가 발송되었습니다." })
    }
    setPhoneVerifying(false)
  }

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtp) return
    setPhoneVerifying(true)
    const res = await fetch("/api/sms/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: formData.phone, otp: phoneOtp }),
    })
    if (!res.ok) {
      const err = await res.json()
      toast({ title: "인증 실패", description: err.error ?? "인증번호가 올바르지 않습니다.", variant: "destructive" })
    } else {
      setPhoneVerified(true)
      toast({ title: "인증 완료", description: "휴대폰 번호가 인증되었습니다." })
    }
    setPhoneVerifying(false)
  }

  const canProceedToStep2 = !!(formData.name && formData.email && formData.phone && phoneVerified)
  const canComplete = !!(canProceedToStep2 && formData.bio)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {isCompleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="flex flex-col items-center gap-3 text-white">
            <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">가입 정보를 저장하는 중...</p>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Link href="/" className="flex items-center">
            <Image src="/images/logo-pa-002.png" alt="피플앤아트" width={120} height={40} className="h-10 w-auto object-contain" />
          </Link>
        </div>
      </header>

      <div className="bg-card border-b border-border">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">프로필 등록</span>
            <span className="text-sm text-muted-foreground">{currentStep} / {totalSteps}</span>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
          <div className="flex justify-between mt-2">
            {["기본 정보", "자기소개"].map((label, index) => (
              <div
                key={label}
                className={`flex items-center gap-1.5 text-xs ${
                  currentStep > index + 1
                    ? "text-primary"
                    : currentStep === index + 1
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {currentStep > index + 1 ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <div
                    className={`h-4 w-4 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                      currentStep === index + 1 ? "border-primary text-primary" : "border-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>
                )}
                <span className="hidden sm:inline">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 py-8 lg:py-12">
        <div className="mx-auto max-w-2xl">
          {/* Step 1: 기본 정보 */}
          {currentStep === 1 && (
            <Card className="border-border animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  기본 정보 입력
                </CardTitle>
                <CardDescription>프로필에 사용될 기본 정보를 입력해주세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">이름 (본명) <span className="text-destructive">*</span></Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="홍길동"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="activityName">활동명</Label>
                    <Input
                      id="activityName"
                      value={formData.activityName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, activityName: e.target.value }))}
                      placeholder="본명과 동일한 경우 본명으로 기입"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="phone">휴대폰 번호 <span className="text-destructive">*</span></Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => {
                              setFormData((prev) => ({ ...prev, phone: e.target.value }))
                              setPhoneVerified(false)
                              setPhoneOtpSent(false)
                              setPhoneError(null)
                            }}
                            placeholder="010-1234-5678"
                            className="pl-10"
                            disabled={phoneVerified}
                          />
                        </div>
                        {!phoneVerified && (
                          <Button type="button" variant="outline" onClick={handleSendPhoneOtp} disabled={phoneVerifying || !formData.phone} className="shrink-0 text-xs">
                            {phoneVerifying && !phoneOtpSent ? "발송 중..." : phoneOtpSent ? "재발송" : "인증번호 받기"}
                          </Button>
                        )}
                        {phoneVerified && (
                          <span className="flex items-center text-green-600 text-sm shrink-0 gap-1">
                            <Check className="h-4 w-4" />인증완료
                          </span>
                        )}
                      </div>
                      {phoneError && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />{phoneError}
                        </p>
                      )}
                      {phoneOtpSent && !phoneVerified && (
                        <div className="flex gap-2">
                          <Input
                            placeholder="인증번호 6자리"
                            value={phoneOtp}
                            onChange={(e) => setPhoneOtp(e.target.value)}
                            maxLength={6}
                            className="flex-1"
                          />
                          <Button type="button" onClick={handleVerifyPhoneOtp} disabled={phoneVerifying || phoneOtp.length < 6} className="shrink-0 text-xs bg-primary text-primary-foreground">
                            {phoneVerifying ? "확인 중..." : "확인"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">이메일 <span className="text-destructive">*</span></Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="example@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">생년월일</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, birthDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">성별</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData((prev) => ({ ...prev, gender: value }))}>
                      <SelectTrigger><SelectValue placeholder="선택하세요" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="남성">남성</SelectItem>
                        <SelectItem value="여성">여성</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">키 (cm)</Label>
                    <Input
                      id="height"
                      value={formData.height}
                      onChange={(e) => setFormData((prev) => ({ ...prev, height: e.target.value }))}
                      placeholder="175"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">몸무게 (kg)</Label>
                    <Input
                      id="weight"
                      value={formData.weight}
                      onChange={(e) => setFormData((prev) => ({ ...prev, weight: e.target.value }))}
                      placeholder="70"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>
                      주요 경력
                      <span className="text-xs text-muted-foreground ml-2">(년도 / 편성채널 / 제목 / 배역)</span>
                    </Label>
                    <Button variant="ghost" size="sm" onClick={handleAddCareer} className="text-primary hover:text-primary">
                      + 경력 추가
                    </Button>
                  </div>
                  {formData.career.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-border rounded-lg">
                      <p className="text-sm text-muted-foreground">등록된 경력이 없습니다</p>
                      <Button variant="ghost" size="sm" onClick={handleAddCareer} className="mt-2 text-primary">
                        첫 경력 추가하기
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.career.map((career, index) => (
                        <div key={index} className="p-3 rounded-lg border border-border">
                          <div className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-2">
                              <Input value={career.year} onChange={(e) => handleUpdateCareer(index, "year", e.target.value)} placeholder="년도" className="text-center text-sm" maxLength={4} />
                            </div>
                            <div className="col-span-2">
                              <Input value={career.channel} onChange={(e) => handleUpdateCareer(index, "channel", e.target.value)} placeholder="채널" className="text-sm" />
                            </div>
                            <div className="col-span-4">
                              <Input value={career.title} onChange={(e) => handleUpdateCareer(index, "title", e.target.value)} placeholder="작품 제목" className="text-sm" />
                            </div>
                            <div className="col-span-3">
                              <Input value={career.role} onChange={(e) => handleUpdateCareer(index, "role", e.target.value)} placeholder="배역" className="text-sm" />
                            </div>
                            <div className="col-span-1 flex justify-center">
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveCareer(index)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="etcInfo">기타 정보 (특기, 외국어 등)</Label>
                  <Input
                    id="etcInfo"
                    value={formData.etcInfo}
                    onChange={(e) => setFormData((prev) => ({ ...prev, etcInfo: e.target.value }))}
                    placeholder="특기: 검도, 수영 / 외국어: 영어(일상회화)"
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                  <Button
                    onClick={() => setCurrentStep(2)}
                    disabled={!canProceedToStep2}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    다음
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: 자기소개 */}
          {currentStep === 2 && (
            <Card className="border-border animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader>
                <CardTitle className="text-xl">자기소개</CardTitle>
                <CardDescription>자신을 소개하는 글을 작성해주세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="bio">자기소개 <span className="text-destructive">*</span></Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                    placeholder="자기소개를 입력해주세요..."
                    className="min-h-[160px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground">{formData.bio.length} / 500자</p>
                </div>

                {formData.career.length > 0 && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium text-foreground mb-2">등록된 경력</p>
                    <ul className="space-y-1">
                      {formData.career.filter((c) => c.title.trim()).map((career, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {career.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t border-border">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    이전
                  </Button>
                  <Button
                    onClick={handleComplete}
                    disabled={!canComplete || isCompleting}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isCompleting ? "저장 중..." : "가입 완료"}
                    <CheckCircle2 className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Toaster />
    </div>
  )
}
