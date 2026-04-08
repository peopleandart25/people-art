import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// service role client 팩토리 (요청당 최대 1회 생성)
function makeServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return [] }, setAll() {} } }
  )
}

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
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirectTo', '/admin')
      return NextResponse.redirect(url)
    }

    const serviceClient = makeServiceClient()
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'sub_admin'].includes(profile.role)) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      url.search = ''
      return NextResponse.redirect(url)
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

  // 온보딩 강제 (신규 유저만) — /onboarding/director·select, api/auth/login/admin 경로는 제외
  const onboardingExempt = ['/onboarding/director', '/onboarding/select', '/api/', '/auth/', '/login', '/admin', '/_next/', '/favicon']
  const isExempt = onboardingExempt.some(p => request.nextUrl.pathname.startsWith(p))
  if (user && !isExempt) {
    const serviceClient = makeServiceClient()
    const [{ data: profile }, { data: artistProfile }] = await Promise.all([
      serviceClient.from('profiles').select('phone, role').eq('id', user.id).single(),
      serviceClient.from('artist_profiles').select('user_id').eq('user_id', user.id).maybeSingle(),
    ])

    const skipRoles = ['admin', 'sub_admin']
    if (profile && !skipRoles.includes(profile.role)) {
      if (profile.role === 'casting_director') {
        const url = request.nextUrl.clone()
        if (!profile.phone) {
          // 캐스팅 디렉터: phone 없으면 디렉터 온보딩으로
          url.pathname = '/onboarding/director'
          return NextResponse.redirect(url)
        } else if (request.nextUrl.pathname.startsWith('/onboarding')) {
          // 이미 온보딩 완료된 캐스팅 디렉터가 /onboarding 접근 시 홈으로
          url.pathname = '/'
          url.search = ''
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
