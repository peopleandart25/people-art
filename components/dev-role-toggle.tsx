"use client"

import { useState, useEffect } from "react"
import { useUserSafe, UserStatus, getStatusLabel } from "@/contexts/user-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, ChevronUp, ChevronDown, User, Crown, Shield, LogOut } from "lucide-react"

// 개발/테스트용 등급 토글 컴포넌트
// 실제 배포 시에는 이 컴포넌트를 제거하거나 환경 변수로 숨겨야 합니다
export function DevRoleToggle() {
  const { status, setStatus } = useUserSafe()
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  const roles: { value: UserStatus; label: string; icon: React.ReactNode; color: string }[] = [
    { value: "guest", label: "비로그인", icon: <LogOut className="h-3.5 w-3.5" />, color: "bg-gray-500" },
    { value: "basic", label: "일반 회원", icon: <User className="h-3.5 w-3.5" />, color: "bg-blue-500" },
    { value: "premium", label: "멤버십 회원", icon: <Crown className="h-3.5 w-3.5" />, color: "bg-amber-500" },
    { value: "admin", label: "관리자", icon: <Shield className="h-3.5 w-3.5" />, color: "bg-red-500" },
  ]

  const currentRole = roles.find(r => r.value === status) || roles[0]

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {/* 토글 버튼 */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="shadow-lg border-2 bg-background hover:bg-muted gap-2"
      >
        <Settings className="h-4 w-4 animate-spin-slow" />
        <Badge variant="secondary" className={`${currentRole.color} text-white text-xs`}>
          {currentRole.label}
        </Badge>
        {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
      </Button>

      {/* 등급 선택 패널 */}
      {isOpen && (
        <div className="absolute bottom-12 right-0 w-48 bg-card border rounded-lg shadow-xl p-2 space-y-1">
          <div className="text-xs text-muted-foreground px-2 py-1 border-b mb-1">
            테스트용 등급 전환
          </div>
          {roles.map((role) => (
            <button
              key={role.value}
              onClick={() => {
                setStatus(role.value)
                setIsOpen(false)
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                status === role.value
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              <span className={`p-1 rounded ${role.color} text-white`}>
                {role.icon}
              </span>
              {role.label}
              {status === role.value && (
                <span className="ml-auto text-xs text-primary">현재</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
