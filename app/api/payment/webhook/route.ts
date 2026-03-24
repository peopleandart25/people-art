import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET!
const MEMBERSHIP_PRICE = 44000

export async function POST(request: Request) {
  const body = await request.json()
  const { type, data } = body

  // Transaction.Paid 이벤트만 처리
  if (type !== "Transaction.Paid") {
    return NextResponse.json({ ok: true })
  }

  const { paymentId } = data ?? {}
  if (!paymentId) {
    return NextResponse.json({ error: "paymentId 없음" }, { status: 400 })
  }

  // paymentId 형식: payment-{userId}-{timestamp}
  const match = (paymentId as string).match(/^payment-([a-f0-9-]+)-\d+$/)
  if (!match) {
    return NextResponse.json({ error: "잘못된 paymentId 형식" }, { status: 400 })
  }
  const userId = match[1]

  // PortOne API로 결제 검증
  const portoneRes = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `PortOne ${PORTONE_API_SECRET}` },
  })
  if (!portoneRes.ok) {
    return NextResponse.json({ error: "결제 정보 조회 실패" }, { status: 400 })
  }
  const payment = await portoneRes.json()

  if (payment.status !== "PAID") {
    return NextResponse.json({ ok: true })
  }

  const serviceClient = await createServiceClient()

  // 이미 처리된 결제인지 확인 (중복 방지)
  const { data: existing } = await serviceClient
    .from("payments")
    .select("id")
    .eq("pg_transaction_id", paymentId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ ok: true })
  }

  // 실제 결제 금액으로 포인트 사용량 계산
  const actualAmount = payment.amount?.total ?? MEMBERSHIP_PRICE
  const pointsUsed = Math.max(0, MEMBERSHIP_PRICE - actualAmount)

  // memberships 테이블 upsert
  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setDate(expiresAt.getDate() + 30)

  const { data: membership, error: membershipError } = await serviceClient
    .from("memberships")
    .upsert(
      {
        user_id: userId,
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

  // payments 테이블에 기록
  const { error: paymentError } = await serviceClient.from("payments").insert({
    user_id: userId,
    membership_id: membership.id,
    amount: MEMBERSHIP_PRICE,
    points_used: pointsUsed,
    status: "paid",
    pg_provider: payment.channel?.pgProvider ?? "kakaopay",
    pg_transaction_id: paymentId,
    payment_method: "EASY_PAY",
  })

  if (paymentError) {
    return NextResponse.json({ error: "결제 내역 저장 실패" }, { status: 500 })
  }

  // profiles role → premium
  await serviceClient
    .from("profiles")
    .update({ role: "premium" })
    .eq("id", userId)

  return NextResponse.json({ ok: true })
}
