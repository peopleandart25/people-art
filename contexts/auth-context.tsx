"use client"

import { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

type Profile = Database["public"]["Tables"]["profiles"]["Row"] & {
  points?: number | null
  membership_expires_at?: string | null
  membership_auto_renew?: boolean
  membership_is_active?: boolean
  has_artist_profile?: boolean
  job_title?: string | null
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  isLoggedIn: boolean
  isAdmin: boolean
  isPremium: boolean
  isCdApproved: boolean
  signInWithKakao: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refetchProfile: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  // 동일 사용자에 대한 중복 fetchProfile 방지 (TOKEN_REFRESHED 등 이벤트에서 재호출 X)
  const fetchedUserIdRef = useRef<string | null>(null)
  const inflightRef = useRef<Promise<void> | null>(null)

  const fetchProfile = useCallback(async () => {
    if (inflightRef.current) return inflightRef.current
    const p = (async () => {
      try {
        const res = await fetch("/api/profile")
        const data = await res.json()
        setProfile(data ? { ...data, points: data.points ?? 0 } : null)
      } catch {
        setProfile(null)
      } finally {
        setLoading(false)
        inflightRef.current = null
      }
    })()
    inflightRef.current = p
    return p
  }, [])

  useEffect(() => {
    // onAuthStateChange가 마운트 시 INITIAL_SESSION 이벤트를 발행하므로
    // 별도 getUser() 호출 불필요. 동일 user.id에 대한 재호출은 스킵.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const nextUserId = session?.user?.id ?? null
        setUser(session?.user ?? null)

        if (!nextUserId) {
          fetchedUserIdRef.current = null
          setProfile(null)
          setLoading(false)
          return
        }

        // 같은 사용자에 대해 이미 fetch 했다면 스킵 (TOKEN_REFRESHED 등)
        if (fetchedUserIdRef.current === nextUserId) return
        fetchedUserIdRef.current = nextUserId
        await fetchProfile()
      }
    )

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signInWithKakao = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }, [supabase])

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }, [supabase])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    // 미들웨어 우회 쿠키 정리 (사용자별 마킹)
    document.cookie = "pa_onboarded=; path=/; max-age=0"
    window.location.href = "/"
  }, [supabase])

  const refetchProfile = useCallback(() => {
    if (user) void fetchProfile()
  }, [user, fetchProfile])

  const value = useMemo<AuthContextType>(() => {
    const isLoggedIn = !!user
    const isAdmin = profile?.role === "admin"
    const isPremium = !!profile?.membership_is_active || profile?.role === "admin"
    const isCdApproved = profile?.role !== "casting_director" || profile?.cd_approval_status === "approved"
    return {
      user, profile, loading, isLoggedIn, isAdmin, isPremium, isCdApproved,
      signInWithKakao, signInWithGoogle, signOut, refetchProfile,
    }
  }, [user, profile, loading, signInWithKakao, signInWithGoogle, signOut, refetchProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
