"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pencil, Download } from "lucide-react"

// ─── 타입 ───────────────────────────────────────────────────────────────────

type ArtistProfile = {
  birth_date: string | null
  gender: string | null
}

type Membership = {
  status: string | null
  expires_at: string | null
}

type Profile = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  role: string
  status: string
  status_reason: string | null
  activity_name: string | null
  created_at: string | null
  updated_at: string | null
  artist_profiles: ArtistProfile[] | null
  memberships: Membership[] | null
}

type Payment = {
  id: string
  amount: number
  payment_method: string | null
  status: string | null
  created_at: string | null
}

type SupportHistory = {
  id: string
  sent_at: string | null
  agency_name: string
  agency_category: string
}

// ─── 상수 ───────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ["전체", "활성", "비활성", "정지", "탈퇴"] as const
const MEMBERSHIP_OPTIONS = ["전체", "활성", "비활성"] as const

const STATUS_BADGE: Record<string, string> = {
  활성: "bg-green-100 text-green-700 border-green-200",
  비활성: "bg-yellow-100 text-yellow-700 border-yellow-200",
  탈퇴: "bg-red-100 text-red-700 border-red-200",
  정지: "bg-gray-100 text-gray-600 border-gray-200",
}

const MEMBERSHIP_BADGE: Record<string, string> = {
  활성: "bg-blue-100 text-blue-700 border-blue-200",
  비활성: "bg-gray-100 text-gray-500 border-gray-200",
}

const ROLE_OPTIONS = ["user", "casting_director", "sub_admin", "admin"] as const

const ROLE_LABELS: Record<string, string> = {
  user: "User",
  basic: "User",
  casting_director: "캐스팅 디렉터",
  sub_admin: "Sub Admin",
  admin: "Admin",
}

// ─── 헬퍼 ───────────────────────────────────────────────────────────────────

function getMembershipStatus(memberships: Membership[] | null): string {
  const m = memberships?.[0]
  if (!m) return "비활성"
  if (m.status === "active") return "활성"
  return "비활성"
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString("ko-KR")
}

function formatAmount(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원"
}

// ─── CSV 내보내기 ────────────────────────────────────────────────────────────

