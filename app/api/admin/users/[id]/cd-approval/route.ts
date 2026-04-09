import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetUserId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })

  const serviceClient = createServiceClient()
  const { data: caller } = await serviceClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (!caller || !["admin", "sub_admin"].includes(caller.role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })
  }

  const { status } = await request.json() as { status: "pending" | "approved" | "rejected" }
  if (!["pending", "approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "유효하지 않은 상태입니다." }, { status: 400 })
  }

  const { data, error } = await serviceClient
    .from("profiles")
    .update({ cd_approval_status: status })
    .eq("id", targetUserId)
    .eq("role", "casting_director")
    .select()
    .maybeSingle()

  if (error) {
    if ((error as { code?: string }).code === "PGRST116") {
      return NextResponse.json({ error: "해당 캐스팅 디렉터를 찾을 수 없습니다." }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: "해당 캐스팅 디렉터를 찾을 수 없습니다." }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}
