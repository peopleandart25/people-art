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
  await supabase
    .from("memberships")
    .update({ status: "cancelled" })
    .in("id", membershipIds)

  // 4. profiles role → basic
  await supabase
    .from("profiles")
    .update({ role: "basic" })
    .in("id", userIds)

  return new Response(
    JSON.stringify({ ok: true, processed: expiredAll.length, userIds }),
    { headers: { "Content-Type": "application/json" } }
  )
})
