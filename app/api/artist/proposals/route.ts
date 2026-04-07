import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const countOnly = searchParams.get("count") === "true"

  const serviceClient = createServiceClient()

  if (countOnly) {
    const { count } = await serviceClient
      .from("casting_proposals" as never)
      .select("id", { count: "exact", head: true })
      .eq("artist_user_id", user.id)
      .eq("status", "pending")

    return NextResponse.json({ pending: count ?? 0 })
  }

  // 프리미엄 회원만 제안 목록 조회 가능
  const [{ data: membership }, { data: profileData }] = await Promise.all([
    serviceClient
      .from("memberships")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle(),
    serviceClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single(),
  ])

  const isPremium = !!membership || (profileData as { role: string } | null)?.role === "admin"
  if (!isPremium) {
    return NextResponse.json({ error: "멤버십 회원만 이용 가능합니다." }, { status: 403 })
  }

  const { data, error } = await serviceClient
    .from("casting_proposals" as never)
    .select("id, status, message, created_at, expires_at, casting_id, director_id")
    .eq("artist_user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })

  const proposals = (data as {
    id: string
    status: string
    message: string | null
    created_at: string
    expires_at: string | null
    casting_id: string | null
    director_id: string
  }[]) ?? []

  const enriched = await Promise.all(
    proposals.map(async (p) => {
      const [{ data: directorProfile }, castingResult] = await Promise.all([
        serviceClient
          .from("profiles")
          .select("name, activity_name, company")
          .eq("id", p.director_id)
          .single(),
        p.casting_id
          ? serviceClient
              .from("castings")
              .select("title, category, role_type, location, work_period, fee, deadline")
              .eq("id", p.casting_id)
              .single()
          : Promise.resolve({ data: null }),
      ])
      const dp = directorProfile as { name: string | null; activity_name: string | null; company: string | null } | null
      const casting = castingResult.data as { title: string; category: string | null; role_type: string | null; location: string | null; work_period: string | null; fee: string | null; deadline: string | null } | null
      return {
        ...p,
        director_name: dp?.activity_name ?? dp?.name ?? "디렉터",
        director_company: dp?.company ?? null,
        casting_title: casting?.title ?? null,
        casting_category: casting?.category ?? null,
        casting_role_type: casting?.role_type ?? null,
        casting_location: casting?.location ?? null,
        casting_work_period: casting?.work_period ?? null,
        casting_fee: casting?.fee ?? null,
        casting_deadline: casting?.deadline ?? null,
      }
    })
  )

  return NextResponse.json(enriched)
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })

  const { proposal_id, status } = await request.json() as {
    proposal_id: string
    status: "accepted" | "rejected"
  }

  if (!proposal_id || !["accepted", "rejected"].includes(status)) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  // 프리미엄 회원만 제안 응답 가능
  const [{ data: membership }, { data: profileData }] = await Promise.all([
    serviceClient
      .from("memberships")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle(),
    serviceClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single(),
  ])

  const isPremium = !!membership || (profileData as { role: string } | null)?.role === "admin"
  if (!isPremium) {
    return NextResponse.json({ error: "멤버십 회원만 이용 가능합니다." }, { status: 403 })
  }

  // 본인 제안인지 + 현재 status 확인
  const { data: existing } = await serviceClient
    .from("casting_proposals" as never)
    .select("id, artist_user_id, status")
    .eq("id", proposal_id)
    .single()

  if (!existing || (existing as { artist_user_id: string }).artist_user_id !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })
  }

  if ((existing as { status: string }).status !== "pending") {
    return NextResponse.json({ error: "이미 처리된 제안입니다." }, { status: 409 })
  }

  const { data: updated, error } = await serviceClient
    .from("casting_proposals" as never)
    .update({ status })
    .eq("id", proposal_id)
    .select("director_id")
    .single()

  if (error) return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })

  // 디렉터에게 알림 insert
  const directorId = (updated as { director_id: string } | null)?.director_id
  if (directorId) {
    const { data: artistProfile } = await serviceClient
      .from("profiles")
      .select("name, activity_name")
      .eq("id", user.id)
      .single()

    const ap = artistProfile as { name: string | null; activity_name: string | null } | null
    const artistName = ap?.activity_name ?? ap?.name ?? "아티스트"

    await serviceClient
      .from("notifications" as never)
      .insert({
        user_id: directorId,
        type: "proposal_response",
        title: "제안에 응답했습니다",
        message: `${artistName}님이 캐스팅 제안을 ${status === "accepted" ? "수락" : "거절"}했습니다.`,
        data: { proposal_id, status },
      } as never)
  }

  return NextResponse.json({ success: true })
}
