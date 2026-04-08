import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(null)
  }

  const serviceClient = createServiceClient()
  const [{ data: profile }, { data: membership }, { data: artistProfile }] = await Promise.all([
    serviceClient.from("profiles").select("*").eq("id", user.id).single(),
    serviceClient
      .from("memberships")
      .select("expires_at, status, auto_renew")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle(),
    serviceClient.from("artist_profiles").select("id").eq("user_id", user.id).maybeSingle(),
  ])

  return NextResponse.json(
    {
      ...profile,
      email: profile?.email ?? user.email ?? null,
      membership_expires_at: membership?.expires_at ?? null,
      membership_auto_renew: membership?.auto_renew ?? false,
      membership_is_active: !!membership,
      has_artist_profile: !!artistProfile,
    },
    { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" } }
  )
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { name, phone, activity_name, email } = body as {
    name?: string
    phone?: string
    activity_name?: string
    email?: string
  }

  const updatePayload: Record<string, string | null> = {}
  if (name !== undefined) updatePayload.name = name
  if (phone !== undefined) updatePayload.phone = phone
  if (activity_name !== undefined) updatePayload.activity_name = activity_name
  if (email !== undefined) updatePayload.email = email

  const serviceClient = createServiceClient()
  const { error } = await serviceClient.from("profiles").update(updatePayload).eq("id", user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
