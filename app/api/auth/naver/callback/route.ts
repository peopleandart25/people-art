import { NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")

  let redirectTo = "/"
  try {
    const parsed = JSON.parse(decodeURIComponent(state ?? "{}"))
    redirectTo = parsed.redirectTo ?? "/"
  } catch {}

  if (!code) return NextResponse.redirect(`${origin}/login?error=auth_failed`)

  try {
    // 1. 네이버 액세스 토큰 교환
    const tokenRes = await fetch(
      "https://nid.naver.com/oauth2.0/token?" +
        new URLSearchParams({
          grant_type: "authorization_code",
          client_id: process.env.NAVER_CLIENT_ID!,
          client_secret: process.env.NAVER_CLIENT_SECRET!,
          code,
          state: state ?? "",
        }),
      { method: "GET" }
    )
    const tokenData = await tokenRes.json()
    console.log("[naver-cb] step1 token:", JSON.stringify({ access_token: !!tokenData.access_token, error: tokenData.error }))
    if (!tokenData.access_token) throw new Error(`No access token: ${JSON.stringify(tokenData)}`)

    // 2. 네이버 사용자 프로필 조회
    const profileRes = await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const profileData = await profileRes.json()
    const naverUser = profileData.response
    console.log("[naver-cb] step2 profile:", JSON.stringify({ email: naverUser?.email, name: naverUser?.name }))

    if (!naverUser?.email) return NextResponse.redirect(`${origin}/login?error=auth_failed`)

    // 3. Supabase admin 클라이언트
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 4. 신규 유저면 생성 (기존 유저면 무시)
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
    console.log("[naver-cb] step4 createUser:", JSON.stringify({ error: createRes.error?.message }))

    // 5. Magic link 생성으로 세션 발급
    const magicRedirectTo = `${origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`
    console.log("[naver-cb] step5 generateLink redirectTo:", magicRedirectTo)
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email: naverUser.email,
      options: { redirectTo: magicRedirectTo },
    })
    console.log("[naver-cb] step5 result:", JSON.stringify({ action_link: !!linkData?.properties?.action_link, error: linkError?.message }))

    if (linkError || !linkData?.properties?.action_link) throw linkError ?? new Error("No action_link")

    // 6. Supabase magic link로 리다이렉트 → 세션 자동 처리
    return NextResponse.redirect(linkData.properties.action_link)
  } catch (err) {
    console.error("[naver-cb] ERROR:", err)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }
}
