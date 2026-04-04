import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const serviceClient = createServiceClient()

  const { data: membership } = await serviceClient
    .from("memberships")
    .select("status, expires_at, billing_key, auto_renew")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  return NextResponse.json({
    isActive: !!membership,
    expiresAt: membership?.expires_at ?? null,
    hasBillingKey: !!membership?.billing_key,
    autoRenew: membership?.auto_renew ?? false,
  })
}
