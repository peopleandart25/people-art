import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const REFERRAL_BONUS = 10000 // 추천인 & 가입자 각각 10,000P

export async function POST(request: Request) {
  const { referralCode } = await request.json()

  if (!referralCode || typeof referralCode !== "string") {
    return NextResponse.json({ error: "추천인 코드가 필요합니다." }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const serviceClient = createServiceClient()

  // 1. 현재 유저 프로필 확인 (이미 추천 받았는지)
  const { data: myProfile } = await serviceClient
    .from("profiles")
    .select("referred_by, points")
    .eq("id", user.id)
    .single()

  if (myProfile?.referred_by) {
    return NextResponse.json({ error: "이미 추천인 코드가 적용되어 있습니다." }, { status: 400 })
  }

  // 2. 추천인 찾기
  const { data: referrer } = await serviceClient
    .from("profiles")
    .select("id, points, referral_code")
    .eq("referral_code", referralCode.toUpperCase())
    .single()

  if (!referrer) {
    return NextResponse.json({ error: "유효하지 않은 추천인 코드입니다." }, { status: 400 })
  }

  if (referrer.id === user.id) {
    return NextResponse.json({ error: "본인의 추천인 코드는 사용할 수 없습니다." }, { status: 400 })
  }

  // 3. 가입자 포인트 지급 + referred_by 설정
  const myNewPoints = (myProfile?.points ?? 0) + REFERRAL_BONUS
  await serviceClient
    .from("profiles")
    .update({ points: myNewPoints, referred_by: referralCode.toUpperCase() })
    .eq("id", user.id)

  // 4. 추천인 포인트 지급
  const referrerNewPoints = (referrer.points ?? 0) + REFERRAL_BONUS
  await serviceClient
    .from("profiles")
    .update({ points: referrerNewPoints })
    .eq("id", referrer.id)

  return NextResponse.json({ success: true, newPoints: myNewPoints })
}
