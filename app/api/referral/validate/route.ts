import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.json({ valid: false, error: "코드를 입력해주세요." })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ valid: false, error: "로그인이 필요합니다." })
  }

  const serviceClient = createServiceClient()

  // 현재 유저가 이미 추천 보너스를 받은 경우
  const { data: myProfile } = await serviceClient
    .from("profiles")
    .select("referral_bonus_claimed")
    .eq("id", user.id)
    .single()

  if (myProfile?.referral_bonus_claimed) {
    return NextResponse.json({ valid: false, error: "이미 추천인 보너스를 받으셨습니다." })
  }

  // 추천인 코드 조회 (멤버십 활성 회원만 유효)
  const { data: referrer } = await serviceClient
    .from("profiles")
    .select("id, name")
    .eq("referral_code", code.toUpperCase())
    .single()

  if (!referrer) {
    return NextResponse.json({ valid: false, error: "존재하지 않는 추천인 코드입니다." })
  }

  if (referrer.id === user.id) {
    return NextResponse.json({ valid: false, error: "본인의 추천인 코드는 사용할 수 없습니다." })
  }

  const { data: referrerMembership } = await serviceClient
    .from("memberships")
    .select("id")
    .eq("user_id", referrer.id)
    .eq("status", "active")
    .maybeSingle()

  if (!referrerMembership) {
    return NextResponse.json({ valid: false, error: "멤버십 회원의 추천인 코드만 사용할 수 있습니다." })
  }

  return NextResponse.json({ valid: true, referrerName: referrer.name ?? "멤버십 회원" })
}
