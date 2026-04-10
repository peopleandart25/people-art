import { createServiceClient } from "@/lib/supabase/server"
import { getMembershipSettings } from "@/lib/supabase/membership-settings"
import { NextResponse } from "next/server"
import { createHmac } from "crypto"

const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET!

// PortOne v2 웹훅 시그니처 검증 (Svix 호환 포맷)
// PORTONE_WEBHOOK_SECRET 미설정 시 검증 생략 (하위 호환)
async function verifyWebhookSignature(request: Request, rawBody: string): Promise<boolean> {
  const webhookSecret = process.env.PORTONE_WEBHOOK_SECRET
  if (!webhookSecret) return true

  const webhookId = request.headers.get("webhook-id")
  const webhookTimestamp = request.headers.get("webhook-timestamp")
  const webhookSignature = request.headers.get("webhook-signature")

  if (!webhookId || !webhookTimestamp || !webhookSignature) return false

  // 리플레이 공격 방지: ±5분 이내 타임스탬프만 허용
  const ts = parseInt(webhookTimestamp, 10)
  if (Math.abs(Date.now() / 1000 - ts) > 300) return false

  const message = `${webhookId}.${webhookTimestamp}.${rawBody}`
  const secretBytes = Buffer.from(webhookSecret.replace("whsec_", ""), "base64")
  const expectedSig = createHmac("sha256", secretBytes).update(message).digest("base64")

  // 헤더에 여러 시그니처가 올 수 있음 (space-separated "v1,<base64>")
  const receivedSigs = webhookSignature.split(" ").map((s) => s.replace("v1,", ""))
  return receivedSigs.some((sig) => sig === expectedSig)
}

export async function POST(request: Request) {
  const rawBody = await request.text()

  // 시그니처 검증
  const isValid = await verifyWebhookSignature(request, rawBody)
  if (!isValid) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 })
  }

  let body: { type?: string; data?: { paymentId?: string } }
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

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
  const match = paymentId.match(/^payment-([a-f0-9-]+)-\d+$/)
  if (!match) {
    return NextResponse.json({ error: "잘못된 paymentId 형식" }, { status: 400 })
  }
  const userId = match[1]

  const serviceClient = createServiceClient()

  // 이미 처리된 결제인지 먼저 확인 (중복 방지 — DB UNIQUE 제약과 이중 방어)
  const { data: existing } = await serviceClient
    .from("payments")
    .select("id")
    .eq("pg_transaction_id", paymentId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ ok: true })
  }

  // PortOne API로 결제 검증
  let portoneRes: Response
  try {
    portoneRes = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
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
    return NextResponse.json({ ok: true })
  }

  const { membershipPrice: MEMBERSHIP_PRICE, signupBonus: SIGNUP_BONUS } = await getMembershipSettings()

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
    console.error("[webhook] memberships upsert 실패:", membershipError?.message)
    return NextResponse.json({ error: "멤버십 저장 실패" }, { status: 500 })
  }

  // payments 테이블에 기록 (pg_transaction_id UNIQUE 제약으로 중복 insert 방어)
  const { error: paymentError } = await serviceClient.from("payments").insert({
    user_id: userId,
    membership_id: membership.id,
    amount: actualAmount,
    points_used: pointsUsed,
    status: "completed",
    pg_provider: payment.channel?.pgProvider ?? "unknown",
    pg_transaction_id: paymentId,
    payment_method: "card",
  })

  if (paymentError) {
    // UNIQUE 제약 위반이면 이미 처리됨 → 성공 응답
    if (paymentError.code === "23505") {
      return NextResponse.json({ ok: true })
    }
    console.error("[webhook] payments insert 실패:", paymentError.message)
    return NextResponse.json({ error: "결제 내역 저장 실패" }, { status: 500 })
  }

  // profiles points 업데이트 (트리거가 membership_is_active 동기화 처리)
  const { data: currentProfile } = await serviceClient
    .from("profiles")
    .select("points")
    .eq("id", userId)
    .single()

  const currentPoints = currentProfile?.points ?? 0
  const newPoints = Math.max(0, currentPoints - pointsUsed) + SIGNUP_BONUS

  const { error: profileError } = await serviceClient
    .from("profiles")
    .update({ points: newPoints } as never)
    .eq("id", userId)

  if (profileError) {
    console.error("[webhook] profiles update 실패:", profileError.message)
    return NextResponse.json({ error: "프로필 업데이트 실패" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
