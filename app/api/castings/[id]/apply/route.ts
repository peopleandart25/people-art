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
    .select("id, is_closed, birth_year_start, birth_year_end, gender")
    .eq("id", castingId)
    .single()

  if (!casting) return NextResponse.json({ error: "존재하지 않는 공고입니다." }, { status: 404 })
  if (casting.is_closed) return NextResponse.json({ error: "마감된 공고입니다." }, { status: 400 })

  // 아티스트 프로필 조회 (출생연도/성별 검증)
  const { data: artistProfile } = await serviceClient
    .from("artist_profiles")
    .select("birth_date, gender")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!artistProfile) {
    return NextResponse.json({ error: "아티스트 프로필을 먼저 등록해주세요." }, { status: 400 })
  }

  const { birth_year_start, birth_year_end, gender: castingGender } = casting as {
    birth_year_start: number | null
    birth_year_end: number | null
    gender: string | null
  }
  const { birth_date, gender: userGender } = artistProfile as {
    birth_date: string | null
    gender: string | null
  }

  if ((birth_year_start || birth_year_end) && birth_date) {
    const userBirthYear = new Date(birth_date).getFullYear()
    if (
      (birth_year_start && userBirthYear < birth_year_start) ||
      (birth_year_end && userBirthYear > birth_year_end)
    ) {
      return NextResponse.json(
        {
          error: `이 공고는 ${birth_year_start ?? "?"}년생 ~ ${birth_year_end ?? "?"}년생까지만 지원 가능합니다.`,
        },
        { status: 400 }
      )
    }
  }

  if (castingGender && castingGender !== "무관" && userGender && castingGender !== userGender) {
    return NextResponse.json(
      { error: `이 공고는 ${castingGender} 지원자만 지원 가능합니다.` },
      { status: 400 }
    )
  }

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
