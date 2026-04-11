"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User, Phone, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const supabase = createClient()

  const [mode, setMode] = useState<"login" | "signup">(
    searchParams.get("mode") === "signup" ? "signup" : "login"
  )
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<"kakao" | "google" | "naver" | null>(null)
  const [phoneOtpSent, setPhoneOtpSent] = useState(false)
  const [phoneOtp, setPhoneOtp] = useState("")
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [phoneVerifying, setPhoneVerifying] = useState(false)
  const [signupPhone, setSignupPhone] = useState("")
  const [policyModal, setPolicyModal] = useState<"terms" | "privacy" | null>(null)
  const [welcomeBonus, setWelcomeBonus] = useState<number | null>(null)

  // 비밀번호 찾기
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetLoading, setResetLoading] = useState(false)

  // 계정 찾기
  const [showFindDialog, setShowFindDialog] = useState(false)
  const [findPhone, setFindPhone] = useState("")
  const [findPhoneOtp, setFindPhoneOtp] = useState("")
  const [findPhoneOtpSent, setFindPhoneOtpSent] = useState(false)
  const [findPhoneVerified, setFindPhoneVerified] = useState(false)
  const [findPhoneVerifying, setFindPhoneVerifying] = useState(false)
  const [findResult, setFindResult] = useState<{ maskedEmail: string; provider: string } | null>(null)

  const redirectTo = searchParams.get("redirectTo") ?? "/"
  const error = searchParams.get("error")
  const errorProvider = searchParams.get("provider")

  const providerLabels: Record<string, string> = {
    kakao: "카카오", google: "구글", naver: "네이버", email: "이메일", phone: "휴대폰",
  }

  useEffect(() => {
    if (error === "auth_failed") {
      toast({ title: "로그인 실패", description: "소셜 로그인에 실패했습니다. 다시 시도해주세요.", variant: "destructive" })
    } else if (error === "email_taken") {
      const providerLabel = providerLabels[errorProvider ?? ""] ?? errorProvider ?? "다른 방법"
      toast({ title: "이미 가입된 이메일", description: `이미 ${providerLabel}(으)로 가입된 이메일입니다. ${providerLabel}로 로그인해주세요.`, variant: "destructive" })
    } else if (error === "email_already_exists") {
      toast({ title: "이미 가입된 이메일", description: "해당 이메일로 이미 가입된 계정이 있습니다. 기존 가입 방법으로 로그인해주세요.", variant: "destructive" })
    }
  }, [error])

  // 이미 로그인된 경우 리다이렉트 (로컬 세션 확인만, 네트워크 호출 없음)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) router.push(redirectTo)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 웰컴포인트 설정 로드 (활성화된 경우에만 배너 노출)
  useEffect(() => {
    supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["welcome_points_enabled", "welcome_points_amount"])
      .then(({ data }) => {
        const settings = data ?? []
        const enabled = settings.find((s) => s.key === "welcome_points_enabled")?.value === "true"
        const amount = parseInt(settings.find((s) => s.key === "welcome_points_amount")?.value ?? "0", 10)
        if (enabled && amount > 0) setWelcomeBonus(amount)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleKakaoLogin = async () => {
    setOauthLoading("kakao")
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: `${window.location.origin}/auth/callback?redirectTo=${redirectTo}` },
    })
  }

  const handleNaverLogin = () => {
    setOauthLoading("naver")
    window.location.href = `/api/auth/naver?redirectTo=${encodeURIComponent(redirectTo)}`
  }

  const handleGoogleLogin = async () => {
    setOauthLoading("google")
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?redirectTo=${redirectTo}` },
    })
  }

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const form = e.currentTarget
    const email = (form.elements.namedItem("email") as HTMLInputElement).value
    const password = (form.elements.namedItem("password") as HTMLInputElement).value

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      // 소셜 로그인으로 가입된 계정인지 확인
      const checkRes = await fetch("/api/auth/check-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }).then(r => r.json()).catch(() => ({ provider: null }))
      if (checkRes.provider && checkRes.provider !== "email") {
        const label = providerLabels[checkRes.provider] ?? checkRes.provider
        toast({ title: "이미 가입된 이메일", description: `이 계정은 ${label}(으)로 가입된 계정입니다. ${label}로 로그인해주세요.`, variant: "destructive" })
      } else {
        toast({ title: "로그인 실패", description: "이메일 또는 비밀번호를 확인해주세요.", variant: "destructive" })
      }
      setIsLoading(false)
    } else {
      window.location.href = redirectTo
    }
  }

  const formatPhoneToE164 = (phone: string) => {
    const cleaned = phone.replace(/[-\s]/g, "")
    if (cleaned.startsWith("010") || cleaned.startsWith("011")) {
      return `+82${cleaned.substring(1)}`
    }
    return `+82${cleaned}`
  }

  const handleSendPhoneOtp = async () => {
    if (!signupPhone) {
      toast({ title: "오류", description: "휴대폰 번호를 입력해주세요.", variant: "destructive" })
      return
    }
    setPhoneVerifying(true)
    const { error } = await supabase.auth.signInWithOtp({ phone: formatPhoneToE164(signupPhone) })
    if (error) {
      toast({ title: "인증번호 발송 실패", description: error.message, variant: "destructive" })
    } else {
      setPhoneOtpSent(true)
      toast({ title: "인증번호 발송", description: "휴대폰으로 인증번호가 발송되었습니다." })
    }
    setPhoneVerifying(false)
  }

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtp) return
    setPhoneVerifying(true)
    const { error } = await supabase.auth.verifyOtp({ phone: formatPhoneToE164(signupPhone), token: phoneOtp, type: "sms" })
    if (error) {
      toast({ title: "인증 실패", description: "인증번호가 올바르지 않습니다.", variant: "destructive" })
    } else {
      setPhoneVerified(true)
      toast({ title: "인증 완료", description: "휴대폰 번호가 인증되었습니다." })
      await supabase.auth.signOut()
    }
    setPhoneVerifying(false)
  }

  const handleResetPassword = async () => {
    if (!resetEmail) {
      toast({ title: "오류", description: "이메일을 입력해주세요.", variant: "destructive" })
      return
    }
    setResetLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      })
      if (res.ok) {
        toast({ title: "발송 완료", description: "임시 비밀번호가 이메일로 발송되었습니다." })
        setShowResetDialog(false)
        setResetEmail("")
      } else {
        const data = await res.json().catch(() => ({}))
        toast({ title: "발송 실패", description: data.error ?? "다시 시도해주세요.", variant: "destructive" })
      }
    } catch {
      toast({ title: "오류", description: "네트워크 오류가 발생했습니다.", variant: "destructive" })
    }
    setResetLoading(false)
  }

  const handleSendFindPhoneOtp = async () => {
    if (!findPhone) {
      toast({ title: "오류", description: "휴대폰 번호를 입력해주세요.", variant: "destructive" })
      return
    }
    setFindPhoneVerifying(true)
    const { error } = await supabase.auth.signInWithOtp({ phone: formatPhoneToE164(findPhone) })
    if (error) {
      toast({ title: "인증번호 발송 실패", description: error.message, variant: "destructive" })
    } else {
      setFindPhoneOtpSent(true)
      toast({ title: "인증번호 발송", description: "휴대폰으로 인증번호가 발송되었습니다." })
    }
    setFindPhoneVerifying(false)
  }

  const handleVerifyFindPhoneOtp = async () => {
    if (!findPhoneOtp) return
    setFindPhoneVerifying(true)
    const { error } = await supabase.auth.verifyOtp({ phone: formatPhoneToE164(findPhone), token: findPhoneOtp, type: "sms" })
    if (error) {
      toast({ title: "인증 실패", description: "인증번호가 올바르지 않습니다.", variant: "destructive" })
      setFindPhoneVerifying(false)
      return
    }
    await supabase.auth.signOut()
    setFindPhoneVerified(true)
    toast({ title: "인증 완료", description: "휴대폰 번호가 인증되었습니다." })
    // 계정 찾기 API 호출
    try {
      const res = await fetch("/api/auth/find-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: findPhone }),
      })
      if (res.ok) {
        const data = await res.json()
        setFindResult({ maskedEmail: data.maskedEmail, provider: data.provider })
      } else {
        const data = await res.json().catch(() => ({}))
        toast({ title: "계정 조회 실패", description: data.error ?? "계정을 찾을 수 없습니다.", variant: "destructive" })
      }
    } catch {
      toast({ title: "오류", description: "네트워크 오류가 발생했습니다.", variant: "destructive" })
    }
    setFindPhoneVerifying(false)
  }

  const handleEmailSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!phoneVerified) {
      toast({ title: "휴대폰 인증 필요", description: "휴대폰 번호 인증을 완료해주세요.", variant: "destructive" })
      return
    }
    setIsLoading(true)
    const form = e.currentTarget
    const name = (form.elements.namedItem("name") as HTMLInputElement).value
    const phone = (form.elements.namedItem("phone") as HTMLInputElement).value
    const email = (form.elements.namedItem("email") as HTMLInputElement).value
    const password = (form.elements.namedItem("password") as HTMLInputElement).value

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, phone },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      toast({ title: "가입 실패", description: error.message, variant: "destructive" })
    } else if (data.user && (data.user.identities?.length ?? 0) === 0) {
      // 이미 가입된 이메일 — 소셜 provider 확인
      const checkRes = await fetch("/api/auth/check-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }).then(r => r.json()).catch(() => ({ provider: null }))
      if (checkRes.provider) {
        const label = providerLabels[checkRes.provider] ?? checkRes.provider
        toast({ title: "이미 가입된 이메일", description: `이 계정은 ${label}(으)로 가입된 계정입니다. ${label}로 로그인해주세요.`, variant: "destructive" })
      } else {
        toast({ title: "이미 가입된 이메일", description: "해당 이메일로 이미 가입된 계정이 있습니다. 로그인을 시도해주세요.", variant: "destructive" })
      }
    } else {
      toast({ title: "가입 완료!", description: "이메일을 확인하여 인증을 완료해주세요." })
      if (welcomeBonus && welcomeBonus > 0) {
        setTimeout(() => {
          toast({
            title: "🎉 웰컴 포인트 지급!",
            description: `${welcomeBonus.toLocaleString()}P가 지급되었습니다. 지금 바로 사용해보세요!`,
          })
        }, 400)
      }
      router.push("/onboarding")
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
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

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-border shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-full">
            {/* 소셜 로그인 버튼 (공통) */}
            <div className="px-6 pt-6 space-y-3">
              <Button
                type="button"
                className="w-full h-12 bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#3C1E1E] font-semibold gap-2 active:scale-95 transition-transform"
                onClick={handleKakaoLogin}
                disabled={!!oauthLoading}
              >
                {oauthLoading === "kakao" ? (
                  <div className="w-5 h-5 border-2 border-[#3C1E1E]/30 border-t-[#3C1E1E] rounded-full animate-spin" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path fillRule="evenodd" clipRule="evenodd" d="M9 0C4.029 0 0 3.164 0 7.07c0 2.52 1.669 4.73 4.187 6.007l-1.068 3.98a.29.29 0 0 0 .447.313L8.1 14.64c.297.034.6.052.9.052 4.971 0 9-3.164 9-7.07C18 3.164 13.971 0 9 0z" fill="#3C1E1E"/>
                  </svg>
                )}
                카카오로 {oauthLoading === "kakao" ? "연결 중..." : "시작하기"}
              </Button>

              <Button
                type="button"
                className="w-full h-12 bg-[#03C75A] hover:bg-[#02b350] text-white font-semibold gap-2 active:scale-95 transition-transform"
                onClick={handleNaverLogin}
                disabled={!!oauthLoading}
              >
                {oauthLoading === "naver" ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="font-bold text-white text-base leading-none">N</span>
                )}
                네이버로 {oauthLoading === "naver" ? "연결 중..." : "시작하기"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 gap-2 border-border active:scale-95 transition-transform"
                onClick={handleGoogleLogin}
                disabled={!!oauthLoading}
              >
                {oauthLoading === "google" ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                )}
                구글로 {oauthLoading === "google" ? "연결 중..." : "시작하기"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">또는 이메일로</span>
                </div>
              </div>
            </div>

            {/* 로그인 폼 */}
            {mode === "login" && (
              <form onSubmit={handleEmailLogin}>
                <CardHeader className="pt-4">
                  <CardTitle className="text-xl">이메일 로그인</CardTitle>
                  <CardDescription>이메일과 비밀번호로 로그인하세요</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">이메일</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="email" name="email" type="email" placeholder="example@email.com" className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">비밀번호</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password" name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="비밀번호를 입력하세요"
                        className="pl-10 pr-10" required
                      />
                      <Button type="button" variant="ghost" size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 flex flex-col gap-3">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "로그인 중..." : "로그인"}
                  </Button>
                  <p className="text-sm text-center text-muted-foreground">
                    아직 계정이 없으신가요?{" "}
                    <button type="button" onClick={() => setMode("signup")} className="text-primary font-medium hover:underline">
                      회원가입
                    </button>
                  </p>
                  <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => { setShowResetDialog(true) }}
                      className="hover:text-foreground hover:underline"
                    >
                      비밀번호 찾기
                    </button>
                    <span>|</span>
                    <button
                      type="button"
                      onClick={() => { setShowFindDialog(true); setFindPhone(""); setFindPhoneOtp(""); setFindPhoneOtpSent(false); setFindPhoneVerified(false); setFindResult(null) }}
                      className="hover:text-foreground hover:underline"
                    >
                      계정 찾기
                    </button>
                  </div>
                </CardFooter>
              </form>
            )}

            {/* 회원가입 폼 */}
            {mode === "signup" && (
              <form onSubmit={handleEmailSignup}>
                {welcomeBonus && welcomeBonus > 0 && (
                  <div className="mx-6 mt-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-white shadow-sm">
                    <p className="text-sm font-medium leading-tight">지금 가입하고,</p>
                    <p className="text-lg font-bold leading-tight">
                      {welcomeBonus.toLocaleString()}P 받아가세요!
                    </p>
                  </div>
                )}
                <CardHeader className="pt-4">
                  <CardTitle className="text-xl">이메일 회원가입</CardTitle>
                  <CardDescription>피플앤아트의 캐스팅 기회를 만나보세요</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">이름</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="name" name="name" type="text" placeholder="홍길동" className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">휴대폰 번호</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phone" name="phone" type="tel" placeholder="010-1234-5678"
                            className="pl-10" required
                            value={signupPhone}
                            onChange={(e) => { setSignupPhone(e.target.value); setPhoneVerified(false); setPhoneOtpSent(false) }}
                            disabled={phoneVerified}
                          />
                        </div>
                        {!phoneVerified && (
                          <Button type="button" variant="outline" onClick={handleSendPhoneOtp} disabled={phoneVerifying || !signupPhone} className="shrink-0 text-xs">
                            {phoneVerifying && !phoneOtpSent ? "발송 중..." : phoneOtpSent ? "재발송" : "인증번호 받기"}
                          </Button>
                        )}
                        {phoneVerified && <span className="flex items-center text-green-600 text-sm shrink-0 gap-1"><Check className="h-4 w-4" />인증완료</span>}
                      </div>
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
                    <Label htmlFor="signup-email">이메일</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="signup-email" name="email" type="email" placeholder="example@email.com" className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">비밀번호</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password" name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="8자 이상 입력하세요"
                        className="pl-10 pr-10" minLength={8} required
                      />
                      <Button type="button" variant="ghost" size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 flex flex-col gap-3">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "가입 중..." : "회원가입"}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    가입 시{" "}
                    <button type="button" onClick={() => setPolicyModal("terms")} className="underline hover:text-foreground">이용약관</button>과{" "}
                    <button type="button" onClick={() => setPolicyModal("privacy")} className="underline hover:text-foreground">개인정보처리방침</button>에 동의하는 것으로 간주됩니다.
                  </p>
                  <p className="text-sm text-center text-muted-foreground">
                    이미 계정이 있으신가요?{" "}
                    <button type="button" onClick={() => setMode("login")} className="text-primary font-medium hover:underline">
                      로그인
                    </button>
                  </p>
                </CardFooter>
              </form>
            )}
          </div>
        </Card>
      </main>

      {/* 이용약관 / 개인정보처리방침 모달 */}
      <Dialog open={!!policyModal} onOpenChange={(open) => !open && setPolicyModal(null)}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle>
              {policyModal === "terms" ? "이용약관" : "개인정보처리방침"}
            </DialogTitle>
          </DialogHeader>
          <iframe
            src={policyModal === "terms" ? "/terms" : "/privacy"}
            className="flex-1 w-full border-0"
            title={policyModal === "terms" ? "이용약관" : "개인정보처리방침"}
          />
        </DialogContent>
      </Dialog>

      {/* 비밀번호 찾기 모달 */}
      <Dialog open={showResetDialog} onOpenChange={(open) => { setShowResetDialog(open); if (!open) setResetEmail("") }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>비밀번호 찾기</DialogTitle>
            <DialogDescription>가입한 이메일 주소를 입력하면 임시 비밀번호를 발송해드립니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="reset-email">이메일</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="reset-email"
                type="email"
                placeholder="example@email.com"
                className="pl-10"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleResetPassword() } }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)} disabled={resetLoading}>취소</Button>
            <Button onClick={handleResetPassword} disabled={resetLoading || !resetEmail}>
              {resetLoading ? "발송 중..." : "임시 비밀번호 발급"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 계정 찾기 모달 */}
      <Dialog open={showFindDialog} onOpenChange={(open) => { setShowFindDialog(open); if (!open) { setFindPhone(""); setFindPhoneOtp(""); setFindPhoneOtpSent(false); setFindPhoneVerified(false); setFindResult(null) } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>계정 찾기</DialogTitle>
            <DialogDescription>가입 시 등록한 휴대폰 번호로 계정을 찾을 수 있습니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {!findResult ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="find-phone">휴대폰 번호</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="find-phone"
                        type="tel"
                        placeholder="010-1234-5678"
                        className="pl-10"
                        value={findPhone}
                        onChange={(e) => { setFindPhone(e.target.value); setFindPhoneVerified(false); setFindPhoneOtpSent(false); setFindPhoneOtp("") }}
                        disabled={findPhoneVerified}
                      />
                    </div>
                    {!findPhoneVerified && (
                      <Button type="button" variant="outline" onClick={handleSendFindPhoneOtp} disabled={findPhoneVerifying || !findPhone} className="shrink-0 text-xs">
                        {findPhoneVerifying && !findPhoneOtpSent ? "발송 중..." : findPhoneOtpSent ? "재발송" : "인증번호 받기"}
                      </Button>
                    )}
                    {findPhoneVerified && (
                      <span className="flex items-center text-green-600 text-sm shrink-0 gap-1">
                        <Check className="h-4 w-4" />인증완료
                      </span>
                    )}
                  </div>
                </div>
                {findPhoneOtpSent && !findPhoneVerified && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="인증번호 6자리"
                      value={findPhoneOtp}
                      onChange={(e) => setFindPhoneOtp(e.target.value)}
                      maxLength={6}
                      className="flex-1"
                    />
                    <Button type="button" onClick={handleVerifyFindPhoneOtp} disabled={findPhoneVerifying || findPhoneOtp.length < 6} className="shrink-0 text-xs bg-primary text-primary-foreground">
                      {findPhoneVerifying ? "확인 중..." : "확인"}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3 text-center py-2">
                <p className="text-sm text-muted-foreground">가입된 계정 정보를 확인했습니다.</p>
                <div className="rounded-lg bg-muted px-4 py-3 space-y-1">
                  <p className="text-sm font-medium">{findResult.maskedEmail}</p>
                  <p className="text-xs text-muted-foreground">
                    가입 방법: {providerLabels[findResult.provider] ?? findResult.provider}
                  </p>
                </div>
                <Button className="w-full" onClick={() => { setShowFindDialog(false); setMode("login") }}>
                  로그인하러 가기
                </Button>
              </div>
            )}
          </div>
          {!findResult && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFindDialog(false)}>닫기</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><span className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <LoginContent />
    </Suspense>
  )
}
