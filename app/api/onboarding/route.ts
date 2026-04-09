import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const body = await request.json()
  const { name, activityName, phone, email, birthDate, gender, height, weight, bio, etcInfo, careerList, portfolioUrl, portfolioFileName, privacyAgreed, marketingAgreed } = body

  if (!privacyAgreed) {
    return NextResponse.json({ error: "개인정보 수집 및 이용에 동의해주세요." }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  // 전화번호 pre-check (unique index가 실제 race 방어, 여기선 UX용 빠른 실패)
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
  const nowIso = new Date().toISOString()
  const { error: profileError } = await serviceClient
    .from("profiles")
    .update({
      name: name || null,
      activity_name: activityName || null,
      phone: phone || null,
      email: email || null,
      status: "활성",
      privacy_agreed_at: nowIso,
      marketing_agreed_at: marketingAgreed ? nowIso : null,
      updated_at: nowIso,
    })
    .eq("id", user.id)

  if (profileError) {
    // unique index 위반 시 409로 변환
    if (profileError.code === "23505" && profileError.message?.includes("profiles_phone_unique")) {
      return NextResponse.json({ error: "이미 가입된 휴대폰 번호입니다." }, { status: 409 })
    }
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

  // 3. career_items 원자 교체 (delete + insert 단일 트랜잭션)
  const careerItems = Array.isArray(careerList) ? careerList : []
  const { error: careerError } = await (serviceClient as unknown as {
    rpc: (name: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }>
  }).rpc("replace_career_items", {
    p_user_id: user.id,
    p_items: careerItems,
  })

  if (careerError) {
    return NextResponse.json({ error: "경력 저장 실패", detail: careerError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
