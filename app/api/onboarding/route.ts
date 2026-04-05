import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const body = await request.json()
  const { name, phone, email, birthDate, gender, height, weight, bio, etcInfo, careerList, portfolioUrl, portfolioFileName } = body

  const serviceClient = createServiceClient()

  // 전화번호 중복 체크
  if (phone) {
    const { data: existing } = await serviceClient
      .from("profiles")
      .select("id")
      .eq("phone", phone)
      .neq("id", user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "이미 가입된 휴대폰 번호입니다." }, { status: 409 })
    }
  }

  // 1. profiles 기본 정보 업데이트 + 온보딩 완료 시 status '활성'으로 변경
  const { error: profileError } = await serviceClient
    .from("profiles")
    .update({
      name: name || null,
      phone: phone || null,
      email: email || null,
      status: "활성",
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (profileError) {
    return NextResponse.json({ error: "프로필 저장 실패", detail: profileError.message }, { status: 500 })
  }

  // 2. artist_profiles upsert
  const { error: artistError } = await serviceClient
    .from("artist_profiles")
    .upsert(
      {
        user_id: user.id,
        bio: bio || null,
        birth_date: birthDate || null,
        gender: gender || null,
        height: height ? Number(height) : null,
        weight: weight ? Number(weight) : null,
        etc_info: etcInfo || null,
        is_public: true,
        portfolio_url: portfolioUrl || null,
        portfolio_file_name: portfolioFileName || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

  if (artistError) {
    return NextResponse.json({ error: "배우 프로필 저장 실패", detail: artistError.message }, { status: 500 })
  }

  // 3. career_items: 기존 삭제 후 재삽입
  await serviceClient.from("career_items").delete().eq("user_id", user.id)

  if (careerList && careerList.length > 0) {
    const careerRows = careerList
      .filter((c: { title: string }) => c.title?.trim())
      .map((c: { category: string; year: string; title: string; role: string }, idx: number) => ({
        user_id: user.id,
        category: c.category,
        year: c.year || null,
        title: c.title,
        role: c.role || null,
        sort_order: idx,
      }))

    if (careerRows.length > 0) {
      const { error: careerError } = await serviceClient.from("career_items").insert(careerRows)
      if (careerError) {
        return NextResponse.json({ error: "경력 저장 실패", detail: careerError.message }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ ok: true })
}
