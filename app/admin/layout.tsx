"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const menuItems = [
  { label: "대시보드", href: "/admin" },
  { label: "회원 관리", href: "/admin/users" },
  { label: "이벤트 관리", href: "/admin/events" },
  { label: "뉴스 관리", href: "/admin/news" },
  { label: "투어 관리", href: "/admin/tours" },
  { label: "파트너 관리", href: "/admin/partners" },
  { label: "후기 관리", href: "/admin/reviews" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/")
    }
  }, [loading, isAdmin, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">확인 중...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin"
    return pathname.startsWith(href)
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 사이드바 */}
      <aside className="w-56 bg-gray-900 text-white flex flex-col fixed top-0 left-0 h-full z-10">
        {/* 로고 */}
        <div className="px-5 py-6 border-b border-gray-700">
          <h1 className="text-base font-bold text-white leading-tight">피플앤아트</h1>
          <p className="text-xs text-gray-400 mt-0.5">관리자 패널</p>
        </div>

        {/* 메뉴 */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-orange-500 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* 하단: 관리자 배지 + 로그아웃 */}
        <div className="px-4 py-4 border-t border-gray-700 space-y-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-orange-500 text-white text-xs border-0">관리자</Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-gray-300 border-gray-600 hover:bg-gray-800 hover:text-white bg-transparent text-xs"
            onClick={() => signOut()}
          >
            로그아웃
          </Button>
        </div>
      </aside>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 ml-56 min-h-screen">
        {children}
      </main>
    </div>
  )
}
