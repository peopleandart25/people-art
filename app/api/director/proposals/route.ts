import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

async function requireDirector() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "casting_director") return null
  return user
}

// GET /api/director/proposals?status=pending
export async function GET(request: Request) {
  const user = await requireDirector()
  if (!user) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")

  const serviceClient = createServiceClient()

  let query = serviceClient
    .from("casting_proposals")
    .select("id, status, message, created_at, expires_at, casting_id, artist_user_id")
    .eq("director_id", user.id)
    .order("created_at", { ascending: false })

  if (status) {
    query = (query as any).eq("status", status)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })

  const proposals = (data as {
    id: string
    status: string
    message: string | null
    created_at: string
    expires_at: string | null
    casting_id: string | null
    artist_user_id: string
  }[]) ?? []

  // 배치 쿼리 (3M → 3)
  const artistUserIds = [...new Set(proposals.map((p) => p.artist_user_id))]
  const castingIds = proposals.map((p) => p.casting_id).filter((id): id is string => id !== null)

  const [{ data: artistProfilesList }, { data: artistArtistProfiles }, { data: castingsData }] = await Promise.all([
    serviceClient.from("profiles").select("id, name, activity_name").in("id", artistUserIds),
    serviceClient.from("artist_profiles").select("user_id, portfolio_url").in("user_id", artistUserIds),
    castingIds.length > 0
      ? serviceClient.from("castings").select("id, title").in("id", castingIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ])

  const artistProfileMap = new Map((artistProfilesList ?? []).map((p) => [p.id, p]))
  const artistArtistProfileMap = new Map((artistArtistProfiles ?? []).map((ap) => [ap.user_id, ap]))
  const castingMap = new Map((castingsData ?? []).map((c) => [c.id, c]))

  const enriched = proposals.map((p) => {
    const ap = artistProfileMap.get(p.artist_user_id) as { name: string | null; activity_name: string | null } | undefined
    const aap = artistArtistProfileMap.get(p.artist_user_id) as { portfolio_url: string | null } | undefined
    return {
      ...p,
      artist_name: ap?.activity_name ?? ap?.name ?? "이름 없음",
      casting_title: p.casting_id ? (castingMap.get(p.casting_id) as { title: string } | undefined)?.title ?? null : null,
      portfolio_url: aap?.portfolio_url ?? null,
    }
  })

  return NextResponse.json(enriched)
}

// POST /api/director/proposals
// body: { artist_user_ids: string[], casting_id?: string, message?: string }
export async function POST(request: Request) {
  const user = await requireDirector()
  if (!user) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })

  const body = await request.json()
  const { artist_user_ids, casting_id, message } = body as {
    artist_user_ids: string[]
    casting_id?: string
    message?: string
  }

  if (!artist_user_ids || artist_user_ids.length === 0) {
    return NextResponse.json({ error: "아티스트 정보가 필요합니다." }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  // 디렉터 이름 + 캐스팅 공고명 병렬 조회
  const [{ data: directorProfile }, castingResult] = await Promise.all([
    serviceClient.from("profiles").select("name, activity_name").eq("id", user.id).single(),
    casting_id
      ? serviceClient.from("castings").select("title").eq("id", casting_id).single()
      : Promise.resolve({ data: null }),
  ])

  const dp = directorProfile as { name: string | null; activity_name: string | null } | null
  const directorName = dp?.activity_name ?? dp?.name ?? "캐스팅 디렉터"
  const castingTitle = (castingResult.data as { title: string } | null)?.title ?? null

  // 기존 pending 제안 조회하여 중복 제외
  const baseExistingQuery = serviceClient
    .from("casting_proposals")
    .select("artist_user_id")
    .eq("director_id", user.id)
    .in("artist_user_id", artist_user_ids)
    .eq("status", "pending")
  const { data: existingProposals } = (casting_id
    ? await baseExistingQuery.eq("casting_id", casting_id)
    : await baseExistingQuery.is("casting_id", null)) as { data: { artist_user_id: string }[] | null }

  const existingArtistIds = new Set((existingProposals ?? []).map((p) => p.artist_user_id))
  const newArtistIds = artist_user_ids.filter((id) => !existingArtistIds.has(id))

  if (newArtistIds.length === 0) {
    return NextResponse.json({ ids: [] }, { status: 201 })
  }

  // 일괄 insert
  const rows = newArtistIds.map((artist_user_id) => ({
    director_id: user.id,
    artist_user_id,
    casting_id: casting_id ?? null,
    message: message ?? null,
  }))

  const { data: proposals, error } = await serviceClient
    .from("casting_proposals")
    .insert(rows as never)
    .select("id, artist_user_id")

  if (error) return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })

  // 각 아티스트에게 알림 insert
  const notifications = (proposals as { id: string; artist_user_id: string }[]).map((p) => ({
    user_id: p.artist_user_id,
    type: "casting_proposal",
    title: "새 캐스팅 제안이 도착했습니다",
    message: castingTitle
      ? `${directorName}님이 [${castingTitle}] 캐스팅 제안을 보냈습니다.`
      : `${directorName}님이 캐스팅 제안을 보냈습니다.`,
    data: { proposal_id: p.id, casting_id: casting_id ?? null, director_name: directorName },
  }))

  await serviceClient
    .from("notifications" as never)
    .insert(notifications as never)

  return NextResponse.json({ ids: (proposals as { id: string }[]).map((p) => p.id) }, { status: 201 })
}

// DELETE /api/director/proposals
// body: { proposal_id: string }
export async function DELETE(request: Request) {
  const user = await requireDirector()
  if (!user) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })

  const { proposal_id } = await request.json() as { proposal_id: string }
  if (!proposal_id) return NextResponse.json({ error: "proposal_id가 필요합니다." }, { status: 400 })

  const serviceClient = createServiceClient()

  // pending 상태 확인
  const { data: existing } = await serviceClient
    .from("casting_proposals")
    .select("id, status, director_id")
    .eq("id", proposal_id)
    .single()

  if (!existing) return NextResponse.json({ error: "제안을 찾을 수 없습니다." }, { status: 404 })
  const p = existing as { id: string; status: string; director_id: string }
  if (p.director_id !== user.id) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })
  if (p.status !== "pending") return NextResponse.json({ error: "pending 상태의 제안만 취소할 수 있습니다." }, { status: 409 })

  const { error } = await serviceClient
    .from("casting_proposals")
    .delete()
    .eq("id", proposal_id)

  if (error) return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })
  return NextResponse.json({ success: true })
}
