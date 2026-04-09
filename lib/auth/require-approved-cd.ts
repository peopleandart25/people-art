import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

export type RequireDirectorResult =
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403; error: string }

/**
 * Checks the current authenticated user is an approved casting_director
 * or an admin/sub_admin. Returns a tagged result for routes to switch on.
 *
 * @param supabase  user-scoped client (for auth.getUser)
 * @param serviceClient  service-role client (bypasses RLS for profile read)
 */
export async function requireApprovedDirector(
  supabase: SupabaseClient<Database>,
  serviceClient: SupabaseClient<Database>
): Promise<RequireDirectorResult> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, status: 401, error: "로그인이 필요합니다." }

  const { data: profile } = await serviceClient
    .from("profiles")
    .select("role, cd_approval_status")
    .eq("id", user.id)
    .single()

  if (!profile) return { ok: false, status: 403, error: "프로필을 찾을 수 없습니다." }

  // Admins always allowed
  if (profile.role === "admin" || profile.role === "sub_admin") {
    return { ok: true, userId: user.id }
  }

  if (profile.role !== "casting_director") {
    return { ok: false, status: 403, error: "캐스팅 디렉터 권한이 필요합니다." }
  }
  if (profile.cd_approval_status !== "approved") {
    return { ok: false, status: 403, error: "관리자 승인 대기 중입니다." }
  }
  return { ok: true, userId: user.id }
}
