import type { User } from "@supabase/supabase-js"
import { createClient, createServiceClient } from "@/lib/supabase/server"

/**
 * 공용 admin 가드. 반환값이 null이면 403으로 응답.
 * 기존 9개 admin route에 인라인 선언돼있던 같은 함수를 단일화.
 */
export async function requireAdmin(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>()

  if (!profile || !["admin", "sub_admin"].includes(profile.role)) return null
  return user
}
