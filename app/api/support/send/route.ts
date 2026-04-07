import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://people-art.co.kr"
const NON_MEMBER_MONTHLY_LIMIT = 3

type ApplicationTemplate = {
  user_id: string
  message: string | null
  include_pdf: boolean
  include_profile_link: boolean
  include_videos: boolean
  custom_attachment_url: string | null
  custom_attachment_name: string | null
  updated_at: string
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { agency_ids } = await request.json()
  if (!Array.isArray(agency_ids) || agency_ids.length === 0) {
    return NextResponse.json({ error: "agency_ids required" }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0]

  const [profileRes, artistRes, templateRes, agenciesRes, membershipRes, historyRes] = await Promise.all([
    serviceClient.from("profiles").select("name, phone, email, role").eq("id", user.id).single(),
    serviceClient.from("artist_profiles").select("id, portfolio_url").eq("user_id", user.id).maybeSingle(),
    serviceClient.from("application_templates" as never).select("*").eq("user_id", user.id).maybeSingle(),
    serviceClient.from("support_agencies").select("id, name, email").in("id", agency_ids),
    serviceClient.from("memberships").select("id").eq("user_id", user.id).eq("status", "active").maybeSingle(),
    serviceClient.from("support_history").select("agency_id").eq("user_id", user.id).gte("sent_at", thirtyDaysAgoStr),
  ])

  const profile = profileRes.data
  const artistProfile = artistRes.data
  const template = templateRes.data as ApplicationTemplate | null
  const agencies = (agenciesRes.data ?? []).filter((a) => !!a.email)
  const isPremium = !!membershipRes.data || profile?.role === "admin"
  const recentSentIds = new Set((historyRes.data ?? []).map((h) => h.agency_id))

  // 서버사이드 비회원 한도 검증
  if (!isPremium) {
    const recentSentCount = historyRes.data?.length ?? 0
    if (recentSentCount + agencies.length > NON_MEMBER_MONTHLY_LIMIT) {
      return NextResponse.json(
        { error: `기본 회원은 30일간 최대 ${NON_MEMBER_MONTHLY_LIMIT}곳까지 지원 가능합니다.` },
        { status: 403 }
      )
    }
  }

  // 30일 이내 중복 지원 필터링
  const validAgencies = agencies.filter((a) => !recentSentIds.has(a.id))
  if (validAgencies.length === 0) {
    return NextResponse.json({ error: "선택한 기관 모두 30일 이내에 이미 지원하셨습니다." }, { status: 400 })
  }

  const name = profile?.name ?? ""
  const phone = profile?.phone ?? ""
  const replyTo = profile?.email || user.email || undefined
  const profileUrl = artistProfile ? `${SITE_URL}/artists/${artistProfile.id}` : null
  const portfolioUrl = artistProfile?.portfolio_url ?? null

  // 영상 링크 조회
  let videoLinks: { url: string; name: string }[] = []
  if (template?.include_videos) {
    const { data: videos } = await serviceClient
      .from("video_assets")
      .select("url, name, type")
      .eq("user_id", user.id)
      .eq("type", "link")
    videoLinks = (videos ?? []).filter(v => v.url).map(v => ({ url: v.url!, name: v.name ?? "영상" }))
  }

  const customMessage = template?.message?.trim()
  const contactBlock = `이름: ${name}${phone ? `\n연락처: ${phone}` : ""}${replyTo ? `\n이메일: ${replyTo}` : ""}`
  const baseMessage = customMessage
    ? `${customMessage}\n\n---\n${contactBlock}`
    : `안녕하세요.\n\n피플앤아트(people-art.co.kr)를 통해 프로필을 지원드립니다.\n\n${contactBlock}`

  // 이메일 병렬 발송
  const sendResults = await Promise.allSettled(
    validAgencies.map(async (agency) => {
      let body = baseMessage + "\n\n"

      if ((template?.include_profile_link ?? true) && profileUrl) {
        body += `📋 프로필 페이지: ${profileUrl}\n`
      }
      if ((template?.include_pdf ?? true) && portfolioUrl) {
        body += `📄 PDF 포트폴리오: ${portfolioUrl}\n`
      }
      if ((template?.include_videos ?? false) && videoLinks.length > 0) {
        body += `🎬 영상 링크:\n`
        videoLinks.forEach(v => { body += `  - ${v.name}: ${v.url}\n` })
      }
      if (template?.custom_attachment_url) {
        const attachName = template.custom_attachment_name ?? "첨부파일"
        body += `📎 첨부파일: ${attachName} - ${template.custom_attachment_url}\n`
      }

      body += "\n검토 부탁드립니다.\n감사합니다."

      await resend.emails.send({
        from: `${name} via People & Art <no-reply@people-art.co.kr>`,
        to: agency.email!,
        ...(replyTo ? { replyTo } : {}),
        subject: `[프로필 지원] ${name} 배우 프로필 제출`,
        text: body,
      })
    })
  )

  // 성공한 항목만 이력 저장
  const today = new Date().toISOString().split("T")[0]
  const successIds: string[] = []
  const failedNames: string[] = []

  sendResults.forEach((result, i) => {
    if (result.status === "fulfilled") {
      successIds.push(validAgencies[i].id)
    } else {
      failedNames.push(validAgencies[i].name)
    }
  })

  if (successIds.length > 0) {
    await serviceClient.from("support_history").insert(
      successIds.map((id) => ({ user_id: user.id, agency_id: id, sent_at: today }))
    )
  }

  if (failedNames.length > 0) {
    return NextResponse.json({ ok: false, failed: failedNames, sent: successIds.length }, { status: 207 })
  }
  return NextResponse.json({ ok: true, sent: successIds.length })
}
