import { createClient, createServiceClient } from "@/lib/supabase/server"
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

  // 2. 포트원 결제 검증
  const portoneRes = await fetch(`https://api.portone.io/payments/${paymentId}`, {
    headers: { Authorization: `PortOne ${PORTONE_API_SECRET}` },
  })
  if (!portoneRes.ok) {
    return NextResponse.json({ error: "결제 정보 조회 실패" }, { status: 400 })
  }
  const payment = await portoneRes.json()

  // 3. 결제 상태 및 금액 검증
  const MEMBERSHIP_PRICE = 44000
  const expectedAmount = MEMBERSHIP_PRICE - Math.min(pointsUsed, MEMBERSHIP_PRICE)
  if (payment.status !== "PAID") {
    return NextResponse.json({ error: "결제가 완료되지 않았습니다." }, { status: 400 })
  }
  if (payment.amount.total !== expectedAmount) {
    return NextResponse.json({ error: "결제 금액이 일치하지 않습니다." }, { status: 400 })
  }

  const serviceClient = await createServiceClient()

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
    pg_provider: payment.channel?.pgProvider ?? "kakaopay",
    pg_transaction_id: paymentId,
    payment_method: "kakao_pay",
  })
  if (paymentError) {
    return NextResponse.json({ error: "결제 내역 저장 실패" }, { status: 500 })
  }

  // 6. profiles 테이블 role → premium, points 업데이트 (포인트 차감 + 15,000P 지급)
  const { data: currentProfile } = await serviceClient
    .from("profiles")
    .select("points")
    .eq("id", user.id)
    .single()

  const currentPoints = currentProfile?.points ?? 0
  const newPoints = Math.max(0, currentPoints - pointsUsed) + 15000

  await serviceClient
    .from("profiles")
    .update({ role: "premium", points: newPoints })
    .eq("id", user.id)

  return NextResponse.json({ success: true, expiresAt: expiresAt.toISOString() })
}
