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

  // 캐스팅 디렉터가 아티스트 온보딩(/onboarding)에 접근하면 디렉터 대시보드로 강제 리다이렉트
  // 쿠키 우회와 무관하게 항상 체크 (쿠키 prefix가 'd:'이거나, DB 조회 필요)
  const isArtistOnboardingPath =
    request.nextUrl.pathname === '/onboarding' || request.nextUrl.pathname.startsWith('/onboarding/')
  const isDirectorOnboardingPath =
    request.nextUrl.pathname.startsWith('/onboarding/director') ||
    request.nextUrl.pathname.startsWith('/onboarding/select')
  if (user && isArtistOnboardingPath && !isDirectorOnboardingPath) {
    const cookieVal = request.cookies.get('pa_onboarded')?.value
    if (cookieVal?.startsWith('d:') && cookieVal.endsWith(`:${user.id}`)) {
      const url = request.nextUrl.clone()
      url.pathname = '/casting-director'
      url.search = ''
      return NextResponse.redirect(url)
    }
    // 쿠키가 없거나 prefix가 'd:'가 아니면 DB에서 role 확인
    if (!cookieVal?.endsWith(`:${user.id}`)) {
      const sc = makeServiceClient()
      const { data: p } = await sc.from('profiles').select('role').eq('id', user.id).single()
      if (p && (p as { role: string }).role === 'casting_director') {
        const url = request.nextUrl.clone()
        url.pathname = '/casting-director'
        url.search = ''
        return NextResponse.redirect(url)
      }
    }
  }

  // 온보딩 강제 (신규 유저만) — /onboarding/director·select, api/auth/login/admin 경로는 제외
  const onboardingExempt = ['/onboarding/director', '/onboarding/select', '/api/', '/auth/', '/login', '/admin', '/_next/', '/favicon']
  const isExempt = onboardingExempt.some(p => request.nextUrl.pathname.startsWith(p))
  // 이미 온보딩 완료된 사용자는 쿠키로 우회 (DB 쿼리 2개 절약)
  // 쿠키 형식: '<role>:<userId>' — 사용자 변경 시 자동으로 무효화됨
  const onboardedCookie = request.cookies.get('pa_onboarded')?.value
  const cookieMatchesUser = !!user && !!onboardedCookie && onboardedCookie.endsWith(`:${user.id}`)
  if (user && !isExempt && !cookieMatchesUser) {
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
          supabaseResponse.cookies.set('pa_onboarded', `d:${user.id}`, { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' })
          return NextResponse.redirect(url)
        }
        // 온보딩 완료된 디렉터: 쿠키 마킹
        supabaseResponse.cookies.set('pa_onboarded', `d:${user.id}`, { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' })
      } else {
        // 일반 유저: phone & artist_profiles 없으면 역할 선택 화면으로
        if (!profile.phone && !artistProfile) {
          const url = request.nextUrl.clone()
          url.pathname = '/onboarding/select'
          return NextResponse.redirect(url)
        }
        // 온보딩 완료된 일반 유저: 쿠키 마킹
        supabaseResponse.cookies.set('pa_onboarded', `a:${user.id}`, { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' })
      }
    } else if (profile && skipRoles.includes(profile.role)) {
      // admin/sub_admin: 온보딩 검사 스킵 마킹
      supabaseResponse.cookies.set('pa_onboarded', `s:${user.id}`, { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' })
    }
  }

  return supabaseResponse
}
