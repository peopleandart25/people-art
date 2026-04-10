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
      body: JSON.stringify({ reason: "갱신 DB 트랜잭션 실패로 인한 자동 취소" }),
      signal: AbortSignal.timeout(10_000),
    })
    return res.ok
  } catch {
    return false
  }
}

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

  // 2. 결제 실행 — paymentId를 이후 payments 기록에도 동일하게 사용
  const paymentId = finalAmount > 0
    ? `renew-${user.id}-${Date.now()}`
    : `renew-points-${user.id}-${Date.now()}`
  let pgProvider = "points"
  let portoneCharged = false

  if (finalAmount > 0) {
    if (!membership.billing_key) {
      return NextResponse.json({ error: "등록된 결제수단이 없습니다. 자동갱신을 설정해 주세요." }, { status: 400 })
    }

    let payRes: Response
    try {
      payRes = await fetch(`https://api.portone.io/payments/${paymentId}/billing-key`, {
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
        signal: AbortSignal.timeout(15_000),
      })
    } catch {
      return NextResponse.json({ error: "결제 서버 응답 지연" }, { status: 504 })
    }

    if (!payRes.ok) {
      const err = await payRes.json().catch(() => ({}))
      return NextResponse.json({ error: "결제 실패", details: err?.message }, { status: 400 })
    }

    const payRaw = await payRes.json()
    // PortOne V2 billing-key 결제: { payment: { status, paidAt, ... } } 래핑
    const paymentInfo = payRaw.payment ?? payRaw
    if (!paymentInfo?.paidAt && paymentInfo?.status !== "PAID") {
      return NextResponse.json({ error: "결제가 완료되지 않았습니다." }, { status: 400 })
    }

    pgProvider = paymentInfo.channel?.pgProvider ?? "unknown"
    portoneCharged = true
  }

  // 3. DB 원자 처리 (memberships + payments + profiles)
  const { data: rpcResult, error: rpcError } = (await (serviceClient as unknown as {
    rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>
  }).rpc("process_membership_renewal", {
    p_user_id: user.id,
    p_membership_id: membership.id,
    p_points_used: clampedPoints,
    p_final_amount: finalAmount,
    p_membership_price: MEMBERSHIP_PRICE,
    p_renewal_bonus: RENEWAL_BONUS,
    p_pg_transaction_id: paymentId,
    p_pg_provider: pgProvider,
  })) as { data: { success: boolean; new_points: number; expires_at: string } | null; error: { message: string } | null }

  if (rpcError || !rpcResult?.success) {
    const message = rpcError?.message ?? "DB 처리 실패"
    if (portoneCharged) {
      const cancelled = await cancelPortOnePayment(paymentId)
      if (!cancelled) {
        console.error("[RENEWAL RECONCILE REQUIRED]", { paymentId, userId: user.id, error: message })
      }
    }
    if (message.includes("insufficient_points")) {
      return NextResponse.json({ error: "보유 포인트가 부족합니다." }, { status: 400 })
    }
    return NextResponse.json({ error: "갱신 처리 실패", details: message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    expiresAt: rpcResult.expires_at,
    newPoints: rpcResult.new_points,
  })
}
