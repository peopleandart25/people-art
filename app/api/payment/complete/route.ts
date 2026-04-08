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

  // 2. DB에서 현재 포인트 조회 및 선검증
  const { data: currentProfile } = await serviceClient
    .from("profiles")
    .select("points")
    .eq("id", user.id)
    .single()

  const currentPoints = currentProfile?.points ?? 0

  if (pointsUsed > currentPoints) {
    return NextResponse.json({ error: "보유 포인트가 부족합니다." }, { status: 400 })
  }

  // 3. 포트원 결제 검증 (0원 결제는 PG 호출 없이 포인트만으로 처리)
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

  // 5. payments 테이블에 기록
  const { error: paymentError } = await serviceClient.from("payments").insert({
    user_id: user.id,
    membership_id: membership.id,
    amount: MEMBERSHIP_PRICE,
    points_used: pointsUsed,
    status: "completed",
    pg_provider: pgProvider,
    pg_transaction_id: paymentId,
    payment_method: "kakao_pay",
  })
  if (paymentError) {
    return NextResponse.json({ error: "결제 내역 저장 실패" }, { status: 500 })
  }

  // 6. profiles 테이블 points 업데이트 (포인트 차감 + 가입 보너스 지급, role은 변경하지 않음)
  const newPoints = Math.max(0, currentPoints - pointsUsed) + SIGNUP_BONUS

  const { error: profileError } = await serviceClient
    .from("profiles")
    .update({ points: newPoints })
    .eq("id", user.id)

  if (profileError) {
    return NextResponse.json({ error: "프로필 업데이트 실패", details: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, expiresAt: expiresAt.toISOString(), newPoints })
}
