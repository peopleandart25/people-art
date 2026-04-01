import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET!
const MEMBERSHIP_PRICE = 44000
const BILLING_CHANNEL_KEY = "channel-key-6cb34a6a-ff25-4297-a3ad-036bdadfd2aa"

export async function POST(request: Request) {
  const { billingKey, pointsUsed = 0 } = await request.json()

  const finalAmount = MEMBERSHIP_PRICE - Math.min(pointsUsed, MEMBERSHIP_PRICE)

  // 포인트 전액 결제가 아닌 경우 빌링키 필수
  if (!billingKey && finalAmount > 0) {
    return NextResponse.json({ error: "billingKey가 필요합니다." }, { status: 400 })
  }

  // 1. 로그인 유저 확인
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const serviceClient = createServiceClient()

  // 2. DB 포인트 선검증
  const { data: currentProfile } = await serviceClient
    .from("profiles")
    .select("points")
    .eq("id", user.id)
    .single()

  const currentPoints = currentProfile?.points ?? 0
  if (pointsUsed > currentPoints) {
    return NextResponse.json({ error: "보유 포인트가 부족합니다." }, { status: 400 })
  }

  // 3. 빌링키가 있는 경우 PortOne 검증
  if (billingKey) {
    const billingKeyRes = await fetch(`https://api.portone.io/billing-keys/${billingKey}`, {
      headers: { Authorization: `PortOne ${PORTONE_API_SECRET}` },
    })
    if (!billingKeyRes.ok) {
      return NextResponse.json({ error: "빌링키 검증 실패" }, { status: 400 })
    }
  }

  // 4. 첫 결제 실행 (빌링키 있고 잔여 금액 > 0인 경우만)
  const paymentId = `billing-${user.id}-${Date.now()}`

  if (finalAmount > 0 && billingKey) {
    const payRes = await fetch(`https://api.portone.io/payments/${paymentId}/billing-key`, {
      method: "POST",
      headers: {
        Authorization: `PortOne ${PORTONE_API_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        billingKey,
        orderName: "피플앤아트 멤버십 1개월",
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

  // 5. memberships upsert (billing_key 저장)
  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setDate(expiresAt.getDate() + 30)

  const { data: membership, error: membershipError } = await serviceClient
    .from("memberships")
    .upsert(
      {
        user_id: user.id,
        status: "active",
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        auto_renew: !!billingKey,  // 빌링키 없는 포인트 전액 결제는 자동갱신 미설정
        billing_key: billingKey ?? null,
      },
      { onConflict: "user_id" }
    )
    .select("id")
    .single()

  if (membershipError || !membership) {
    return NextResponse.json({ error: "멤버십 저장 실패" }, { status: 500 })
  }

  // 6. payments 기록
  const { error: paymentError } = await serviceClient.from("payments").insert({
    user_id: user.id,
    membership_id: membership.id,
    amount: MEMBERSHIP_PRICE,
    points_used: pointsUsed,
    status: "completed",
    pg_provider: "kakaopay",
    pg_transaction_id: paymentId,
    payment_method: "kakao_pay",
  })
  if (paymentError) {
    return NextResponse.json({ error: "결제 내역 저장 실패" }, { status: 500 })
  }

  // 7. profiles 업데이트 (포인트 차감 + 15,000P 가입 보너스 - 현금 결제 시만 지급)
  const signupBonus = finalAmount > 0 ? 15000 : 0
  const newPoints = Math.max(0, currentPoints - pointsUsed) + signupBonus
  const { error: profileError } = await serviceClient
    .from("profiles")
    .update({ role: "premium", points: newPoints })
    .eq("id", user.id)

  if (profileError) {
    return NextResponse.json({ error: "프로필 업데이트 실패", details: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, expiresAt: expiresAt.toISOString(), newPoints })
}

// 자동갱신 해지
export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const serviceClient = createServiceClient()
  const { error } = await serviceClient
    .from("memberships")
    .update({ auto_renew: false })
    .eq("user_id", user.id)
    .eq("status", "active")

  if (error) {
    return NextResponse.json({ error: "자동갱신 해지 실패" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// 자동갱신 재활성화
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const serviceClient = createServiceClient()

  // 빌링키 확인
  const { data: membership } = await serviceClient
    .from("memberships")
    .select("billing_key")
    .eq("user_id", user.id)
    .single()

  if (!membership?.billing_key) {
    return NextResponse.json({ error: "등록된 결제수단이 없습니다." }, { status: 400 })
  }

  const { error } = await serviceClient
    .from("memberships")
    .update({ auto_renew: true })
    .eq("user_id", user.id)

  if (error) {
    return NextResponse.json({ error: "자동갱신 재활성화 실패" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
