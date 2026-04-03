"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function NaverReturnPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // Supabase SDK가 URL 해시(#access_token=...)를 자동으로 처리해 세션을 설정함
    // onAuthStateChange로 세션 확인 후 온보딩 여부 체크
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const { data: artistProfile } = await supabase
          .from("artist_profiles")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle()

        subscription.unsubscribe()

        if (!artistProfile) {
          router.replace("/onboarding")
        } else {
          router.replace("/")
        }
      } else if (event === "INITIAL_SESSION" && !session) {
        // 세션 없으면 로그인 페이지로
        subscription.unsubscribe()
        router.replace("/login?error=auth_failed")
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
