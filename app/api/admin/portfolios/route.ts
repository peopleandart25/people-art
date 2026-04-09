import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const serviceClient = createServiceClient()
  const { data: caller } = await serviceClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (!caller || !["admin", "sub_admin"].includes(caller.role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })
  }

  const { data: artists, error } = await serviceClient
    .from("artist_profiles")
    .select("user_id, portfolio_url, portfolio_file_name, portfolio_updated_at")
    .not("portfolio_url", "is", null)
    .order("portfolio_updated_at", { ascending: false, nullsFirst: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const userIds = (artists ?? []).map(a => a.user_id)
  const { data: profiles } = userIds.length > 0
    ? await serviceClient.from("profiles").select("id, name, email, activity_name").in("id", userIds)
    : { data: [] }

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))
  const result = (artists ?? []).map(a => {
    const p = profileMap.get(a.user_id) as { name: string | null; email: string | null; activity_name: string | null } | undefined
    return {
      user_id: a.user_id,
      name: p?.name ?? null,
      activity_name: p?.activity_name ?? null,
      email: p?.email ?? null,
      portfolio_url: a.portfolio_url,
      portfolio_file_name: a.portfolio_file_name,
      portfolio_updated_at: a.portfolio_updated_at,
    }
  })

  return NextResponse.json(result)
}
