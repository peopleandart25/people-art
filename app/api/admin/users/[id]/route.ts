import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// 회원 데이터 cascade 삭제 (테스트용)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetUserId } = await params

  // 관리자 권한 확인
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const serviceClient = createServiceClient()

  const { data: callerProfile } = await serviceClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!callerProfile || !["admin", "sub_admin"].includes(callerProfile.role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })
  }

  // 자기 자신은 삭제 불가
  if (targetUserId === user.id) {
    return NextResponse.json({ error: "자기 자신은 삭제할 수 없습니다." }, { status: 400 })
  }

  // Cascade 삭제 — FK 의존 순서대로 (자식 → 부모)
  const tables: string[] = [
    "career_items",
    "artist_photos",
    "social_links",
    "video_assets",
    "artist_profiles",
    "payments",
    "memberships",
    "event_applications",
    "support_history",
    "tour_participations",
    "agency_applications",
    "reviews",
  ]

  for (const table of tables) {
    const { error } = await serviceClient.from(table).delete().eq("user_id", targetUserId)
    if (error) {
      return NextResponse.json(
        { error: `${table} 삭제 실패`, detail: error.message },
        { status: 500 }
      )
    }
  }

  // profiles 삭제
  const { error: profileError } = await serviceClient
    .from("profiles")
    .delete()
    .eq("id", targetUserId)

  if (profileError) {
    return NextResponse.json(
      { error: "profiles 삭제 실패", detail: profileError.message },
      { status: 500 }
    )
  }

  // auth.users 삭제 (Supabase Admin API)
  const { error: authError } = await serviceClient.auth.admin.deleteUser(targetUserId)
  if (authError) {
    return NextResponse.json(
      { error: "auth 사용자 삭제 실패", detail: authError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
