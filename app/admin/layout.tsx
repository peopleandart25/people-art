"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Users,
  Star,
  Calendar,
  Newspaper,
  Map,
  Building,
  MessageSquare,
  Building2,
  FileText,
  Image,
  Settings,
  Home,
  Film,
} from "lucide-react"

const menuItems = [
  { label: "대시보드", href: "/admin", icon: LayoutDashboard, adminOnly: true },
  { label: "회원 관리", href: "/admin/users", icon: Users, adminOnly: true },
  { label: "배우 관리", href: "/admin/artists", icon: Star, adminOnly: false },
  { label: "이벤트 관리", href: "/admin/events", icon: Calendar, adminOnly: false },
  { label: "캐스팅 관리", href: "/admin/casting", icon: Film, adminOnly: false },
  { label: "뉴스 관리", href: "/admin/news", icon: Newspaper, adminOnly: false },
  { label: "투어 관리", href: "/admin/tours", icon: Map, adminOnly: false },
  { label: "파트너 관리", href: "/admin/partners", icon: Building, adminOnly: true },
  { label: "후기 관리", href: "/admin/reviews", icon: MessageSquare, adminOnly: false },
  { label: "지원기관 관리", href: "/admin/agencies", icon: Building2, adminOnly: false },
  { label: "양식 관리", href: "/admin/template", icon: FileText, adminOnly: false },
  { label: "포트폴리오 관리", href: "/admin/portfolios", icon: FileText, adminOnly: false },
  { label: "배너 관리", href: "/admin/banners", icon: Image, adminOnly: true },
  { label: "설정", href: "/admin/settings", icon: Settings, adminOnly: true },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const canAccess = profile?.role === "admin" || profile?.role === "sub_admin"
  const isAdmin = profile?.role === "admin"

  useEffect(() => {
    if (!loading && !canAccess) {
      if (typeof window !== "undefined" && window.location.hostname.startsWith("admin.")) {
        window.location.href = "https://people-art.co.kr/login"
      } else {
        router.replace("/")
      }
    }
    // sub_admin이 admin 전용 페이지에 직접 접근 시 차단
    if (!loading && canAccess && !isAdmin) {
      const current = menuItems.find(m => m.href === "/admin" ? pathname === "/admin" : pathname.startsWith(m.href))
      if (current?.adminOnly) {
        router.replace("/admin/events")
      }
    }
  }, [loading, canAccess, isAdmin, pathname, router])

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

  if (!canAccess) {
    return null
  }

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin"
    return pathname.startsWith(href)
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 사이드바 */}
      <aside
        className={`${isCollapsed ? "w-14" : "w-56"} bg-gray-900 text-white flex flex-col fixed top-0 left-0 h-full z-10 transition-all duration-300`}
      >
        {/* 로고 */}
        <div className="px-3 py-5 border-b border-gray-700 flex items-center justify-between gap-2">
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="text-base font-bold text-white leading-tight truncate">피플앤아트</h1>
              <p className="text-xs text-gray-400 mt-0.5">관리자 패널</p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="shrink-0 flex items-center justify-center w-7 h-7 rounded-md bg-gray-700 text-white hover:bg-orange-500 transition-colors"
            title={isCollapsed ? "메뉴 펼치기" : "메뉴 접기"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* 메뉴 */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {menuItems.filter(item => isAdmin || !item.adminOnly).map((item) => {
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center ${isCollapsed ? "px-0 justify-center" : "px-3 gap-2"} py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-orange-500 text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!isCollapsed && item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* 하단: 관리자 배지 + 로그아웃 */}
        <div className={`px-2 py-4 border-t border-gray-700 space-y-3 ${isCollapsed ? "flex flex-col items-center" : ""}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-2 px-2">
              <Badge className="bg-orange-500 text-white text-xs border-0">관리자</Badge>
            </div>
          )}
          <Link href="/" title={isCollapsed ? "사용자 패널" : undefined}>
            <Button
              variant="outline"
              size="sm"
              className={`${isCollapsed ? "w-9 h-9 p-0" : "w-full text-xs"} text-gray-300 border-gray-600 hover:bg-gray-800 hover:text-white bg-transparent`}
            >
              <Home className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span className="ml-1">사용자 패널</span>}
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className={`${isCollapsed ? "w-9 h-9 p-0" : "w-full text-xs"} text-gray-300 border-gray-600 hover:bg-gray-800 hover:text-white bg-transparent`}
            onClick={() => signOut()}
            title={isCollapsed ? "로그아웃" : undefined}
          >
            {isCollapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            ) : "로그아웃"}
          </Button>
        </div>
      </aside>

      {/* 메인 컨텐츠 */}
      <main className={`flex-1 ${isCollapsed ? "ml-14" : "ml-56"} min-h-screen transition-all duration-300`}>
        {children}
      </main>
    </div>
  )
}
