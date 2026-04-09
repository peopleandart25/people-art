import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET /api/notifications
// ?unread_only=1 인 경우 카운트만 반환 (가벼운 폴링용)
// 응답: { items: [...], unread_count: number }
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })

  const serviceClient = createServiceClient()
  const url = new URL(request.url)
  const unreadOnly = url.searchParams.get("unread_only") === "1"

  if (unreadOnly) {
    const { count } = await serviceClient
      .from("notifications" as never)
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false)
    return NextResponse.json({ unread_count: count ?? 0 })
  }

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

  const body = (await request.json().catch(() => ({}))) as { id?: unknown }

  // id가 제공된 경우 UUID 형식만 허용 (잘못된 타입으로 인한 500 방지)
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  let targetId: string | null = null
  if (body.id !== undefined) {
    if (typeof body.id !== "string" || !UUID_RE.test(body.id)) {
      return NextResponse.json({ error: "유효하지 않은 id" }, { status: 400 })
    }
    targetId = body.id
  }

  const serviceClient = createServiceClient()

  const baseQuery = serviceClient
    .from("notifications" as never)
    .update({ is_read: true } as never)
    .eq("user_id", user.id)

  const { error } = targetId
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? await (baseQuery as any).eq("id", targetId)
    : await baseQuery

  if (error) return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })
  return NextResponse.json({ success: true })
}
