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
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
