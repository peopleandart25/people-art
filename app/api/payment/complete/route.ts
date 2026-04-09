import { createClient, createServiceClient } from "@/lib/supabase/server"
import { getMembershipSettings } from "@/lib/supabase/membership-settings"
import { NextResponse } from "next/server"

const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET!

async function cancelPortOnePayment(paymentId: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.portone.io/payments/${paymentId}/cancel`, {
      method: "POST",
      headers: {
        Authorization: `PortOne ${PORTONE_API_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason: "DB 트랜잭션 실패로 인한 자동 취소" }),
      signal: AbortSignal.timeout(10_000),
    })
    return res.ok
  } catch {
    return false
  }
}

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

  // 2. 중복 결제 방지
  const pgTransactionId = expectedAmount === 0 ? `free-${user.id}-${Date.now()}` : paymentId
  if (expectedAmount !== 0) {
    const { data: existing } = await serviceClient
      .from("payments")
      .select("id")
      .eq("pg_transaction_id", pgTransactionId)
      .maybeSingle()
    if (existing) {
      return NextResponse.json({ error: "이미 처리된 결제입니다." }, { status: 409 })
    }
  }

  // 3. 포트원 결제 검증
  let pgProvider = "kakaopay"
  if (expectedAmount > 0) {
    let portoneRes: Response
    try {
      portoneRes = await fetch(`https://api.portone.io/payments/${paymentId}`, {
        headers: { Authorization: `PortOne ${PORTONE_API_SECRET}` },
        signal: AbortSignal.timeout(10_000),
      })
    } catch {
      return NextResponse.json({ error: "결제 서버 응답 지연" }, { status: 504 })
    }
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
  } else {
    pgProvider = "points"
  }

  // 4. DB 원자 처리 (memberships + payments + profiles)
  const { data: rpcResult, error: rpcError } = (await (serviceClient as unknown as {
    rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>
  }).rpc("process_kakao_payment_complete", {
    p_user_id: user.id,
    p_points_used: pointsUsed,
    p_expected_amount: expectedAmount,
    p_pg_transaction_id: pgTransactionId,
    p_pg_provider: pgProvider,
    p_membership_price: MEMBERSHIP_PRICE,
    p_signup_bonus: SIGNUP_BONUS,
  })) as { data: { success: boolean; new_points: number; expires_at: string } | null; error: { message: string } | null }

  if (rpcError || !rpcResult?.success) {
    const message = rpcError?.message ?? "DB 처리 실패"
    if (message.includes("insufficient_points")) {
      return NextResponse.json({ error: "보유 포인트가 부족합니다." }, { status: 400 })
    }
    if (message.includes("duplicate key") || message.includes("23505")) {
      return NextResponse.json({ error: "이미 처리된 결제입니다." }, { status: 409 })
    }
    // 결제는 됐는데 DB 실패 → 보상 취소 시도
    if (expectedAmount > 0) {
      const cancelled = await cancelPortOnePayment(paymentId)
      if (!cancelled) {
        console.error("[PAYMENT RECONCILE REQUIRED]", { paymentId, userId: user.id, error: message })
      }
    }
    return NextResponse.json({ error: "결제 처리 실패", details: message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    expiresAt: rpcResult.expires_at,
    newPoints: rpcResult.new_points,
  })
}
