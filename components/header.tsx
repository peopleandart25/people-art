"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Menu, User, LogIn, Coins, Crown, Shield, Briefcase, Bell, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

const navItems = [
  { label: "피플앤아트", href: "/about" },
  { label: "소식", href: "/news" },
  { label: "캐스팅", href: "/casting" },
  { label: "이벤트", href: "/events" },
  { label: "아티스트", href: "/artists" },
  { label: "투어리스트", href: "/tour" },
  { label: "프로필 지원", href: "/support" },
  { label: "제휴업체", href: "/partners" },
  { label: "멤버십", href: "/membership" },
  { label: "후기", href: "/reviews" },
]

type Notification = {
  id: string
  title: string
  message: string | null
  type: string
  is_read: boolean
  created_at: string
}

export function Header() {
  const router = useRouter()
  const { isLoggedIn, isPremium, isAdmin, isCdApproved, profile, signOut } = useAuth()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [bellOpen, setBellOpen] = useState(false)

  const fetchNotifications = async () => {
    const res = await fetch("/api/notifications")
    if (res.ok) {
      const data = await res.json()
      setNotifications(data.items ?? [])
      setUnreadCount(data.unread_count ?? 0)
    }
  }

  const fetchUnreadCount = async () => {
    const res = await fetch("/api/notifications?unread_only=1")
    if (res.ok) {
      const data = await res.json()
      setUnreadCount(data.unread_count ?? 0)
    }
  }

  // 초기 1회 + 5분 간격으로 unread_count만 가져옴 (전체 리스트는 벨 클릭 시 로드)
  useEffect(() => {
    if (!isLoggedIn) return
    fetchUnreadCount()

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchUnreadCount()
      }
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn])

  // 벨 팝오버가 열릴 때만 전체 리스트 fetch
  useEffect(() => {
    if (bellOpen && isLoggedIn) {
      fetchNotifications()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bellOpen, isLoggedIn])

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
    setUnreadCount(0)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  // 비로그인 상태에서도 접근 가능한 공개 페이지 목록
  const publicRoutes = [
    "/",           // 메인 페이지
    "/about",      // 회사소개
    "/news",       // 소식
    "/casting",    // 캐스팅 목록 (상세는 별도 처리)
    "/events",     // 이벤트 목록 (상세는 별도 처리)
    "/artists",    // 아티스트
    "/partners",   // 제휴업체
    "/partnership",// 제휴업체 (별칭)
    "/membership", // 멤버십
    "/reviews",    // 후기
    "/login",      // 로그인
  ]

  // Guest 상태에서 비공개 페이지 접근 시 로그인 페이지로 리다이렉트
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // 공개 페이지는 누구나 접근 가능
    if (publicRoutes.includes(href)) return
    
    // Guest 상태에서 비공개 페이지 접근 차단
    if (!isLoggedIn) {
      e.preventDefault()
      toast({
        title: "로그인이 필요합니다",
        description: "로그인 및 회원가입 후 이용할 수 있습니다.",
        variant: "destructive",
      })
      router.push("/login")
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-16 lg:h-24 max-w-7xl items-center justify-between px-4 lg:px-8">
        {/* Logo - [관리 필드: siteInfo.logo] - 클릭 시 메인 페이지로 이동 */}
        <Link href="/" className="flex items-center shrink-0 mr-4 ml-1">
          <Image
            src="/images/logo.png"
            alt="피플앤아트 로고"
            width={300}
            height={100}
            className="object-contain h-14 lg:h-20 w-auto"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex lg:items-center lg:gap-0">
          {navItems.map((item, index) => (
            <Link
              key={item.href ? item.href : `nav-${index}`}
              href={item.href ? item.href : "#"}
              onClick={(e) => handleNavClick(e, item.href || "#")}
              className="px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary whitespace-nowrap"
            >
              {item.label ? item.label : "메뉴"}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden items-center gap-1 lg:flex shrink-0">
          {isLoggedIn ? (
            <>
              {/* 알림 벨 */}
              <Popover open={bellOpen} onOpenChange={setBellOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-8 w-8">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <span className="text-sm font-semibold">알림</span>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={markAllRead}>
                        모두 읽음
                      </Button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">새 알림이 없습니다.</p>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          className={`flex items-start gap-3 px-4 py-3 border-b last:border-0 ${!n.is_read ? "bg-primary/5" : ""}`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {n.type === "casting_proposal" ? (
                              <Send className="h-4 w-4 text-primary" />
                            ) : (
                              <Bell className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-tight">{n.title}</p>
                            {n.message && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                            )}
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {new Date(n.created_at).toLocaleDateString("ko-KR")}
                            </p>
                          </div>
                          {!n.is_read && (
                            <span className="mt-1.5 h-2 w-2 rounded-full bg-red-500 shrink-0" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {/* 아티스트 뱃지 */}
              {!isAdmin && profile?.role !== "casting_director" && profile?.role !== "sub_admin" && profile?.has_artist_profile && (
                <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-50 mr-1">
                  아티스트
                </Badge>
              )}
              {/* 등급 뱃지 */}
              {isAdmin ? (
                <Badge variant="outline" className="border-red-500 text-red-500 bg-red-50 mr-1">
                  <Shield className="h-3 w-3 mr-1" />
                  관리자
                </Badge>
              ) : isPremium && (
                <Badge variant="outline" className="border-primary text-primary bg-primary/5 mr-1">
                  <Crown className="h-3 w-3 mr-1" />
                  멤버십
                </Badge>
              )}
              {/* 잔여 포인트 표시 */}
              <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1">
                <Coins className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary whitespace-nowrap">
                  {(profile?.points ?? 0).toLocaleString()}P
                </span>
              </div>
              {isAdmin || profile?.role === "sub_admin" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 whitespace-nowrap text-xs px-2"
                  onClick={() => router.push("/admin")}
                >
                  <Shield className="h-3.5 w-3.5" />
                  관리자 패널
                </Button>
              ) : profile?.role === "casting_director" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 whitespace-nowrap text-xs px-2"
                  onClick={() => router.push("/casting-director")}
                  title={isCdApproved ? undefined : "관리자 승인 대기 중"}
                >
                  <Briefcase className="h-3.5 w-3.5" />
                  디렉터 대시보드
                  {!isCdApproved && (
                    <span className="ml-1 text-[10px] text-yellow-600">(승인 대기)</span>
                  )}
                </Button>
              ) : profile ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 whitespace-nowrap text-xs px-2"
                  onClick={() => router.push("/mypage")}
                >
                  <User className="h-3.5 w-3.5" />
                  마이페이지
                </Button>
              ) : (
                <div className="h-8 w-[110px] rounded-md bg-gray-100 animate-pulse" />
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-1 whitespace-nowrap text-xs px-2"
                onClick={() => {
                  signOut()
                  router.push("/")
                }}
              >
                로그아웃
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2"
                onClick={() => router.push("/login")}
              >
                <LogIn className="h-4 w-4" />
                로그인
              </Button>
              <Button
                size="sm"
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => router.push("/login?mode=signup")}
              >
                <User className="h-4 w-4" />
                회원가입
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">메뉴 열기</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] bg-card flex flex-col p-0">
            <SheetTitle className="sr-only">메뉴</SheetTitle>
            <SheetDescription className="sr-only">
              사이트 네비게이션 메뉴입니다.
            </SheetDescription>
            <div className="flex flex-col gap-6 pt-6 px-6 pb-8 overflow-y-auto flex-1">
              <div className="flex items-center">
                <Image
                  src="/images/logo.png"
                  alt="피플앤아트 로고"
                  width={240}
                  height={80}
                  className="object-contain h-12 w-auto"
                />
              </div>
              
              <nav className="flex flex-col gap-1">
                {navItems.map((item, index) => (
                  <Link
                    key={item.href ? item.href : `mobile-nav-${index}`}
                    href={item.href ? item.href : "#"}
                    onClick={(e) => {
                      handleNavClick(e, item.href || "#")
                      // 공개 페이지이거나 로그인 상태면 Sheet 닫기
                      if (isLoggedIn || publicRoutes.includes(item.href || "#")) {
                        setIsOpen(false)
                      }
                    }}
                    className="rounded-lg px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    {item.label ? item.label : "메뉴"}
                  </Link>
                ))}
              </nav>

              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                {isLoggedIn ? (
                  <>
                    {/* 모바일 등급 상태 */}
                    {isAdmin ? (
                      <div className="flex items-center justify-center rounded-lg bg-red-50 border border-red-200 px-4 py-2 mb-2">
                        <Shield className="h-4 w-4 text-red-500 mr-2" />
                        <span className="text-sm font-medium text-red-500">관리자</span>
                      </div>
                    ) : isPremium && (
                      <div className="flex items-center justify-center rounded-lg bg-primary/5 border border-primary/20 px-4 py-2 mb-2">
                        <Crown className="h-4 w-4 text-primary mr-2" />
                        <span className="text-sm font-medium text-primary">프리미엄 멤버십</span>
                      </div>
                    )}
                    {/* 모바일 잔여 포인트 표시 */}
                    <div className="flex items-center justify-between rounded-lg bg-primary/10 px-4 py-3 mb-2">
                      <span className="text-sm text-muted-foreground">잔여 포인트</span>
                      <div className="flex items-center gap-1.5">
                        <Coins className="h-4 w-4 text-primary" />
                        <span className="text-base font-bold text-primary">
                          {(profile?.points ?? 0).toLocaleString()}P
                        </span>
                      </div>
                    </div>
                    {isAdmin || profile?.role === "sub_admin" ? (
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => { setIsOpen(false); router.push("/admin") }}
                      >
                        <Shield className="h-4 w-4" />
                        관리자 패널
                      </Button>
                    ) : profile?.role === "casting_director" ? (
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => { setIsOpen(false); router.push("/casting-director") }}
                      >
                        <Briefcase className="h-4 w-4" />
                        디렉터 대시보드
                        {!isCdApproved && (
                          <span className="ml-auto text-[10px] text-yellow-600">승인 대기</span>
                        )}
                      </Button>
                    ) : profile ? (
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => { setIsOpen(false); router.push("/mypage") }}
                      >
                        <User className="h-4 w-4" />
                        마이페이지
                      </Button>
                    ) : (
                      <div className="h-10 w-full rounded-md bg-gray-100 animate-pulse" />
                    )}
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start gap-2"
                      onClick={() => {
                        setIsOpen(false)
                        signOut()
                        router.push("/")
                      }}
                    >
                      로그아웃
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2"
                      onClick={() => {
                        setIsOpen(false)
                        router.push("/login")
                      }}
                    >
                      <LogIn className="h-4 w-4" />
                      로그인
                    </Button>
                    <Button
                      className="w-full justify-start gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => {
                        setIsOpen(false)
                        router.push("/login?mode=signup")
                      }}
                    >
                      <User className="h-4 w-4" />
                      회원가입
                    </Button>
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
