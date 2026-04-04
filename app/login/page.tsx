"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User, Phone, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const supabase = createClient()

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<"kakao" | "google" | "naver" | null>(null)
  const [phoneOtpSent, setPhoneOtpSent] = useState(false)
  const [phoneOtp, setPhoneOtp] = useState("")
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [phoneVerifying, setPhoneVerifying] = useState(false)
  const [signupPhone, setSignupPhone] = useState("")

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
    }
  }, [error])

  // 이미 로그인된 경우 리다이렉트
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push(redirectTo)
    })
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
      toast({ title: "로그인 실패", description: "이메일 또는 비밀번호를 확인해주세요.", variant: "destructive" })
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
      // 이미 가입된 이메일 — Supabase는 이메일 확인 활성화 시 에러 대신 빈 identities 반환
      toast({ title: "이미 가입된 이메일", description: "해당 이메일로 이미 가입된 계정이 있습니다. 로그인을 시도해주세요.", variant: "destructive" })
    } else {
      toast({ title: "가입 완료!", description: "이메일을 확인하여 인증을 완료해주세요." })
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
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">로그인</TabsTrigger>
              <TabsTrigger value="signup">회원가입</TabsTrigger>
            </TabsList>

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

            {/* 로그인 탭 */}
            <TabsContent value="login">
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
                <CardFooter className="pt-4">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "로그인 중..." : "로그인"}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            {/* 회원가입 탭 */}
            <TabsContent value="signup">
              <form onSubmit={handleEmailSignup}>
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
                    가입 시 <a href="#" className="underline">이용약관</a>과 <a href="#" className="underline">개인정보처리방침</a>에 동의하는 것으로 간주됩니다.
                  </p>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </main>
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
