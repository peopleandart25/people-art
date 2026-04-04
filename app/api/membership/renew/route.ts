import { createClient, createServiceClient } from "@/lib/supabase/server"
import { getMembershipSettings } from "@/lib/supabase/membership-settings"
import { NextResponse } from "next/server"

const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET!

export async function POST(request: Request) {
  const { pointsUsed = 0 } = await request.json()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const serviceClient = createServiceClient()

  const { membershipPrice: MEMBERSHIP_PRICE, renewalBonus: RENEWAL_BONUS } = await getMembershipSettings()

  // 1. 현재 멤버십 및 포인트 조회
  const [{ data: profile }, { data: membership }] = await Promise.all([
    serviceClient.from("profiles").select("points").eq("id", user.id).single(),
    serviceClient
      .from("memberships")
      .select("id, expires_at, billing_key")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single(),
  ])

  if (!membership) {
    return NextResponse.json({ error: "활성 멤버십이 없습니다." }, { status: 400 })
  }

  const currentPoints = profile?.points ?? 0
  const clampedPoints = Math.min(pointsUsed, currentPoints, MEMBERSHIP_PRICE)
  const finalAmount = MEMBERSHIP_PRICE - clampedPoints

  if (clampedPoints > currentPoints) {
    return NextResponse.json({ error: "보유 포인트가 부족합니다." }, { status: 400 })
  }

  // 2. 잔여 금액이 있으면 빌링키로 결제 (없으면 포인트 전액 처리)
  if (finalAmount > 0) {
    if (!membership.billing_key) {
      return NextResponse.json({ error: "등록된 결제수단이 없습니다. 자동갱신을 설정해 주세요." }, { status: 400 })
    }

    const paymentId = `renew-${user.id}-${Date.now()}`
    const payRes = await fetch(`https://api.portone.io/payments/${paymentId}/billing-key`, {
      method: "POST",
      headers: {
        Authorization: `PortOne ${PORTONE_API_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        billingKey: membership.billing_key,
        orderName: "피플앤아트 멤버십 1개월 갱신",
        amount: { total: finalAmount },
        currency: "KRW",
        customer: { id: user.id, email: user.email },
      }),
    })

    if (!payRes.ok) {
      const err = await payRes.json()
      return NextResponse.json({ error: "결제 실패", details: err.message }, { status: 400 })
    }

    const payment = await payRes.json()
    if (payment.status !== "PAID") {
      return NextResponse.json({ error: "결제가 완료되지 않았습니다." }, { status: 400 })
    }
  }

  // 3. 만료일 연장: 현재 만료일 기준 +30일 (잔여 기간 보존)
  const currentExpiry = new Date(membership.expires_at)
  const now = new Date()
  const baseDate = currentExpiry > now ? currentExpiry : now
  const newExpiry = new Date(baseDate)
  newExpiry.setDate(newExpiry.getDate() + 30)

  await serviceClient
    .from("memberships")
    .update({ expires_at: newExpiry.toISOString(), started_at: now.toISOString() })
    .eq("id", membership.id)

  // 4. payments 기록
  await serviceClient.from("payments").insert({
    user_id: user.id,
    membership_id: membership.id,
    amount: MEMBERSHIP_PRICE,
    points_used: clampedPoints,
    status: "completed",
    pg_provider: finalAmount > 0 ? "kakaopay" : "points",
    pg_transaction_id: `renew-${user.id}-${Date.now()}`,
    payment_method: finalAmount > 0 ? "kakao_pay" : "points",
  })

  // 5. 포인트 차감 + 갱신 보너스 (현금 결제 시만 지급)
  const renewalBonus = finalAmount > 0 ? RENEWAL_BONUS : 0
  const newPoints = Math.max(0, currentPoints - clampedPoints) + renewalBonus
  await serviceClient.from("profiles").update({ points: newPoints }).eq("id", user.id)

  return NextResponse.json({
    success: true,
    expiresAt: newExpiry.toISOString(),
    newPoints,
  })
}
