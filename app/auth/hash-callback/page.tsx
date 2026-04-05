"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

function HashCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirectTo") ?? "/"

  useEffect(() => {
    const hash = window.location.hash
    const params = new URLSearchParams(hash.substring(1))
    const accessToken = params.get("access_token")
    const refreshToken = params.get("refresh_token")

    if (!accessToken || !refreshToken) {
      router.replace("/login?error=auth_failed")
      return
    }

    const supabase = createClient()
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(async ({ data, error }) => {
        if (error || !data.user) {
          router.replace("/login?error=auth_failed")
          return
        }

        // 온보딩 여부 확인
        const { data: artistProfile } = await supabase
          .from("artist_profiles")
          .select("id")
          .eq("user_id", data.user.id)
          .maybeSingle()

        if (!artistProfile) {
          window.location.href = "/onboarding"
        } else {
          window.location.href = redirectTo
        }
      })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">로그인 처리 중...</p>
      </div>
    </div>
  )
}

export default function HashCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <HashCallbackContent />
    </Suspense>
  )
}
