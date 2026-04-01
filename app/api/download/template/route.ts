import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const FILE_URL = "https://ywokkwjetjyagqzvcepz.supabase.co/storage/v1/object/public/templates/profile-form.pptx"

export async function GET() {
  // 로그인 여부 확인
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  // Supabase Storage에서 파일 fetch 후 스트리밍
  const res = await fetch(FILE_URL)
  if (!res.ok) {
    return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 })
  }

  const buffer = await res.arrayBuffer()

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": 'attachment; filename*=UTF-8\'\'%EB%B0%B0%EC%9A%B0%20%ED%94%84%EB%A1%9C%ED%95%84%20%EC%96%91%EC%8B%9D.pptx',
    },
  })
}
