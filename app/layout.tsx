import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { UserProvider } from '@/contexts/user-context'
import { AuthProvider } from '@/contexts/auth-context'
import { RootLayoutShell } from '@/components/root-layout-shell'
import './globals.css'

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-kr",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: '피플앤아트 | PEOPLE & ART',
  description: '프로필이 캐스팅으로 연결되는 플랫폼 - 배우의 프로필이 실제 캐스팅 현장에 도달할 수 있도록 설계된 프로필 전달 및 기회 연결 플랫폼',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKR.variable} font-sans antialiased`}>
        <AuthProvider>
          <UserProvider>
            <RootLayoutShell>
              {children}
            </RootLayoutShell>
          </UserProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
