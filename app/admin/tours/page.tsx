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

type Tour = {
  id: string
  title: string
  category: string | null
  status: string
  created_at: string | null
}

type TourForm = {
  title: string
  category: string
  status: string
}

const defaultForm: TourForm = {
  title: "",
  category: "",
  status: "예정",
}

const statusColors: Record<string, string> = {
  "진행중": "bg-green-100 text-green-700",
  "마감": "bg-gray-100 text-gray-600",
  "예정": "bg-blue-100 text-blue-700",
}

export default function AdminToursPage() {
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTour, setEditingTour] = useState<Tour | null>(null)
  const [form, setForm] = useState<TourForm>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTours()
  }, [])

  async function fetchTours() {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("tours")
      .select("id, title, category, status, created_at")
      .order("created_at", { ascending: false })

    if (error) setError(error.message)
    else setTours(data ?? [])
    setLoading(false)
  }

  function openAddDialog() {
    setEditingTour(null)
    setForm(defaultForm)
    setError(null)
    setDialogOpen(true)
  }

  function openEditDialog(tour: Tour) {
    setEditingTour(tour)
    setForm({
      title: tour.title,
      category: tour.category ?? "",
      status: tour.status,
    })
    setError(null)
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.title.trim()) {
      setError("제목을 입력해주세요.")
      return
    }
    setSaving(true)
    setError(null)
    const supabase = createClient()

    const payload = {
      title: form.title,
      category: form.category || null,
      status: form.status,
    }

    if (editingTour) {
      const { error } = await supabase
        .from("tours")
        .update(payload)
        .eq("id", editingTour.id)
      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase.from("tours").insert(payload)
      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }
    }

    await fetchTours()
    setDialogOpen(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("이 투어를 삭제하시겠습니까?")) return
    const supabase = createClient()
    const { error } = await supabase.from("tours").delete().eq("id", id)
    if (error) setError(error.message)
    else await fetchTours()
  }

  const updateForm = (key: keyof TourForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">투어 관리</h1>
          <p className="text-sm text-gray-500 mt-1">투어 목록 및 상태 관리</p>
        </div>
        <Button
          onClick={openAddDialog}
          className="bg-gray-900 hover:bg-gray-700 text-white"
        >
          투어 추가
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

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
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">작성일</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tours.map((tour) => (
                  <tr key={tour.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-sm text-gray-900 max-w-xs truncate">{tour.title}</td>
                    <td className="px-6 py-3">
                      {tour.category ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600">
                          {tour.category}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[tour.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {tour.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500">
                      {tour.created_at
                        ? new Date(tour.created_at).toLocaleDateString("ko-KR")
                        : "-"}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(tour)}
                          className="text-xs"
                        >
                          수정
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(tour.id)}
                          className="text-xs"
                        >
                          삭제
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {tours.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">
                      투어가 없습니다
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 추가/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTour ? "투어 수정" : "투어 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>제목 *</Label>
              <Input
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
                placeholder="투어 제목"
              />
            </div>

            <div className="space-y-2">
              <Label>카테고리</Label>
              <Input
                value={form.category}
                onChange={(e) => updateForm("category", e.target.value)}
                placeholder="카테고리 (예: 연극, 뮤지컬)"
              />
            </div>

            <div className="space-y-2">
              <Label>상태</Label>
              <Select value={form.status} onValueChange={(v) => updateForm("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="예정">예정</SelectItem>
                  <SelectItem value="진행중">진행중</SelectItem>
                  <SelectItem value="마감">마감</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                취소
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gray-900 hover:bg-gray-700 text-white"
              >
                {saving ? "저장 중..." : "저장"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
