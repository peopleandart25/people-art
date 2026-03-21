import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const MAIN_SITE = 'https://people-art.co.kr'

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') ?? ''
  const isAdminSubdomain = hostname.startsWith('admin.')

  if (isAdminSubdomain) {
    const pathname = request.nextUrl.pathname

    if (!pathname.startsWith('/admin')) {
      const adminUrl = request.nextUrl.clone()
      adminUrl.pathname = '/admin' + (pathname === '/' ? '' : pathname)

      // admin URL로 세션 체크 실행
      const adminRequest = new NextRequest(adminUrl, { headers: request.headers })
      const sessionResponse = await updateSession(adminRequest)

      // 인증 실패(로그인 필요 or 권한 없음) → 메인 사이트로 리다이렉트
      if (sessionResponse.status >= 300 && sessionResponse.status < 400) {
        const location = sessionResponse.headers.get('location') ?? '/'
        const redirectUrl = location.startsWith('http')
          ? location
          : `${MAIN_SITE}${location}`
        return NextResponse.redirect(redirectUrl)
      }

      // 인증 통과 → rewrite + 세션 쿠키 복사
      const rewriteResponse = NextResponse.rewrite(adminUrl)
      sessionResponse.cookies.getAll().forEach(cookie => {
        rewriteResponse.cookies.set(cookie.name, cookie.value, cookie)
      })
      return rewriteResponse
    }
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