function downloadCSV(rows: Profile[]) {
  const headers = ["ID", "이름", "이메일", "전화번호", "상태", "멤버십", "가입일"]
  const lines = rows.map((p) => [
    p.id.slice(0, 8),
    p.name ?? "",
    p.email ?? "",
    p.phone ?? "",
    p.status,
    getMembershipStatus(p.memberships),
    formatDate(p.created_at),
  ])

  const csv = [headers, ...lines]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n")

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `users_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [filtered, setFiltered] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 검색 필터
  const [filterName, setFilterName] = useState("")
  const [filterActivity, setFilterActivity] = useState("")
  const [filterPhone, setFilterPhone] = useState("")
  const [filterEmail, setFilterEmail] = useState("")
  const [filterStatus, setFilterStatus] = useState("전체")
  const [filterMembership, setFilterMembership] = useState("전체")

  // 모달
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newRole, setNewRole] = useState("")
  const [newStatus, setNewStatus] = useState("")
  const [newStatusReason, setNewStatusReason] = useState("")
  const [updating, setUpdating] = useState(false)

  // 활동내역
  const [payments, setPayments] = useState<Payment[]>([])
  const [eventCount, setEventCount] = useState(0)
  const [referralCount, setReferralCount] = useState(0)
  const [activityLoading, setActivityLoading] = useState(false)
  const [supportHistory, setSupportHistory] = useState<SupportHistory[]>([])

  useEffect(() => {
    fetchProfiles()
  }, [])

  async function fetchProfiles() {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        id, name, email, phone, role, status, status_reason, activity_name,
        created_at, updated_at,
        artist_profiles(birth_date, gender),
        memberships(status, expires_at)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setProfiles((data ?? []) as Profile[])
      setFiltered((data ?? []) as Profile[])
    }
    setLoading(false)
  }

  const applyFilters = useCallback(() => {
    let result = profiles

    if (filterName.trim()) {
      const q = filterName.trim().toLowerCase()
      result = result.filter((p) => (p.name ?? "").toLowerCase().includes(q))
    }
    if (filterActivity.trim()) {
      const q = filterActivity.trim().toLowerCase()
      result = result.filter((p) => (p.activity_name ?? "").toLowerCase().includes(q))
    }
    if (filterPhone.trim()) {
      const q = filterPhone.trim()
      result = result.filter((p) => (p.phone ?? "").includes(q))
    }
    if (filterEmail.trim()) {
      const q = filterEmail.trim().toLowerCase()
      result = result.filter((p) => (p.email ?? "").toLowerCase().includes(q))
    }

    if (filterStatus !== "전체") {
      result = result.filter((p) => p.status === filterStatus)
    }
    if (filterMembership !== "전체") {
      result = result.filter((p) => getMembershipStatus(p.memberships) === filterMembership)
    }

    setFiltered(result)
  }, [profiles, filterName, filterActivity, filterPhone, filterEmail, filterStatus, filterMembership])

  function handleSearch() {
    applyFilters()
  }

  function handleResetFilters() {
    setFilterName("")
    setFilterActivity("")
    setFilterPhone("")
    setFilterEmail("")
    setFilterStatus("전체")
    setFilterMembership("전체")
    setFiltered(profiles)
  }

  async function openDialog(user: Profile) {
    setSelectedUser(user)
    setNewRole(user.role)
    setNewStatus(user.status)
    setNewStatusReason(user.status_reason ?? "")
    setDialogOpen(true)
    fetchActivity(user.id)
  }

  async function fetchActivity(userId: string) {
    setActivityLoading(true)
    const supabase = createClient()

    const [eventsRes, profileRes, paymentsRes] = await Promise.all([
      supabase
        .from("event_applications")
        .select("count", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", userId)
        .single(),
      supabase
        .from("payments")
        .select("id, amount, payment_method, status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ])

    setEventCount(eventsRes.count ?? 0)
    setPayments((paymentsRes.data ?? []) as Payment[])

    if (profileRes.data?.referral_code) {
      const { count } = await supabase
        .from("profiles")
        .select("count", { count: "exact", head: true })
        .eq("referred_by", profileRes.data.referral_code)
      setReferralCount(count ?? 0)
    } else {
      setReferralCount(0)
    }

    const supportRes = await supabase
      .from("support_history")
      .select("id, sent_at, support_agencies(name, category)")
      .eq("user_id", userId)
      .order("sent_at", { ascending: false })
    const supportItems = ((supportRes.data ?? []) as any[]).map(r => ({
      id: r.id,
      sent_at: r.sent_at,
      agency_name: r.support_agencies?.name ?? "-",
      agency_category: r.support_agencies?.category ?? "-",
    }))
    setSupportHistory(supportItems)

    setActivityLoading(false)
  }

  async function handleDeleteUser() {
    if (!selectedUser) return
    if (!confirm(`[${selectedUser.name ?? selectedUser.email}] 회원의 모든 데이터를 삭제합니다.\n이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?`)) return

    setUpdating(true)
    const res = await fetch(`/api/admin/users/${selectedUser.id}`, { method: "DELETE" })
    if (!res.ok) {
      const err = await res.json()
      setError(err.error ?? "삭제 실패")
    } else {
      await fetchProfiles()
      setDialogOpen(false)
    }
    setUpdating(false)
  }

  async function handleSave() {
    if (!selectedUser) return
    setUpdating(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("profiles")
      .update({
        role: newRole,
        status: newStatus,
        status_reason: newStatusReason || null,
      })
      .eq("id", selectedUser.id)

    if (error) {
      setError(error.message)
    } else {
      await fetchProfiles()
      setDialogOpen(false)
    }
    setUpdating(false)
  }

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">회원 관리</h1>
        <p className="text-sm text-gray-500 mt-1">전체 회원 목록 조회 및 상태/역할 관리</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 검색 필터 */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex flex-col gap-1 min-w-[120px]">
            <Label className="text-xs text-gray-500">이름</Label>
            <Input
              placeholder="이름 검색"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1 min-w-[120px]">
            <Label className="text-xs text-gray-500">활동명</Label>
            <Input
              placeholder="활동명 검색"
              value={filterActivity}
              onChange={(e) => setFilterActivity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1 min-w-[130px]">
            <Label className="text-xs text-gray-500">전화번호</Label>
            <Input
              placeholder="전화번호 검색"
              value={filterPhone}
              onChange={(e) => setFilterPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1 min-w-[160px]">
            <Label className="text-xs text-gray-500">이메일</Label>
            <Input
              placeholder="이메일 검색"
              value={filterEmail}
              onChange={(e) => setFilterEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1 min-w-[110px]">
            <Label className="text-xs text-gray-500">상태</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1 min-w-[110px]">
            <Label className="text-xs text-gray-500">멤버십 상태</Label>
            <Select value={filterMembership} onValueChange={setFilterMembership}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEMBERSHIP_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="h-8 text-xs"
            >
              초기화
            </Button>
            <Button
              size="sm"
              onClick={handleSearch}
              className="h-8 text-xs bg-orange-500 hover:bg-orange-600 text-white"
            >
              검색
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCSV(filtered)}
              className="h-8 text-xs gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              엑셀 다운로드
            </Button>
          </div>
        </div>
      </div>

      {/* 결과 수 */}
      <div className="mb-2 text-sm text-gray-500">
        총 <span className="font-semibold text-gray-800">{filtered.length}</span>명
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-7 h-7 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">이름</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">생년월일 / 성별</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">프로필</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">멤버십</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">전화번호</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">이메일</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">역할</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">상태</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">사유</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">등록일</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">수정일</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((user, idx) => {
                  const ap = user.artist_profiles?.[0]
                  const membershipStatus = getMembershipStatus(user.memberships)
                  const hasArtistProfile = (user.artist_profiles?.length ?? 0) > 0

                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs whitespace-nowrap">
                        {String(idx + 1).padStart(4, "0")}
                      </td>
                      <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">
                        {user.name ?? "-"}
                        {user.activity_name && (
                          <span className="ml-1 text-xs text-gray-400">({user.activity_name})</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {ap ? (
                          <span>{ap.birth_date ?? "-"} / {ap.gender ?? "-"}</span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                          hasArtistProfile
                            ? "bg-blue-50 text-blue-600 border-blue-200"
                            : "bg-gray-50 text-gray-400 border-gray-200"
                        }`}>
                          {hasArtistProfile ? "등록" : "미등록"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                          MEMBERSHIP_BADGE[membershipStatus] ?? "bg-gray-50 text-gray-400 border-gray-200"
                        }`}>
                          {membershipStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{user.phone ?? "-"}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{user.email ?? "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                          user.role === "admin"
                            ? "bg-orange-50 text-orange-600 border-orange-200"
                            : user.role === "sub_admin"
                            ? "bg-amber-50 text-amber-600 border-amber-200"
                            : user.role === "casting_director"
                            ? "bg-purple-50 text-purple-600 border-purple-200"
                            : "bg-gray-50 text-gray-400 border-gray-200"
                        }`}>
                          {ROLE_LABELS[user.role] ?? user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                          STATUS_BADGE[user.status] ?? "bg-gray-50 text-gray-400 border-gray-200"
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-[120px] truncate">
                        {user.status_reason ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(user.created_at)}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(user.updated_at)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openDialog(user)}
                          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-orange-500 transition-colors"
                          title="회원 관리"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={12} className="px-6 py-12 text-center text-sm text-gray-400">
                      조건에 맞는 회원이 없습니다
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 회원 관리 모달 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>회원 관리</DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <Tabs defaultValue="info" className="mt-2">
              <TabsList className="w-full">
                <TabsTrigger value="info" className="flex-1">기본 정보</TabsTrigger>
                <TabsTrigger value="activity" className="flex-1">활동내역</TabsTrigger>
              </TabsList>

              {/* 기본 정보 탭 */}
              <TabsContent value="info" className="space-y-5 pt-4">
                {/* 읽기 전용 정보 */}
                <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">이름</p>
                    <p className="font-medium text-gray-900">{selectedUser.name ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">활동명</p>
                    <p className="text-gray-700">{selectedUser.activity_name ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">이메일</p>
                    <p className="text-gray-700">{selectedUser.email ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">전화번호</p>
                    <p className="text-gray-700">{selectedUser.phone ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">가입일</p>
                    <p className="text-gray-700">{formatDate(selectedUser.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">멤버십</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                      MEMBERSHIP_BADGE[getMembershipStatus(selectedUser.memberships)] ?? "bg-gray-50 text-gray-400 border-gray-200"
                    }`}>
                      {getMembershipStatus(selectedUser.memberships)}
                    </span>
                  </div>
                </div>

                {/* 역할 변경 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">역할</Label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((r) => (
                        <SelectItem key={r} value={r}>{ROLE_LABELS[r] ?? r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 상태 변경 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">상태</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.slice(1).map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 사유 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    사유
                    <span className="ml-1 text-xs text-gray-400 font-normal">(선택)</span>
                  </Label>
                  <Input
                    placeholder="상태 변경 사유를 입력하세요"
                    value={newStatusReason}
                    onChange={(e) => setNewStatusReason(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 justify-between pt-2 border-t border-gray-100">
                  <Button
                    variant="outline"
                    onClick={handleDeleteUser}
                    disabled={updating}
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                  >
                    회원 삭제
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      disabled={updating}
                    >
                      취소
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={updating}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      {updating ? "저장 중..." : "저장"}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* 활동내역 탭 */}
              <TabsContent value="activity" className="space-y-5 pt-4">
                {activityLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* 요약 통계 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 text-center">
                        <p className="text-xs text-orange-600 mb-1">이벤트 지원 횟수</p>
                        <p className="text-2xl font-bold text-orange-700">{eventCount}</p>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-center">
                        <p className="text-xs text-blue-600 mb-1">추천인 입력 횟수</p>
                        <p className="text-2xl font-bold text-blue-700">{referralCount}</p>
                      </div>
                    </div>

                    {/* 결제내역 */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">결제내역</h3>
                      {payments.length === 0 ? (
                        <div className="text-center py-8 text-sm text-gray-400 bg-gray-50 rounded-lg">
                          결제내역이 없습니다
                        </div>
                      ) : (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">날짜</th>
                                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">금액</th>
                                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">방법</th>
                                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">상태</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {payments.map((pay) => (
                                <tr key={pay.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 text-gray-600">{formatDate(pay.created_at)}</td>
                                  <td className="px-4 py-2 text-gray-900 font-medium">{formatAmount(pay.amount)}</td>
                                  <td className="px-4 py-2 text-gray-600">{pay.payment_method ?? "-"}</td>
                                  <td className="px-4 py-2">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                      pay.status === "paid" || pay.status === "completed"
                                        ? "bg-green-100 text-green-700"
                                        : pay.status === "failed"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-gray-100 text-gray-500"
                                    }`}>
                                      {pay.status ?? "-"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* 프로필지원 내역 */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">프로필지원 내역</h3>
                      {supportHistory.length === 0 ? (
                        <div className="text-center py-8 text-sm text-gray-400 bg-gray-50 rounded-lg">
                          프로필지원 내역이 없습니다
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-lg border border-gray-100">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50 text-left text-xs text-gray-500">
                                <th className="px-4 py-2">발송일</th>
                                <th className="px-4 py-2">소속사명</th>
                                <th className="px-4 py-2">카테고리</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {supportHistory.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 text-gray-600">
                                    {item.sent_at ? new Date(item.sent_at).toLocaleDateString("ko-KR") : "-"}
                                  </td>
                                  <td className="px-4 py-2 text-gray-800">{item.agency_name}</td>
                                  <td className="px-4 py-2 text-gray-600">{item.agency_category}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
