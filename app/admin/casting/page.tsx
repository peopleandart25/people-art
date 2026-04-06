"use client"

import { Fragment, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Film, ChevronDown, ChevronUp, Pencil, Trash2, Users, Plus } from "lucide-react"

type Casting = {
  id: string
  title: string
  category: string
  role_type: string | null
  gender: string | null
  birth_year_start: number | null
  birth_year_end: number | null
  deadline: string | null
  work_period: string | null
  location: string | null
  fee: string | null
  description: string | null
  is_closed: boolean
  is_urgent: boolean
  created_at: string
  casting_applications: { count: number }[]
  creator: { name: string | null; activity_name: string | null; email: string | null } | null
}

type Application = {
  id: string
  admin_status: string
  admin_note: string | null
  applied_at: string | null
  user_id: string
  profile: { name: string | null; email: string | null; phone: string | null } | null
  portfolio_url: string | null
}

type CastingForm = {
  title: string
  category: string
  role_type: string
  gender: string
  birth_year_start: string
  birth_year_end: string
  deadline: string
  work_period: string
  location: string
  fee: string
  description: string
  is_closed: boolean
  is_urgent: boolean
}

const defaultForm: CastingForm = {
  title: "", category: "영화", role_type: "", gender: "무관",
  birth_year_start: "", birth_year_end: "", deadline: "",
  work_period: "", location: "", fee: "", description: "",
  is_closed: false, is_urgent: false,
}

const statusColors: Record<string, string> = {
  "대기": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "합격": "bg-green-100 text-green-700 border-green-200",
  "보류": "bg-blue-100 text-blue-700 border-blue-200",
  "탈락": "bg-gray-100 text-gray-600 border-gray-200",
}

