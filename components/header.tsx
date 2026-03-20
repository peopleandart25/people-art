"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Menu, User, LogIn, Coins, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

const navItems = [
  { label: "피플앤아트", href: "/about" },
  { label: "소식", href: "/news" },
  { label: "이벤트", href: "/events" },
  { label: "아티스트", href: "/artists" },
  { label: "투어리스트", href: "/tour" },
  { label: "프로필 지원", href: "/support" },
  { label: "제휴업체", href: "/partners" },
  { label: "멤버십", href: "/membership" },
  { label: "후기", href: "/reviews" },
]

export function Header() {
  const router = useRouter()
  const { isLoggedIn, isPremium, isAdmin, profile, signOut } = useAuth()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)

  // 비로그인 상태에서도 접근 가능한 공개 페이지 목록
  const publicRoutes = [
    "/",           // 메인 페이지
    "/about",      // 회사소개
    "/news",       // 소식
    "/events",     // 이벤트 목록 (상세는 별도 처리)
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
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-4 lg:px-8">
        {/* Logo - [관리 필드: siteInfo.logo] - 클릭 시 메인 페이지로 이동 */}
        <Link href="/" className="flex items-center shrink-0 mr-8 ml-2">
          <Image
            src="/images/logo.png"
            alt="피플앤아트 로고"
            width={300}
            height={100}
            className="object-contain"
            style={{ height: "100px", width: "auto", minHeight: "70px" }}
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex lg:items-center lg:gap-1">
          {navItems.map((item, index) => (
            <Link
              key={item.href ? item.href : `nav-${index}`}
              href={item.href ? item.href : "#"}
              onClick={(e) => handleNavClick(e, item.href || "#")}
              className="px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {item.label ? item.label : "메뉴"}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden items-center gap-2 lg:flex">
          {isLoggedIn ? (
            <>
              {/* 멤버십 뱃지 */}
              {isPremium && (
                <Badge variant="outline" className="border-primary text-primary bg-primary/5 mr-1">
                  <Crown className="h-3 w-3 mr-1" />
                  멤버십
                </Badge>
              )}
              {/* 잔여 포인트 표시 */}
              <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 mr-1">
                <Coins className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">
                  {(profile?.points ?? 0).toLocaleString()}P
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2"
                onClick={() => router.push("/mypage")}
              >
                <User className="h-4 w-4" />
                마이페이지
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
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
                onClick={() => router.push("/login")}
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
          <SheetContent side="right" className="w-[300px] bg-card">
            <SheetTitle className="sr-only">메뉴</SheetTitle>
            <SheetDescription className="sr-only">
              사이트 네비게이션 메뉴입니다.
            </SheetDescription>
            <div className="flex flex-col gap-6 pt-6">
              <div className="flex items-center">
                <Image
                  src="/images/logo.png"
                  alt="피플앤아트 로고"
                  width={240}
                  height={80}
                  className="object-contain"
                  style={{ height: "80px", width: "auto", minHeight: "60px" }}
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
                    {/* 모바일 멤버십 상태 */}
                    {isPremium && (
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
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2"
                      onClick={() => {
                        setIsOpen(false)
                        router.push("/mypage")
                      }}
                    >
                      <User className="h-4 w-4" />
                      마이페이지
                    </Button>
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
                        router.push("/login")
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
