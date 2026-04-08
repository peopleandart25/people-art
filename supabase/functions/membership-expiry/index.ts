import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

Deno.serve(async (_req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const supabase = createClient(supabaseUrl, serviceKey)

  const now = new Date().toISOString()

  // 1. 만료된 active 멤버십 조회 (자동갱신 + 빌링키 있는 것은 renewal 함수가 처리)
  const { data: expiredActive, error: e1 } = await supabase
    .from("memberships")
    .select("id, user_id")
    .eq("status", "active")
    .eq("auto_renew", false)
    .lte("expires_at", now)

  // 2. 해지 예약 후 만료된 멤버십 조회
  const { data: expiredPending, error: e2 } = await supabase
    .from("memberships")
    .select("id, user_id")
    .eq("status", "pending_cancellation")
    .lte("expires_at", now)

  if (e1 || e2) {
    return new Response(
      JSON.stringify({ error: "조회 실패", e1, e2 }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }

  const expiredAll = [...(expiredActive ?? []), ...(expiredPending ?? [])]

  if (expiredAll.length === 0) {
    return new Response(
      JSON.stringify({ ok: true, processed: 0 }),
      { headers: { "Content-Type": "application/json" } }
    )
  }

  const membershipIds = expiredAll.map((m) => m.id)
  const userIds = expiredAll.map((m) => m.user_id)

  // 3. memberships 상태 → cancelled
  const { error: cancelError } = await supabase
    .from("memberships")
    .update({ status: "cancelled" })
    .in("id", membershipIds)

  if (cancelError) {
    console.error("[expiry] memberships cancel 실패:", cancelError.message)
    return new Response(
      JSON.stringify({ error: "멤버십 취소 실패", details: cancelError.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }

  // 4. profiles membership_is_active → false
  // 경합 방지: 이 시점에도 active 멤버십이 남아있는 유저는 제외 (신규 결제 등)
  // (트리거가 있으면 자동 처리되지만 명시적으로도 처리)
  const { data: stillActive } = await supabase
    .from("memberships")
    .select("user_id")
    .in("user_id", userIds)
    .eq("status", "active")

  const stillActiveSet = new Set((stillActive ?? []).map((m: { user_id: string }) => m.user_id))
  const userIdsToDeactivate = userIds.filter((id: string) => !stillActiveSet.has(id))

  if (userIdsToDeactivate.length > 0) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ membership_is_active: false })
      .in("id", userIdsToDeactivate)

    if (profileError) {
      console.error("[expiry] profiles update 실패:", profileError.message)
      return new Response(
        JSON.stringify({ error: "프로필 업데이트 실패", details: profileError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }
  }

  return new Response(
    JSON.stringify({ ok: true, processed: expiredAll.length, deactivated: userIdsToDeactivate.length }),
    { headers: { "Content-Type": "application/json" } }
  )
})
