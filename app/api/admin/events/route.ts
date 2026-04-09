import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { NextResponse } from "next/server"

// 이벤트 추가
export async function POST(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })

  const body = await request.json()
  const serviceClient = createServiceClient()

  const { data, error } = await serviceClient
    .from("events")
    .insert(body)
    .select("id, image_url")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// 이벤트 수정
export async function PATCH(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })

  const { id, ...payload } = await request.json()
  if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 })

  const serviceClient = createServiceClient()

  const { data, error } = await serviceClient
    .from("events")
    .update(payload)
    .eq("id", id)
    .select("id, image_url")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// 이벤트 삭제
export async function DELETE(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 })

  const serviceClient = createServiceClient()

  const { error } = await serviceClient
    .from("events")
    .delete()
    .eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
