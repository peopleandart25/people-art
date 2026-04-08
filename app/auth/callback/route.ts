import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const redirectTo = searchParams.get("redirectTo") ?? "/"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const serviceClient = createServiceClient()

        // 소셜 로그인 중복 계정 방지: 같은 이메일의 다른 계정이 있으면 신규 계정 삭제 후 안내
        if (user.email) {
          // created_at === last_sign_in_at: 처음 로그인한 신규 유저 (시간 diff 비교보다 정확)
          const isNewUser = user.created_at === user.last_sign_in_at
          if (isNewUser) {
            const { data: existingProfile } = await serviceClient
              .from("profiles")
              .select("id")
              .eq("email", user.email)
              .neq("id", user.id)
              .maybeSingle()

            if (existingProfile) {
              // 중복 계정 삭제 후 에러 안내
              await serviceClient.auth.admin.deleteUser(user.id)
              return NextResponse.redirect(
                `${origin}/login?error=email_already_exists`
              )
            }
          }
        }

        // 온보딩 여부 확인
        const [{ data: profile }, { data: artistProfile }] = await Promise.all([
          serviceClient.from("profiles").select("role, phone").eq("id", user.id).maybeSingle(),
          serviceClient.from("artist_profiles").select("id").eq("user_id", user.id).maybeSingle(),
        ])

        const skipRoles = ["admin", "sub_admin"]
        if (skipRoles.includes(profile?.role ?? "")) {
          return NextResponse.redirect(`${origin}${redirectTo}`)
        }

        if (profile?.role === "casting_director") {
          if (!profile.phone) {
            return NextResponse.redirect(`${origin}/onboarding/director`)
          }
          return NextResponse.redirect(`${origin}${redirectTo}`)
        }

        if (!artistProfile) {
          return NextResponse.redirect(`${origin}/onboarding/select`)
        }
      }

      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
