import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET!

// 등록된 카드 정보 조회 (마스킹)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const serviceClient = createServiceClient()
  const { data: membership } = await serviceClient
    .from("memberships")
    .select("billing_key, auto_renew")
    .eq("user_id", user.id)
    .single()

  if (!membership?.billing_key) {
    return NextResponse.json({ card: null })
  }

  // PortOne에서 빌링키로 카드 정보 조회
  try {
    const res = await fetch(`https://api.portone.io/billing-keys/${membership.billing_key}`, {
      headers: { Authorization: `PortOne ${PORTONE_API_SECRET}` },
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      return NextResponse.json({ card: null })
    }

    const billingKeyInfo = await res.json()
    const method = billingKeyInfo.methods?.[0]
    const cardInfo = method?.card

    return NextResponse.json({
      card: cardInfo ? {
        issuer: cardInfo.publisher ?? cardInfo.issuer?.name ?? null,
        number: cardInfo.number ?? null,    // PortOne이 마스킹해서 반환 (예: ****-****-****-1234)
        cardType: cardInfo.type ?? null,     // CREDIT | DEBIT
      } : null,
      autoRenew: membership.auto_renew,
    })
  } catch {
    return NextResponse.json({ card: null })
  }
}

// 카드 변경 (새 빌링키로 교체)
export async function PUT(request: Request) {
  const { billingKey } = await request.json()
  if (!billingKey) {
    return NextResponse.json({ error: "billingKey가 필요합니다." }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  // 새 빌링키 유효성 검증
  const billingKeyRes = await fetch(`https://api.portone.io/billing-keys/${billingKey}`, {
    headers: { Authorization: `PortOne ${PORTONE_API_SECRET}` },
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null)

  if (!billingKeyRes?.ok) {
    return NextResponse.json({ error: "빌링키 검증 실패" }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  const { error } = await serviceClient
    .from("memberships")
    .update({ billing_key: billingKey, auto_renew: true })
    .eq("user_id", user.id)
    .eq("status", "active")

  if (error) {
    return NextResponse.json({ error: "카드 변경 실패" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// 카드 제거 (빌링키 삭제 + 자동갱신 해지)
export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const serviceClient = createServiceClient()
  const { error } = await serviceClient
    .from("memberships")
    .update({ billing_key: null, auto_renew: false })
    .eq("user_id", user.id)
    .eq("status", "active")

  if (error) {
    return NextResponse.json({ error: "카드 제거 실패" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
