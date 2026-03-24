"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

type Profile = Database["public"]["Tables"]["profiles"]["Row"] & { points?: number | null }

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    // 현재 세션 확인
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) fetchProfile(user.id)
      else setLoading(false)
    })

    // 세션 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(_userId: string) {
    try {
      const res = await fetch("/api/profile")
      const data = await res.json()
      setProfile(data ? { ...data, points: 0 } : null)
    } catch {
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  async function signInWithKakao() {
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  const isLoggedIn = !!user
  const isAdmin = profile?.role === "admin"
  const isPremium = profile?.role === "premium" || profile?.role === "admin"

  return {
    user,
    profile,
    loading,
    isLoggedIn,
    isAdmin,
    isPremium,
    signInWithKakao,
    signInWithGoogle,
    signOut,
    refetchProfile: () => user && fetchProfile(user.id),
  }
}
