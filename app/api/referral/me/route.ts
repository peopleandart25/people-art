import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("referral_code, role")
    .eq("id", user.id)
    .single()

  // 멤버십 회원(premium)에게만 추천인 코드 노출
  if (profile?.role !== "premium") {
    return NextResponse.json({ referralCode: null })
  }

  return NextResponse.json({ referralCode: profile?.referral_code ?? null })
}
