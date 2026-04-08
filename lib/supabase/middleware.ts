import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // /admin 경로 보호 - 관리자만 접근 가능
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login?redirectTo=/admin', 'https://people-art.co.kr'))
    }

    // DB에서 role 확인 (RLS 우회를 위해 service role 사용)
    const serviceClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return [] },
          setAll() {},
        },
      }
    )
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'sub_admin'].includes(profile.role)) {
      return NextResponse.redirect(new URL('/', 'https://people-art.co.kr'))
    }
  }

  // /mypage, /onboarding 경로 보호 - 로그인 필요
  const protectedPaths = ['/mypage', '/onboarding']
  if (protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
  }

  // 로그인 유저가 phone 미등록 + artist_profiles 없을 시 온보딩 강제 (신규 유저만)
  const onboardingExempt = ['/onboarding', '/api/', '/auth/', '/login', '/admin', '/_next/', '/favicon']
  const isExempt = onboardingExempt.some(p => request.nextUrl.pathname.startsWith(p))
  if (user && !isExempt) {
    const phoneClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll() { return [] }, setAll() {} } }
    )
    const [{ data: profile }, { data: artistProfile }] = await Promise.all([
      phoneClient.from('profiles').select('phone, role').eq('id', user.id).single(),
      phoneClient.from('artist_profiles').select('user_id').eq('user_id', user.id).maybeSingle(),
    ])

    // 관리자/서브관리자는 온보딩 강제 제외
    const skipRoles = ['admin', 'sub_admin']
    if (profile && !skipRoles.includes(profile.role)) {
      if (profile.role === 'casting_director') {
        // 캐스팅 디렉터: phone 없으면 디렉터 온보딩으로
        if (!profile.phone) {
          const url = request.nextUrl.clone()
          url.pathname = '/onboarding/director'
          return NextResponse.redirect(url)
        }
      } else {
        // 일반 유저: phone & artist_profiles 없으면 역할 선택 화면으로
        if (!profile.phone && !artistProfile) {
          const url = request.nextUrl.clone()
          url.pathname = '/onboarding/select'
          return NextResponse.redirect(url)
        }
      }
    }
  }

  return supabaseResponse
}
