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
    const parsed = JSON.parse(atob(state ?? "")) as { n?: string; r?: string }
    if (!expectedNonce || parsed.n !== expectedNonce) {
      console.error("[naver/callback] nonce 불일치:", { expectedNonce, stateNonce: parsed.n })
      return NextResponse.redirect(`${origin}/login?error=auth_failed&detail=${encodeURIComponent("nonce_mismatch: expected=" + (expectedNonce ?? "null") + " got=" + (parsed.n ?? "null"))}`)
    }
    redirectTo = sanitizeRedirectTo(parsed.r)
  } catch (e) {
    console.error("[naver/callback] state 파싱 실패:", String(e))
    return NextResponse.redirect(`${origin}/login?error=auth_failed&detail=${encodeURIComponent("state_parse_error: " + String(e))}`)
  }

  if (!code) return NextResponse.redirect(`${origin}/login?error=auth_failed&detail=no_code`)

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
      console.error("[naver/callback] 토큰 발급 실패:", tokenData)
      return NextResponse.redirect(`${origin}/login?error=auth_failed&detail=${encodeURIComponent("naver_token_failed: " + JSON.stringify(tokenData))}`)
    }

    // 3) 네이버 사용자 프로필 조회
    const profileRes = await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
      signal: AbortSignal.timeout(10_000),
    })
    const profileData = await profileRes.json()
    const naverUser = profileData.response

    if (!naverUser?.email) {
      console.error("[naver/callback] 이메일 없음:", profileData)
      return NextResponse.redirect(`${origin}/login?error=auth_failed&detail=${encodeURIComponent("naver_no_email")}`)
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
        console.error("[naver/callback] 기존유저 magiclink 실패:", reLinkError?.message, createRes.error?.message)
        return NextResponse.redirect(`${origin}/login?error=auth_failed&detail=${encodeURIComponent("relink_failed: " + (reLinkError?.message ?? "no_action_link") + " / create: " + (createRes.error?.message ?? ""))}`)
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
      console.error("[naver/callback] 신규유저 magiclink 실패:", linkError?.message)
      return NextResponse.redirect(`${origin}/login?error=auth_failed&detail=${encodeURIComponent("magiclink_failed: " + (linkError?.message ?? "no_action_link"))}`)
    }

    return NextResponse.redirect(linkData.properties.action_link)
  } catch (e) {
    console.error("[naver/callback] 예외:", String(e))
    return NextResponse.redirect(`${origin}/login?error=auth_failed&detail=${encodeURIComponent("exception: " + String(e))}`)
  }
}
