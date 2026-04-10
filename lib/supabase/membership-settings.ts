import { createServiceClient } from "@/lib/supabase/server"

export type MembershipSettings = {
  membershipPrice: number
  signupBonus: number
  renewalBonus: number
}

/**
 * app_settings 테이블에서 멤버십 관련 설정값을 조회합니다.
 * 값이 없는 경우 예외를 throw하지 않고 0을 반환합니다.
 */
export async function getMembershipSettings(): Promise<MembershipSettings> {
  const serviceClient = createServiceClient()
  const { data } = await serviceClient
    .from("app_settings")
    .select("key, value")
    .in("key", ["membership_price", "membership_signup_bonus", "membership_renewal_bonus"])

  const map = Object.fromEntries((data ?? []).map((s) => [s.key, s.value]))

  return {
    membershipPrice: parseInt(map["membership_price"] ?? "0", 10) || 0,
    signupBonus: parseInt(map["membership_signup_bonus"] ?? "0", 10) || 0,
    renewalBonus: parseInt(map["membership_renewal_bonus"] ?? "0", 10) || 0,
  }
}
