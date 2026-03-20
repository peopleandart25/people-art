"use client"

import { useEffect, useState } from "react"
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

type Profile = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  role: string
  created_at: string | null
}

const roleColors: Record<string, string> = {
  admin: "bg-orange-100 text-orange-700",
  premium: "bg-blue-100 text-blue-700",
  user: "bg-gray-100 text-gray-600",
}

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [filtered, setFiltered] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newRole, setNewRole] = useState("")
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProfiles()
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    if (!q) {
      setFiltered(profiles)
    } else {
      setFiltered(
        profiles.filter(
          (p) =>
            (p.name ?? "").toLowerCase().includes(q) ||
            (p.email ?? "").toLowerCase().includes(q)
        )
      )
    }
  }, [search, profiles])

  async function fetchProfiles() {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, email, phone, role, created_at")
      .order("created_at", { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setProfiles(data ?? [])
      setFiltered(data ?? [])
    }
    setLoading(false)
  }

  function openDialog(user: Profile) {
    setSelectedUser(user)
    setNewRole(user.role)
    setDialogOpen(true)
  }

  async function handleRoleUpdate() {
    if (!selectedUser) return
    setUpdating(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">회원 관리</h1>
        <p className="text-sm text-gray-500 mt-1">전체 회원 목록 및 역할 관리</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 검색 */}
      <div className="mb-4">
        <Input
          placeholder="이름 또는 이메일로 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-7 h-7 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">전화번호</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">역할</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">가입일</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-sm text-gray-900">{user.name ?? "-"}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{user.email ?? "-"}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{user.phone ?? "-"}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${roleColors[user.role] ?? roleColors.user}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString("ko-KR")
                        : "-"}
                    </td>
                    <td className="px-6 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDialog(user)}
                        className="text-xs"
                      >
                        역할 변경
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400">
                      회원이 없습니다
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 역할 변경 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>역할 변경</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 pt-2">
              <div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{selectedUser.name ?? "-"}</span>
                  {" "}({selectedUser.email ?? "-"})의 역할을 변경합니다.
                </p>
              </div>
              <div className="space-y-2">
                <Label>역할 선택</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">user</SelectItem>
                    <SelectItem value="premium">premium</SelectItem>
                    <SelectItem value="admin">admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={updating}
                >
                  취소
                </Button>
                <Button
                  onClick={handleRoleUpdate}
                  disabled={updating}
                  className="bg-gray-900 hover:bg-gray-700 text-white"
                >
                  {updating ? "저장 중..." : "저장"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
