import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const PORTONE_API_SECRET = Deno.env.get("PORTONE_API_SECRET")!

Deno.serve(async (_req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const supabase = createClient(supabaseUrl, serviceKey)

  // app_settings에서 멤버십 설정 조회
  const { data: settingsRows } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["membership_price", "membership_renewal_bonus"])
  const settingsMap = Object.fromEntries((settingsRows ?? []).map((s: { key: string; value: string }) => [s.key, s.value]))
  const MEMBERSHIP_PRICE = parseInt(settingsMap["membership_price"] ?? "0", 10)
  const RENEWAL_BONUS = parseInt(settingsMap["membership_renewal_bonus"] ?? "0", 10)

  const now = new Date()
  // 24시간 이내 만료되는 자동갱신 멤버십 조회
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()

  const { data: renewals, error } = await supabase
    .from("memberships")
    .select("id, user_id, billing_key, expires_at")
    .eq("status", "active")
    .eq("auto_renew", true)
    .not("billing_key", "is", null)
    .lte("expires_at", in24h)

  if (error) {
    return new Response(
      JSON.stringify({ error: "조회 실패", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }

  if (!renewals || renewals.length === 0) {
    return new Response(
      JSON.stringify({ ok: true, processed: 0 }),
      { headers: { "Content-Type": "application/json" } }
    )
  }

  const results: { userId: string; success: boolean; error?: string }[] = []

  for (const membership of renewals) {
    const { user_id, billing_key } = membership

    try {
      // 1. PortOne 빌링키 결제 실행
      const paymentId = `billing-${user_id}-${Date.now()}`
      const payRes = await fetch(
        `https://api.portone.io/payments/${paymentId}/billing-key`,
        {
          method: "POST",
          headers: {
            Authorization: `PortOne ${PORTONE_API_SECRET}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            billingKey: billing_key,
            orderName: "피플앤아트 멤버십 1개월 자동갱신",
            amount: { total: MEMBERSHIP_PRICE },
            currency: "KRW",
            customer: { id: user_id },
          }),
        }
      )

      const handleFailure = async (reason: string) => {
        results.push({ userId: user_id, success: false, error: reason })
        const [r1, r2] = await Promise.all([
          supabase.from("memberships").update({ status: "cancelled", auto_renew: false }).eq("id", membership.id),
          supabase.from("profiles").update({ membership_is_active: false }).eq("id", user_id),
        ])
        if (r1.error) console.error("[renewal] memberships cancel 실패:", r1.error.message)
        if (r2.error) console.error("[renewal] profiles deactivate 실패:", r2.error.message)
      }

      if (!payRes.ok) {
        const err = await payRes.json()
        await handleFailure(err.message ?? "결제 API 오류")
        continue
      }

      const payment = await payRes.json()
      if (payment.status !== "PAID") {
        await handleFailure("결제 미완료")
        continue
      }

      // 2. memberships 만료일: 현재 만료일 기준 +30일 (잔여 기간 보존)
      const currentExpiry = new Date(membership.expires_at)
      const baseDate = currentExpiry > now ? currentExpiry : now
      const newExpiry = new Date(baseDate)
      newExpiry.setDate(newExpiry.getDate() + 30)

      const { error: membershipUpdateError } = await supabase
        .from("memberships")
        .update({
          started_at: now.toISOString(),
          expires_at: newExpiry.toISOString(),
          status: "active",
        })
        .eq("id", membership.id)

      if (membershipUpdateError) {
        console.error("[renewal] memberships update 실패 — 결제 성공했으나 DB 실패:", membershipUpdateError.message, { userId: user_id, paymentId })
        results.push({ userId: user_id, success: false, error: "DB 업데이트 실패 (결제는 처리됨 — 수동 확인 필요)" })
        continue
      }

      // 3. payments 기록 (dead select 제거 — membership.id 재사용)
      const { error: paymentInsertError } = await supabase.from("payments").insert({
        user_id,
        membership_id: membership.id,
        amount: MEMBERSHIP_PRICE,
        points_used: 0,
        status: "completed",
        pg_provider: payment.channel?.pgProvider ?? "unknown",
        pg_transaction_id: paymentId,
        payment_method: "card",
      })

      if (paymentInsertError) {
        console.error("[renewal] payments insert 실패:", paymentInsertError.message, { userId: user_id, paymentId })
        // payments 기록 실패는 멤버십 갱신은 됐으므로 경고만
      }

      // 4. profiles 포인트 갱신 보너스 지급 (트리거가 membership_is_active 처리)
      const { data: profile, error: profileFetchError } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", user_id)
        .single()

      if (profileFetchError) {
        console.error("[renewal] profile 조회 실패:", profileFetchError.message)
        results.push({ userId: user_id, success: true })
        continue
      }

      const currentPoints = profile?.points ?? 0
      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({ points: currentPoints + RENEWAL_BONUS })
        .eq("id", user_id)

      if (profileUpdateError) {
        console.error("[renewal] profiles points update 실패:", profileUpdateError.message)
      }

      results.push({ userId: user_id, success: true })
    } catch (e) {
      console.error("[renewal] 예외 발생:", String(e), { userId: user_id })
      results.push({ userId: user_id, success: false, error: String(e) })
    }
  }

  return new Response(
    JSON.stringify({ ok: true, processed: renewals.length, results }),
    { headers: { "Content-Type": "application/json" } }
  )
})
