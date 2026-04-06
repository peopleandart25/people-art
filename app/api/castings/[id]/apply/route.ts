import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: castingId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })

  const serviceClient = createServiceClient()

  // 캐스팅 존재 및 마감 여부 확인
  const { data: casting } = await serviceClient
    .from("castings")
    .select("id, is_closed")
    .eq("id", castingId)
    .single()

  if (!casting) return NextResponse.json({ error: "존재하지 않는 공고입니다." }, { status: 404 })
  if (casting.is_closed) return NextResponse.json({ error: "마감된 공고입니다." }, { status: 400 })

  const { data, error } = await serviceClient
    .from("casting_applications")
    .insert({ casting_id: castingId, user_id: user.id })
    .select("id")
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "이미 지원한 공고입니다." }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: castingId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ applied: false })

  const serviceClient = createServiceClient()
  const { data } = await serviceClient
    .from("casting_applications")
    .select("id")
    .eq("casting_id", castingId)
    .eq("user_id", user.id)
    .maybeSingle()

  return NextResponse.json({ applied: !!data })
}
