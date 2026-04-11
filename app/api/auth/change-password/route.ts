import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  let body: { currentPassword?: string; newPassword?: string }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 })
  }
  const { currentPassword, newPassword } = body

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "현재 비밀번호와 새 비밀번호를 입력해주세요." }, { status: 400 })
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: "새 비밀번호는 최소 6자 이상이어야 합니다." }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  if (!user.email) {
    return NextResponse.json({ error: "이메일 정보를 찾을 수 없습니다." }, { status: 400 })
  }

  // 현재 비밀번호 검증
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })

  if (signInError) {
    return NextResponse.json({ error: "현재 비밀번호가 올바르지 않습니다." }, { status: 400 })
  }

  // 새 비밀번호로 변경
  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })

  if (updateError) {
    return NextResponse.json({ error: "비밀번호 변경 중 오류가 발생했습니다." }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
