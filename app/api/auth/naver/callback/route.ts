import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient as createAdminClient } from "@supabase/supabase-js"

function sanitizeRedirectTo(raw: string | undefined): string {
  if (!raw) return "/"
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/"
  return raw
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")

  // 1) state + nonce 쿠키 검증 (CSRF/open-redirect 방어)
  const cookieStore = await cookies()
  const expectedNonce = cookieStore.get("pa_naver_oauth_nonce")?.value
  cookieStore.delete("pa_naver_oauth_nonce")

  let redirectTo = "/"
  try {
    const parsed = JSON.parse(state ?? "{}") as { n?: string; r?: string }
    if (!expectedNonce || parsed.n !== expectedNonce) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }
    redirectTo = sanitizeRedirectTo(parsed.r)
  } catch {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  if (!code) return NextResponse.redirect(`${origin}/login?error=auth_failed`)

  try {
    // 2) 네이버 액세스 토큰 교환
    const tokenRes = await fetch(
      "https://nid.naver.com/oauth2.0/token?" +
        new URLSearchParams({
          grant_type: "authorization_code",
          client_id: process.env.NAVER_CLIENT_ID!,
          client_secret: process.env.NAVER_CLIENT_SECRET!,
          code,
          state: state ?? "",
        }),
      { method: "GET", signal: AbortSignal.timeout(10_000) }
    )
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    // 3) 네이버 사용자 프로필 조회
    const profileRes = await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
      signal: AbortSignal.timeout(10_000),
    })
    const profileData = await profileRes.json()
    const naverUser = profileData.response

    if (!naverUser?.email) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 4) 신규 유저 생성 시도
    const createRes = await adminClient.auth.admin.createUser({
      email: naverUser.email,
      email_confirm: true,
      user_metadata: {
        full_name: naverUser.name ?? naverUser.nickname ?? "",
        name: naverUser.name ?? naverUser.nickname ?? "",
        avatar_url: naverUser.profile_image ?? "",
        provider: "naver",
      },
    })

    if (createRes.error) {
      // 이미 가입된 이메일 → 기존 유저에게 magic link 발급
      const { data: reLinkData, error: reLinkError } = await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email: naverUser.email,
        options: { redirectTo: `${origin}/auth/hash-callback?redirectTo=${encodeURIComponent(redirectTo)}` },
      })
      if (reLinkError || !reLinkData?.properties?.action_link) {
        return NextResponse.redirect(`${origin}/login?error=auth_failed`)
      }
      return NextResponse.redirect(reLinkData.properties.action_link)
    }

    // 5) Magic link 생성으로 세션 발급
    const magicRedirectTo = `${origin}/auth/hash-callback?redirectTo=${encodeURIComponent(redirectTo)}`
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email: naverUser.email,
      options: { redirectTo: magicRedirectTo },
    })

    if (linkError || !linkData?.properties?.action_link) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    return NextResponse.redirect(linkData.properties.action_link)
  } catch {
    // 에러 상세를 URL에 노출하지 않음 (PII/내부 오류 유출 방지)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }
}
