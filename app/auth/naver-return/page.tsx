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

    async function init() {
      // @supabase/ssr의 createBrowserClient는 PKCE 모드 기본값이라
      // hash fragment(#access_token=...)를 자동 처리하지 않음
      // → URL hash에서 직접 토큰을 파싱해 setSession으로 세션 복원
      const hash = window.location.hash.substring(1)
      const params = new URLSearchParams(hash)
      const accessToken = params.get("access_token")
      const refreshToken = params.get("refresh_token")

      if (accessToken && refreshToken) {
        const { data: { session }, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (!error) {
          await handleSession(session)
          return
        }
      }

      // hash token이 없거나 setSession 실패 시 기존 세션 확인
      const { data: { session } } = await supabase.auth.getSession()
      await handleSession(session)
    }

    init()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
