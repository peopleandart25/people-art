import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const serviceClient = createServiceClient()
  const [{ data: profile }, { data: membership }] = await Promise.all([
    serviceClient.from("profiles").select("referral_code").eq("id", user.id).single(),
    serviceClient.from("memberships").select("user_id").eq("user_id", user.id).eq("status", "active").maybeSingle(),
  ])

  // 멤버십 활성 회원에게만 추천인 코드 노출
  if (!membership) {
    return NextResponse.json({ referralCode: null })
  }

  return NextResponse.json({ referralCode: profile?.referral_code ?? null })
}
