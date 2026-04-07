import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET /api/notifications
// 응답: { items: [...], unread_count: number }
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })

  const serviceClient = createServiceClient()

  const [{ data: items, error }, { count }] = await Promise.all([
    serviceClient
      .from("notifications" as never)
      .select("id, type, title, message, data, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    serviceClient
      .from("notifications" as never)
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false),
  ])

  if (error) return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })

  return NextResponse.json({ items: items ?? [], unread_count: count ?? 0 })
}

// PATCH /api/notifications
// body: { id?: string } — id 없으면 전체 읽음 처리
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })

  const body = await request.json() as { id?: string }

  const serviceClient = createServiceClient()

  const baseQuery = serviceClient
    .from("notifications" as never)
    .update({ is_read: true } as never)
    .eq("user_id", user.id)

  const { error } = body.id
    ? await (baseQuery as any).eq("id", body.id)
    : await baseQuery

  if (error) return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })
  return NextResponse.json({ success: true })
}
