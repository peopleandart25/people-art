import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { signOnboardedCookie, verifyOnboardedCookie, type OnboardedRole } from '@/lib/auth/onboarded-cookie'

// service role client 팩토리 (요청당 최대 1회 생성)
function makeServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return [] }, setAll() {} } }
  )
}

const ONBOARDED_COOKIE = 'pa_onboarded'
const ONBOARDED_MAX_AGE = 60 * 60 * 24 * 1 // 1일 (역할 변경 시 drift 최소화)

function setOnboardedCookie(
  response: NextResponse,
  role: OnboardedRole,
  userId: string,
) {
  // async 래퍼: fire-and-forget이 아니라 호출부에서 await
  return signOnboardedCookie(role, userId).then((value) => {
    response.cookies.set(ONBOARDED_COOKIE, value, {
      path: '/',
      maxAge: ONBOARDED_MAX_AGE,
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    })
  })
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

  // 이미 온보딩 완료된 사용자는 서명 쿠키로 우회 (DB 쿼리 절약)
  const rawOnboardedCookie = user
    ? request.cookies.get(ONBOARDED_COOKIE)?.value
    : undefined
  const verifiedRole: OnboardedRole | null = user && rawOnboardedCookie
    ? await verifyOnboardedCookie(rawOnboardedCookie, user.id)
    : null

  // 캐스팅 디렉터가 아티스트 온보딩(/onboarding)에 접근하면 디렉터 대시보드로 강제 리다이렉트
  // 쿠키 엄격 비교: '/onboarding' 또는 '/onboarding/'로 시작하는 경로만
  const isArtistOnboardingPath =
    request.nextUrl.pathname === '/onboarding' || request.nextUrl.pathname.startsWith('/onboarding/')
  const isDirectorOnboardingPath =
    request.nextUrl.pathname.startsWith('/onboarding/director') ||
    request.nextUrl.pathname.startsWith('/onboarding/select')
  if (user && isArtistOnboardingPath && !isDirectorOnboardingPath) {
    if (verifiedRole === 'd') {
      const url = request.nextUrl.clone()
      url.pathname = '/casting-director'
      url.search = ''
      return NextResponse.redirect(url)
    }
    // 쿠키 검증 실패 or 다른 역할이면 DB에서 role 재확인
    if (verifiedRole !== 'a' && verifiedRole !== 's') {
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

  // 온보딩 강제 (신규 유저만) — 정확한 경로 매칭
  const onboardingExemptPrefixes = ['/onboarding/', '/api/', '/auth/', '/_next/']
  const onboardingExemptExact = new Set(['/onboarding', '/login', '/favicon.ico'])
  const pathname = request.nextUrl.pathname
  const isExempt =
    onboardingExemptExact.has(pathname) ||
    onboardingExemptPrefixes.some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/admin') // admin은 위에서 별도 보호

  if (user && !isExempt && !verifiedRole) {
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
          url.pathname = '/onboarding/director'
          return NextResponse.redirect(url)
        } else if (request.nextUrl.pathname.startsWith('/onboarding')) {
          url.pathname = '/'
          url.search = ''
          await setOnboardedCookie(supabaseResponse, 'd', user.id)
          return NextResponse.redirect(url)
        }
        await setOnboardedCookie(supabaseResponse, 'd', user.id)
      } else {
        // 일반 유저: phone & artist_profiles 없으면 역할 선택 화면으로
        if (!profile.phone && !artistProfile) {
          const url = request.nextUrl.clone()
          url.pathname = '/onboarding/select'
          return NextResponse.redirect(url)
        }
        await setOnboardedCookie(supabaseResponse, 'a', user.id)
      }
    } else if (profile && skipRoles.includes(profile.role)) {
      await setOnboardedCookie(supabaseResponse, 's', user.id)
    }
  }

  return supabaseResponse
}
