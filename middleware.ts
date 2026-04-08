import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') ?? ''
  const isAdminSubdomain = hostname.startsWith('admin.')

  if (isAdminSubdomain) {
    const pathname = request.nextUrl.pathname
    const adminPath = '/admin' + (pathname === '/' ? '' : pathname)
    const redirectUrl = new URL(`https://people-art.co.kr${adminPath}${request.nextUrl.search}`)
    return NextResponse.redirect(redirectUrl)
  }

  return await updateSession(request)
}

export const config = {
  // /api/* 는 라우트 핸들러가 자체적으로 auth를 처리하므로 미들웨어에서 제외
  // (매 API 호출마다 불필요한 supabase.auth.getUser() 중복 호출 제거)
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