export default function AdminCastingPage() {
  const [castings, setCastings] = useState<Casting[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CastingForm>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [applicationsMap, setApplicationsMap] = useState<Record<string, Application[]>>({})
  const [loadingApps, setLoadingApps] = useState<string | null>(null)

  useEffect(() => { fetchCastings() }, [])

  async function fetchCastings() {
    setLoading(true)
    const res = await fetch("/api/admin/castings")
    const data = await res.json()
    if (Array.isArray(data)) setCastings(data)
    setLoading(false)
  }

  async function fetchApplications(castingId: string) {
    if (applicationsMap[castingId]) return
    setLoadingApps(castingId)
    const res = await fetch(`/api/admin/castings?casting_id=${castingId}`)
    const data = await res.json()
    if (Array.isArray(data)) {
      setApplicationsMap((prev) => ({ ...prev, [castingId]: data }))
    }
    setLoadingApps(null)
  }

  function toggleExpand(castingId: string) {
    if (expandedId === castingId) {
      setExpandedId(null)
    } else {
      setExpandedId(castingId)
      fetchApplications(castingId)
    }
  }

  async function handleStatusChange(castingId: string, applicationId: string, admin_status: string) {
    await fetch("/api/admin/castings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ application_id: applicationId, admin_status }),
    })
    setApplicationsMap((prev) => ({
      ...prev,
      [castingId]: (prev[castingId] ?? []).map((a) =>
        a.id === applicationId ? { ...a, admin_status } : a
      ),
    }))
  }

  function openAdd() {
    setEditingId(null)
    setForm(defaultForm)
    setError(null)
    setDialogOpen(true)
  }

  function openEdit(casting: Casting) {
    setEditingId(casting.id)
    setForm({
      title: casting.title,
      category: casting.category,
      role_type: casting.role_type ?? "",
      gender: casting.gender ?? "무관",
      birth_year_start: casting.birth_year_start?.toString() ?? "",
      birth_year_end: casting.birth_year_end?.toString() ?? "",
      deadline: casting.deadline ?? "",
      work_period: casting.work_period ?? "",
      location: casting.location ?? "",
      fee: casting.fee ?? "",
      description: casting.description ?? "",
      is_closed: casting.is_closed,
      is_urgent: casting.is_urgent,
    })
    setError(null)
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.title.trim()) { setError("제목을 입력해주세요."); return }
    setSaving(true)
    setError(null)

    const payload = {
      title: form.title,
      category: form.category,
      role_type: form.role_type || null,
      gender: form.gender || null,
      birth_year_start: form.birth_year_start ? Number(form.birth_year_start) : null,
      birth_year_end: form.birth_year_end ? Number(form.birth_year_end) : null,
      deadline: form.deadline || null,
      work_period: form.work_period || null,
      location: form.location || null,
      fee: form.fee || null,
      description: form.description || null,
      is_closed: form.is_closed,
      is_urgent: form.is_urgent,
    }

    const res = await fetch("/api/admin/castings", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
    })

    if (!res.ok) {
      const err = await res.json()
      setError(err.error ?? "저장 실패")
      setSaving(false)
      return
    }

    await fetchCastings()
    setDialogOpen(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("이 캐스팅 공고를 삭제하시겠습니까?")) return
    const res = await fetch("/api/admin/castings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) { const err = await res.json(); setError(err.error ?? "삭제 실패"); return }
    if (expandedId === id) setExpandedId(null)
    await fetchCastings()
  }

  const updateForm = (key: keyof CastingForm, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">캐스팅 관리</h1>
          <p className="text-sm text-gray-500 mt-1">전체 캐스팅 공고 목록</p>
        </div>
        <Button onClick={openAdd} className="bg-gray-900 hover:bg-gray-700 text-white gap-2">
          <Plus className="w-4 h-4" />
          공고 추가
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
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
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">제목</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">카테고리</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">작성자</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">상태</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">마감일</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">작성일</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">지원자</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">관리</th>
                </tr>
              </thead>
              <tbody>
                {castings.map((casting) => {
                  const isExpanded = expandedId === casting.id
                  const appCount = casting.casting_applications?.[0]?.count ?? 0
                  const apps = applicationsMap[casting.id]

                  return (
                    <Fragment key={casting.id}>
                      <tr className={`border-b border-gray-50 transition-colors ${isExpanded ? "bg-orange-50" : "hover:bg-gray-50"}`}>
                        <td className="px-6 py-3 text-sm font-medium text-gray-900 max-w-xs">
                          <div className="flex items-center gap-2">
                            {casting.is_urgent && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-600">긴급</span>
                            )}
                            <span className="truncate">{casting.title}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600 whitespace-nowrap">{casting.category}</td>
                        <td className="px-6 py-3 text-sm whitespace-nowrap">
                          {casting.creator ? (
                            <div>
                              <p className="font-medium text-gray-800">{casting.creator.activity_name ?? casting.creator.name ?? "-"}</p>
                              <p className="text-xs text-gray-400">{casting.creator.email ?? ""}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${casting.is_closed ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-700"}`}>
                            {casting.is_closed ? "마감" : "모집중"}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {casting.deadline ? new Date(casting.deadline).toLocaleDateString("ko-KR") : "-"}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {casting.created_at ? new Date(casting.created_at).toLocaleDateString("ko-KR") : "-"}
                        </td>
                        <td className="px-6 py-3">
                          <button
                            onClick={() => toggleExpand(casting.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                              isExpanded
                                ? "bg-orange-500 text-white border-orange-500"
                                : appCount > 0
                                ? "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"
                                : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            <Users className="w-3.5 h-3.5" />
                            {appCount}명
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEdit(casting)}
                              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                              title="수정"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(casting.id)}
                              className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                              title="삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="border-b border-orange-100">
                          <td colSpan={8} className="p-0">
                            <div className="bg-orange-50/50 border-t border-orange-100">
                              <div className="px-6 py-3 border-b border-orange-100">
                                <p className="text-sm font-semibold text-gray-800">{casting.title} — 지원자 목록</p>
                                <p className="text-xs text-gray-500 mt-0.5">총 {appCount}명 지원</p>
                              </div>
                              {loadingApps === casting.id ? (
                                <div className="flex items-center justify-center py-10">
                                  <div className="w-6 h-6 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
                                </div>
                              ) : !apps || apps.length === 0 ? (
                                <div className="py-10 text-center text-sm text-gray-400">지원자가 없습니다</div>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b border-orange-100 bg-orange-50">
                                        <th className="text-left px-6 py-2.5 text-xs font-medium text-gray-500">이름</th>
                                        <th className="text-left px-6 py-2.5 text-xs font-medium text-gray-500">이메일</th>
                                        <th className="text-left px-6 py-2.5 text-xs font-medium text-gray-500">전화번호</th>
                                        <th className="text-left px-6 py-2.5 text-xs font-medium text-gray-500">지원일시</th>
                                        <th className="text-left px-6 py-2.5 text-xs font-medium text-gray-500">포트폴리오</th>
                                        <th className="text-left px-6 py-2.5 text-xs font-medium text-gray-500">상태</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-orange-50">
                                      {apps.map((app) => (
                                        <tr key={app.id} className="hover:bg-white/60 transition-colors">
                                          <td className="px-6 py-3 font-medium text-gray-900">{app.profile?.name ?? "-"}</td>
                                          <td className="px-6 py-3 text-gray-600">{app.profile?.email ?? "-"}</td>
                                          <td className="px-6 py-3 text-gray-600">{app.profile?.phone ?? "-"}</td>
                                          <td className="px-6 py-3 text-gray-500 whitespace-nowrap">
                                            {app.applied_at ? new Date(app.applied_at).toLocaleString("ko-KR") : "-"}
                                          </td>
                                          <td className="px-6 py-3">
                                            {app.portfolio_url ? (
                                              <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline text-xs">
                                                PDF 보기
                                              </a>
                                            ) : <span className="text-gray-400 text-xs">-</span>}
                                          </td>
                                          <td className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusColors[app.admin_status] ?? statusColors["대기"]}`}>
                                                {app.admin_status}
                                              </span>
                                              <Select
                                                value={app.admin_status}
                                                onValueChange={(v) => handleStatusChange(casting.id, app.id, v)}
                                              >
                                                <SelectTrigger className="h-7 text-xs w-24 bg-white">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {["대기", "합격", "보류", "탈락"].map((s) => (
                                                    <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
                {castings.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Film className="w-8 h-8 opacity-30" />
                        캐스팅 공고가 없습니다
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 공고 추가/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "캐스팅 공고 수정" : "캐스팅 공고 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>제목 *</Label>
              <Input value={form.title} onChange={(e) => updateForm("title", e.target.value)} placeholder="캐스팅 공고 제목" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>카테고리</Label>
                <Select value={form.category} onValueChange={(v) => updateForm("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["영화", "드라마", "웹드라마", "광고", "뮤직비디오", "기타"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>역할</Label>
                <Select value={form.role_type || "기타"} onValueChange={(v) => updateForm("role_type", v)}>
                  <SelectTrigger><SelectValue placeholder="역할 선택" /></SelectTrigger>
                  <SelectContent>
                    {["주연", "조연", "단역", "엑스트라", "기타"].map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>성별</Label>
                <Select value={form.gender} onValueChange={(v) => updateForm("gender", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["남자", "여자", "무관"].map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>마감일</Label>
                <Input type="date" value={form.deadline} onChange={(e) => updateForm("deadline", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>출생년도 (시작)</Label>
                <Input type="number" value={form.birth_year_start} onChange={(e) => updateForm("birth_year_start", e.target.value)} placeholder="예: 1990" />
              </div>
              <div className="space-y-2">
                <Label>출생년도 (종료)</Label>
                <Input type="number" value={form.birth_year_end} onChange={(e) => updateForm("birth_year_end", e.target.value)} placeholder="예: 2005" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>촬영 장소</Label>
                <Input value={form.location} onChange={(e) => updateForm("location", e.target.value)} placeholder="서울 강남구" />
              </div>
              <div className="space-y-2">
                <Label>출연료</Label>
                <Input value={form.fee} onChange={(e) => updateForm("fee", e.target.value)} placeholder="협의 후 결정" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>촬영 기간</Label>
              <Input value={form.work_period} onChange={(e) => updateForm("work_period", e.target.value)} placeholder="예: 2025년 8월 1일~15일" />
            </div>

            <div className="space-y-2">
              <Label>공고 내용</Label>
              <Textarea value={form.description} onChange={(e) => updateForm("description", e.target.value)} placeholder="캐스팅 공고 상세 내용을 입력하세요" rows={4} />
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_urgent} onChange={(e) => updateForm("is_urgent", e.target.checked)} className="w-4 h-4 accent-red-500" />
                긴급 공고
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_closed} onChange={(e) => updateForm("is_closed", e.target.checked)} className="w-4 h-4 accent-gray-500" />
                마감 처리
              </label>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>취소</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-gray-900 hover:bg-gray-700 text-white">
                {saving ? "저장 중..." : "저장"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
