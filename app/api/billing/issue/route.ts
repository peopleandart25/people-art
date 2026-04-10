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
  const { billingKey, pointsUsed = 0, referralCode } = await request.json()

  const { membershipPrice: MEMBERSHIP_PRICE, signupBonus } = await getMembershipSettings()
  const finalAmount = MEMBERSHIP_PRICE - Math.min(pointsUsed, MEMBERSHIP_PRICE)

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

  // 2. 포인트 선검증 + 최초 가입 여부 확인
  const { data: currentProfile } = await serviceClient
    .from("profiles")
    .select("points, referral_bonus_claimed")
    .eq("id", user.id)
    .single()

  if ((currentProfile?.points ?? 0) < pointsUsed) {
    return NextResponse.json({ error: "보유 포인트가 부족합니다." }, { status: 400 })
  }

  // 3. 빌링키 검증
  if (billingKey) {
    const billingKeyRes = await fetch(`https://api.portone.io/billing-keys/${billingKey}`, {
      headers: { Authorization: `PortOne ${PORTONE_API_SECRET}` },
      signal: AbortSignal.timeout(10_000),
    }).catch(() => null)
    if (!billingKeyRes) {
      return NextResponse.json({ error: "결제 서버 응답 지연" }, { status: 504 })
    }
    if (!billingKeyRes.ok) {
      return NextResponse.json({ error: "빌링키 검증 실패" }, { status: 400 })
    }
  }

  // 4. PortOne 결제 실행
  const paymentId = `billing-${user.id}-${Date.now()}`
  let pgProvider = "points"
  let portoneCharged = false

  if (finalAmount > 0 && billingKey) {
    let payRes: Response
    try {
      payRes = await fetch(`https://api.portone.io/payments/${paymentId}/billing-key`, {
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
        signal: AbortSignal.timeout(15_000),
      })
    } catch {
      return NextResponse.json({ error: "결제 서버 응답 지연" }, { status: 504 })
    }

    if (!payRes.ok) {
      const err = await payRes.json()
      console.error("[PortOne 결제 실패]", JSON.stringify(err))
      return NextResponse.json({ error: err.message ?? "결제 실패", details: err }, { status: 400 })
    }

    const paymentRes = await payRes.json()
    // PortOne V2 billing-key 결제 응답: { payment: { pgTxId, paidAt } }
    const paymentInfo = paymentRes.payment ?? paymentRes
    if (!paymentInfo?.paidAt) {
      return NextResponse.json({ error: "결제가 완료되지 않았습니다.", details: paymentRes }, { status: 400 })
    }

    pgProvider = paymentInfo.channel?.pgProvider ?? "unknown"
    portoneCharged = true
  }

  // 5. DB 트랜잭션 (memberships + payments + profiles 원자적 처리)
  const { data: rpcResult, error: rpcError } = await (serviceClient as any).rpc(
    "process_membership_payment",
    {
      p_user_id: user.id,
      p_billing_key: billingKey ?? null,
      p_points_used: pointsUsed,
      p_final_amount: finalAmount,
      p_payment_id: paymentId,
      p_membership_price: MEMBERSHIP_PRICE,
      p_signup_bonus: signupBonus,
      p_pg_provider: pgProvider,
    }
  ) as { data: { success: boolean; new_points: number; expires_at: string } | null; error: { message: string } | null }

  if (rpcError || !rpcResult?.success) {
    // DB 실패 시 PortOne 결제 취소 (보상 트랜잭션)
    if (portoneCharged) {
      const cancelled = await cancelPortOnePayment(paymentId)
      if (!cancelled) {
        console.error("[BILLING RECONCILE REQUIRED]", {
          paymentId,
          userId: user.id,
          error: rpcError?.message,
        })
      }
    }
    const message = rpcError?.message ?? "DB 처리 실패"
    if (message === "insufficient_points") {
      return NextResponse.json({ error: "보유 포인트가 부족합니다." }, { status: 400 })
    }
    return NextResponse.json({ error: "멤버십 처리 실패", details: message }, { status: 500 })
  }

  // 추천인 보너스 지급 — RPC에서 guarded claim + atomic increment 수행
  let finalPoints = rpcResult.new_points
  let referralBonusAwarded = false

  if (!currentProfile?.referral_bonus_claimed && referralCode) {
    const { data: bonusSetting } = await serviceClient
      .from("app_settings")
      .select("value")
      .eq("key", "referral_points_amount")
      .maybeSingle()
    const referralBonus = parseInt(bonusSetting?.value ?? "0", 10)

    if (referralBonus > 0) {
      const { data: bonusResult, error: bonusError } = (await (serviceClient as unknown as {
        rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>
      }).rpc("award_referral_bonus", {
        p_user_id: user.id,
        p_referral_code: referralCode,
        p_bonus_amount: referralBonus,
      })) as { data: { awarded: boolean; new_points?: number; reason?: string } | null; error: { message: string } | null }

      if (!bonusError && bonusResult?.awarded) {
        finalPoints = bonusResult.new_points ?? finalPoints
        referralBonusAwarded = true
      }
    }
  }

  return NextResponse.json({
    success: true,
    expiresAt: rpcResult.expires_at,
    newPoints: finalPoints,
    referralBonusAwarded,
  })
}

// 자동갱신 해지
export async function DELETE() {
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
export async function PATCH() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const serviceClient = createServiceClient()

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
