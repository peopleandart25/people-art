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

  function buildEmailHtml(): string {
    const greeting = customMessage
      ? customMessage.replace(/\n/g, "<br>")
      : `안녕하세요. 배우 ${name}입니다.<br><br>귀사에 제 프로필 파일과 연기 영상 링크를 첨부하여 보내드립니다.<br>바쁘시겠지만 긍정적으로 검토해 주시면 감사하겠습니다.<br><br>앞으로 좋은 인연으로 뵐 수 있기를 기대합니다. 감사합니다.`

    const includeProfile = (template?.include_profile_link ?? true) && profileUrl
    const includePdf = (template?.include_pdf ?? true) && portfolioUrl
    const includeVideos = (template?.include_videos ?? false) && videoLinks.length > 0
    const includeCustom = !!template?.custom_attachment_url

    const ctaButtons = [
      includeProfile && `<a href="${profileUrl}" style="display:inline-block;padding:10px 20px;background:#f97316;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;margin:4px;">프로필 보기</a>`,
      includePdf && `<a href="${portfolioUrl}" style="display:inline-block;padding:10px 20px;background:#ffffff;color:#f97316;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;border:1.5px solid #f97316;margin:4px;">PDF 다운로드</a>`,
    ].filter(Boolean).join("\n")

    const videoSection = includeVideos ? `
      <tr><td style="padding:0 32px 16px;">
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;font-weight:600;">영상 링크</p>
        ${videoLinks.map(v => `<p style="margin:0 0 4px;font-size:14px;"><a href="${v.url}" style="color:#f97316;text-decoration:none;">▶ ${v.name}</a></p>`).join("")}
      </td></tr>` : ""

    const customSection = includeCustom ? `
      <tr><td style="padding:0 32px 16px;">
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;font-weight:600;">첨부파일</p>
        <a href="${template.custom_attachment_url}" style="color:#f97316;font-size:14px;text-decoration:none;">📎 ${template.custom_attachment_name ?? "첨부파일"}</a>
      </td></tr>` : ""

    return `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

        <!-- 헤더 -->
        <tr><td style="background:#f97316;padding:20px 32px;">
          <p style="margin:0;color:#ffffff;font-size:13px;font-weight:500;opacity:0.9;">People &amp; Art</p>
          <p style="margin:4px 0 0;color:#ffffff;font-size:20px;font-weight:700;">${name} 배우 프로필 지원</p>
        </td></tr>

        ${greeting ? `
        <!-- 메시지 -->
        <tr><td style="padding:28px 32px 20px;">
          <p style="margin:0;font-size:15px;color:#111827;line-height:1.7;">${greeting}</p>
        </td></tr>` : ""}

        <!-- 연락처 -->
        <tr><td style="padding:0 32px 24px;">
          <table style="background:#f9fafb;border-radius:8px;width:100%;padding:16px;" cellpadding="0" cellspacing="0">
            <tr><td style="font-size:13px;color:#374151;padding:2px 0;"><span style="color:#6b7280;width:60px;display:inline-block;">이름</span>${name}</td></tr>
            ${phone ? `<tr><td style="font-size:13px;color:#374151;padding:2px 0;"><span style="color:#6b7280;width:60px;display:inline-block;">연락처</span>${phone}</td></tr>` : ""}
            ${replyTo ? `<tr><td style="font-size:13px;color:#374151;padding:2px 0;"><span style="color:#6b7280;width:60px;display:inline-block;">이메일</span>${replyTo}</td></tr>` : ""}
          </table>
        </td></tr>

        <!-- CTA 버튼 -->
        ${ctaButtons ? `<tr><td style="padding:0 32px 24px;">${ctaButtons}</td></tr>` : ""}

        <!-- 영상 / 첨부파일 -->
        ${videoSection}
        ${customSection}

        <!-- 푸터 -->
        <tr><td style="padding:20px 32px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">이 메일은 <a href="https://people-art.co.kr" style="color:#f97316;text-decoration:none;">People &amp; Art</a>를 통해 발송되었습니다.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
  }

  // 이메일 병렬 발송
  const sendResults = await Promise.allSettled(
    validAgencies.map(async (agency) => {
      await resend.emails.send({
        from: `${name} via People & Art <no-reply@people-art.co.kr>`,
        to: agency.email!,
        ...(replyTo ? { replyTo } : {}),
        subject: `[프로필 지원] ${name} 배우 프로필 제출`,
        html: buildEmailHtml(),
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
