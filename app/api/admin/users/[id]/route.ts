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

  // Cascade 삭제 (FK 의존 순서대로)
  const tables: { table: string; column: string }[] = [
    { table: "career_items", column: "user_id" },
    { table: "artist_profiles", column: "user_id" },
    { table: "payments", column: "user_id" },
    { table: "memberships", column: "user_id" },
    { table: "event_applications", column: "user_id" },
    { table: "support_history", column: "user_id" },
    { table: "point_transactions", column: "user_id" },
  ]

  for (const { table, column } of tables) {
    const { error } = await serviceClient
      .from(table)
      .delete()
      .eq(column, targetUserId)

    // 테이블이 없거나 컬럼이 없으면 무시
    if (error && !error.message.includes("does not exist")) {
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
