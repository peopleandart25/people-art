"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Mic2, Briefcase } from "lucide-react"

export default function OnboardingSelectPage() {
  const router = useRouter()

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

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm text-center mb-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">어떤 역할로 참여하시나요?</h1>
          <p className="text-sm text-gray-500">역할에 맞는 맞춤 프로필을 만들어 드립니다</p>
        </div>

        <div className="w-full max-w-sm space-y-4">
          <button
            onClick={() => router.push("/onboarding")}
            className="w-full rounded-2xl border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50 p-6 text-left transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-orange-200 transition-colors">
                <Mic2 className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-base">아티스트</p>
                <p className="text-sm text-gray-500 mt-0.5">배우, 모델 등 캐스팅을 원하는 분</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push("/onboarding/director")}
            className="w-full rounded-2xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 p-6 text-left transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition-colors">
                <Briefcase className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-base">캐스팅 디렉터</p>
                <p className="text-sm text-gray-500 mt-0.5">배우를 찾고 캐스팅하는 업계 관계자</p>
              </div>
            </div>
          </button>
        </div>
      </main>
    </div>
  )
}
