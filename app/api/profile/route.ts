import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(null)
  }

  const serviceClient = createServiceClient()
  const [{ data: profile }, { data: membership }] = await Promise.all([
    serviceClient.from("profiles").select("*").eq("id", user.id).single(),
    serviceClient
      .from("memberships")
      .select("expires_at, status, auto_renew")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle(),
  ])

  return NextResponse.json({
    ...profile,
    email: profile?.email ?? user.email ?? null,
    membership_expires_at: membership?.expires_at ?? null,
    membership_auto_renew: membership?.auto_renew ?? false,
    membership_is_active: !!membership,
  })
}
