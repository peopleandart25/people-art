"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function NaverReturnPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    async function handleSession(session: { user: { id: string } } | null) {
      if (!session?.user) {
        router.replace("/login?error=auth_failed")
        return
      }
      const { data: artistProfile } = await supabase
        .from("artist_profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle()

      router.replace(artistProfile ? "/" : "/onboarding")
    }

    // SDK가 URL 해시(#access_token=...)를 처리한 후 세션을 가져옴
    // INITIAL_SESSION보다 SIGNED_IN이 늦게 올 수 있으므로 두 이벤트 모두 처리
    let handled = false
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (handled) return
      if (event === "SIGNED_IN" || (event === "INITIAL_SESSION" && session)) {
        handled = true
        subscription.unsubscribe()
        handleSession(session)
      }
    })

    // 5초 타임아웃: 이벤트가 안 오면 getSession으로 직접 확인
    const timeout = setTimeout(async () => {
      if (handled) return
      handled = true
      subscription.unsubscribe()
      const { data: { session } } = await supabase.auth.getSession()
      handleSession(session)
    }, 5000)

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
