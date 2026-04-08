import { createClient, createServiceClient } from "@/lib/supabase/server"
import { getMembershipSettings } from "@/lib/supabase/membership-settings"
import { NextResponse } from "next/server"

const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET!

export async function POST(request: Request) {
  const { paymentId, pointsUsed = 0 } = await request.json()

  if (!paymentId) {
    return NextResponse.json({ error: "paymentId가 필요합니다." }, { status: 400 })
  }

  // 1. 현재 로그인 유저 확인
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const { membershipPrice: MEMBERSHIP_PRICE, signupBonus: SIGNUP_BONUS } = await getMembershipSettings()
  const expectedAmount = MEMBERSHIP_PRICE - Math.min(pointsUsed, MEMBERSHIP_PRICE)

  const serviceClient = createServiceClient()

  // 2. 중복 결제 방지 (0원 결제는 paymentId가 서버 생성값이므로 별도 처리)
  const expectedPgId = expectedAmount === 0 ? null : paymentId
  if (expectedPgId) {
    const { data: existing } = await serviceClient
      .from("payments")
      .select("id")
      .eq("pg_transaction_id", expectedPgId)
      .maybeSingle()
    if (existing) {
      return NextResponse.json({ error: "이미 처리된 결제입니다." }, { status: 409 })
    }
  }

  // 3. DB에서 현재 포인트 조회 및 선검증
  const { data: currentProfile } = await serviceClient
    .from("profiles")
    .select("points")
    .eq("id", user.id)
    .single()

  const currentPoints = currentProfile?.points ?? 0

  if (pointsUsed > currentPoints) {
    return NextResponse.json({ error: "보유 포인트가 부족합니다." }, { status: 400 })
  }

  // 4. 포트원 결제 검증 (0원 결제는 PG 호출 없이 포인트만으로 처리)
  let pgProvider = "kakaopay"
  if (expectedAmount > 0) {
    const portoneRes = await fetch(`https://api.portone.io/payments/${paymentId}`, {
      headers: { Authorization: `PortOne ${PORTONE_API_SECRET}` },
    })
    if (!portoneRes.ok) {
      return NextResponse.json({ error: "결제 정보 조회 실패" }, { status: 400 })
    }
    const payment = await portoneRes.json()

    if (payment.status !== "PAID") {
      return NextResponse.json({ error: "결제가 완료되지 않았습니다." }, { status: 400 })
    }
    if (payment.amount.total !== expectedAmount) {
      return NextResponse.json({ error: "결제 금액이 일치하지 않습니다." }, { status: 400 })
    }
    pgProvider = payment.channel?.pgProvider ?? "kakaopay"
  }

  // 4. memberships 테이블 upsert (user당 1개)
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
        auto_renew: true,
      },
      { onConflict: "user_id" }
    )
    .select("id")
    .single()

  if (membershipError || !membership) {
    return NextResponse.json({ error: "멤버십 저장 실패" }, { status: 500 })
  }

  // 5. payments 테이블에 기록 (amount = 실 결제액, 0원 결제는 서버 생성 ID)
  const pgTransactionId = expectedAmount === 0 ? `free-${user.id}-${Date.now()}` : paymentId
  const { error: paymentError } = await serviceClient.from("payments").insert({
    user_id: user.id,
    membership_id: membership.id,
    amount: expectedAmount,
    points_used: pointsUsed,
    status: "completed",
    pg_provider: pgProvider,
    pg_transaction_id: pgTransactionId,
    payment_method: expectedAmount === 0 ? "points" : "kakao_pay",
  })
  if (paymentError) {
    if (paymentError.code === "23505") {
      return NextResponse.json({ error: "이미 처리된 결제입니다." }, { status: 409 })
    }
    return NextResponse.json({ error: "결제 내역 저장 실패" }, { status: 500 })
  }

  // 6. profiles 포인트 업데이트 (트리거가 membership_is_active 동기화 처리)
  const newPoints = Math.max(0, currentPoints - pointsUsed) + SIGNUP_BONUS

  const { error: profileError } = await serviceClient
    .from("profiles")
    .update({ points: newPoints } as never)
    .eq("id", user.id)

  if (profileError) {
    return NextResponse.json({ error: "프로필 업데이트 실패", details: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, expiresAt: expiresAt.toISOString(), newPoints })
}
