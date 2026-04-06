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

  // auth.users 삭제 → profiles CASCADE → 모든 하위 데이터 자동 삭제
  const { error: authError } = await serviceClient.auth.admin.deleteUser(targetUserId)
  if (authError) {
    return NextResponse.json(
      { error: "사용자 삭제 실패", detail: authError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
