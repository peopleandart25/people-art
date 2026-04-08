"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Briefcase } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { ConsentCheckboxes } from "@/components/consent-checkboxes"

export default function DirectorOnboardingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    jobTitle: "",
  })
  const [privacyAgreed, setPrivacyAgreed] = useState(false)
  const [marketingAgreed, setMarketingAgreed] = useState(false)

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mountedRef.current) return
      if (!user) { router.push("/login"); return }
      setForm(prev => ({
        ...prev,
        email: user.email ?? "",
        name: (user.user_metadata?.full_name ?? user.user_metadata?.name) || "",
        phone: user.user_metadata?.phone || "",
      }))
    })
    return () => { mountedRef.current = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast({ title: "이름을 입력해주세요.", variant: "destructive" }); return
    }
    if (!form.phone.trim()) {
      toast({ title: "연락처를 입력해주세요.", variant: "destructive" }); return
    }
    if (!privacyAgreed) {
      toast({ title: "개인정보 수집 및 이용에 동의해주세요.", variant: "destructive" }); return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/onboarding/director", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          company: form.company,
          jobTitle: form.jobTitle,
          privacyAgreed,
          marketingAgreed,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "저장 실패")
      }
      toast({ title: "프로필이 등록되었습니다." })
      router.push("/casting-director")
      router.refresh()
    } catch (err) {
      toast({ title: "오류 발생", description: err instanceof Error ? err.message : "다시 시도해주세요.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Link href="/">
            <Image src="/images/logo-pa-002.png" alt="피플앤아트" width={120} height={40} className="h-10 w-auto object-contain" />
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-2 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-xl">캐스팅 디렉터 프로필</CardTitle>
                <CardDescription>기본 정보를 입력해주세요</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs text-gray-600">이름 <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={e => update("name", e.target.value)}
                    placeholder="홍길동"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600">이메일</Label>
                  <Input value={form.email} disabled className="bg-gray-50 text-gray-500" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs text-gray-600">연락처 <span className="text-red-500">*</span></Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={e => update("phone", e.target.value)}
                    placeholder="010-0000-0000"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="company" className="text-xs text-gray-600">소속 회사</Label>
                  <Input
                    id="company"
                    value={form.company}
                    onChange={e => update("company", e.target.value)}
                    placeholder="ABC 엔터테인먼트"
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="jobTitle" className="text-xs text-gray-600">직책</Label>
                  <Input
                    id="jobTitle"
                    value={form.jobTitle}
                    onChange={e => update("jobTitle", e.target.value)}
                    placeholder="캐스팅 디렉터"
                  />
                </div>
              </div>

              <ConsentCheckboxes
                privacyAgreed={privacyAgreed}
                marketingAgreed={marketingAgreed}
                onPrivacyChange={setPrivacyAgreed}
                onMarketingChange={setMarketingAgreed}
              />

              <Button
                type="submit"
                disabled={isLoading || !privacyAgreed}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white gap-2 mt-2"
              >
                <Save className="w-4 h-4" />
                {isLoading ? "저장 중..." : "프로필 등록하기"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
