"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Film,
  Plus,
  Users,
  Pencil,
  Trash2,
  Calendar,
  FileText,
  ExternalLink,
  ChevronRight,
  Briefcase,
} from "lucide-react"

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

type ActiveTab = "castings" | "register"

export default function CastingDirectorPage() {
  const router = useRouter()
  const { profile, loading } = useAuth()

  const [castings, setCastings] = useState<Casting[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [activeTab, setActiveTab] = useState<ActiveTab>("castings")
  const [selectedCastingId, setSelectedCastingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CastingForm>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [applicationsMap, setApplicationsMap] = useState<Record<string, Application[]>>({})
  const [loadingApps, setLoadingApps] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (profile?.role !== "casting_director") {
        router.replace("/")
        return
      }
      fetchCastings()
    }
  }, [loading, profile, router])

  useEffect(() => {
    if (selectedCastingId && !applicationsMap[selectedCastingId]) {
      fetchApplications(selectedCastingId)
    }
    // applicationsMap은 의도적으로 제외 - 캐시된 경우 재요청 방지
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCastingId])

  async function fetchCastings() {
    setLoadingData(true)
    const res = await fetch("/api/director/castings")
    const data = await res.json()
    if (Array.isArray(data)) setCastings(data)
    setLoadingData(false)
  }

  async function fetchApplications(castingId: string) {
    setLoadingApps(true)
    const res = await fetch(`/api/director/castings?casting_id=${castingId}`)
    const data = await res.json()
    if (Array.isArray(data)) {
      setApplicationsMap((prev) => ({ ...prev, [castingId]: data }))
    }
    setLoadingApps(false)
  }

  async function handleStatusChange(castingId: string, applicationId: string, admin_status: string) {
    await fetch("/api/director/castings", {
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
    setActiveTab("register")
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
    setActiveTab("register")
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

    const res = await fetch("/api/director/castings", {
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
    setEditingId(null)
    setForm(defaultForm)
    setActiveTab("castings")
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("이 공고를 삭제하시겠습니까?")) return
    const res = await fetch("/api/director/castings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) { const err = await res.json(); setError(err.error ?? "삭제 실패"); return }
    if (selectedCastingId === id) setSelectedCastingId(null)
    await fetchCastings()
  }

  const updateForm = (key: keyof CastingForm, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (profile?.role !== "casting_director") return null

  const selectedCasting = castings.find((c) => c.id === selectedCastingId) ?? null
  const applications = selectedCastingId ? (applicationsMap[selectedCastingId] ?? null) : null

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* ── 좌측 사이드바 ── */}
      <aside className="w-full md:w-64 md:shrink-0 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex flex-col">
        {/* 헤더 */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="h-5 w-5 text-primary" />
            <h1 className="text-base font-bold text-gray-900">디렉터 대시보드</h1>
          </div>
          <p className="text-xs text-gray-400 truncate">{profile?.name ?? ""}</p>
        </div>

        {/* 메뉴 탭 */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab("castings")}
            className={`flex-1 py-3 text-xs font-semibold transition-colors ${
              activeTab === "castings"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            내 공고
          </button>
          <button
            onClick={() => { setEditingId(null); setForm(defaultForm); setError(null); setActiveTab("register") }}
            className={`flex-1 py-3 text-xs font-semibold transition-colors ${
              activeTab === "register"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            공고 등록
          </button>
        </div>

        {/* 공고 목록 */}
        {activeTab === "castings" && (
          <div className="flex-1 overflow-y-auto max-h-64 md:max-h-none">
            {castings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2 px-4">
                <Film className="w-8 h-8 opacity-30" />
                <p className="text-xs text-center">등록된 공고가 없습니다</p>
                <Button onClick={openAdd} variant="outline" size="sm" className="text-xs">
                  <Plus className="w-3 h-3 mr-1" />
                  공고 등록
                </Button>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {castings.map((casting) => {
                  const appCount = casting.casting_applications?.[0]?.count ?? 0
                  const isSelected = selectedCastingId === casting.id
                  return (
                    <button
                      key={casting.id}
                      onClick={() => setSelectedCastingId(casting.id)}
                      className={`w-full text-left rounded-lg p-3 transition-colors group ${
                        isSelected
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-gray-50 border border-transparent"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <span className={`text-xs font-semibold leading-tight line-clamp-2 ${isSelected ? "text-primary" : "text-gray-800"}`}>
                          {casting.title}
                        </span>
                        {casting.is_urgent && (
                          <Badge className="bg-red-500 text-white text-[10px] px-1 py-0 shrink-0">긴급</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                          {casting.category}
                        </Badge>
                        <span className={`text-[10px] px-1.5 py-0 rounded-full border font-medium ${
                          casting.is_closed
                            ? "bg-gray-100 text-gray-500 border-gray-200"
                            : "bg-green-50 text-green-600 border-green-200"
                        }`}>
                          {casting.is_closed ? "마감" : "모집중"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          <Calendar className="w-3 h-3" />
                          {casting.deadline ? casting.deadline.slice(0, 10) : "기한 없음"}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                          <Users className="w-3 h-3" />
                          {appCount}명
                        </div>
                      </div>
                      {/* 수정/삭제 버튼 */}
                      <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEdit(casting) }}
                          className="flex items-center gap-0.5 text-[10px] text-gray-500 hover:text-primary px-1.5 py-0.5 rounded hover:bg-primary/10 transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                          수정
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(casting.id) }}
                          className="flex items-center gap-0.5 text-[10px] text-gray-500 hover:text-red-500 px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          삭제
                        </button>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* 공고 등록 탭의 사이드바는 비워둠 */}
        {activeTab === "register" && <div className="flex-1" />}

        {/* 사이드바 하단 */}
        <div className="p-3 border-t border-gray-100">
          <Button onClick={openAdd} size="sm" className="w-full gap-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" />
            새 공고 등록
          </Button>
        </div>
      </aside>

      {/* ── 우측 메인 영역 ── */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {error && (
          <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
        )}

        {/* 공고 등록/수정 탭 */}
        {activeTab === "register" && (
          <div className="max-w-2xl mx-auto px-6 py-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editingId ? "공고 수정" : "공고 등록"}
            </h2>
            <div className="space-y-5 bg-white rounded-xl border border-gray-200 p-6">
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
                  <Select value={form.role_type || "직접입력"} onValueChange={(v) => updateForm("role_type", v === "직접입력" ? "" : v)}>
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
                <Textarea value={form.description} onChange={(e) => updateForm("description", e.target.value)} placeholder="캐스팅 공고 상세 내용을 입력하세요" rows={5} />
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
                <Button
                  variant="outline"
                  onClick={() => { setActiveTab("castings"); setEditingId(null); setForm(defaultForm) }}
                  disabled={saving}
                >
                  취소
                </Button>
                <Button onClick={handleSave} disabled={saving} className="bg-gray-900 hover:bg-gray-700 text-white">
                  {saving ? "저장 중..." : "저장"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 내 공고 탭 */}
        {activeTab === "castings" && (
          <>
            {!selectedCasting ? (
              /* 공고 미선택 안내 */
              <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-gray-400 gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <ChevronRight className="w-8 h-8 text-gray-300" />
                </div>
                <div className="text-center">
                  <p className="text-base font-medium text-gray-500">공고를 선택하세요</p>
                  <p className="text-sm text-gray-400 mt-1">좌측 사이드바에서 공고를 선택하면 지원자 목록을 확인할 수 있습니다</p>
                </div>
                {castings.length === 0 && (
                  <Button onClick={openAdd} variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    첫 공고 등록하기
                  </Button>
                )}
              </div>
            ) : (
              /* 지원자 목록 */
              <div className="px-6 py-6">
                {/* 공고 요약 헤더 */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {selectedCasting.is_urgent && (
                          <Badge className="bg-red-500 text-white text-xs">긴급</Badge>
                        )}
                        <Badge variant="outline" className="text-xs">{selectedCasting.category}</Badge>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                          selectedCasting.is_closed
                            ? "bg-gray-100 text-gray-500 border-gray-200"
                            : "bg-green-50 text-green-600 border-green-200"
                        }`}>
                          {selectedCasting.is_closed ? "마감" : "모집중"}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">{selectedCasting.title}</h2>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        {selectedCasting.deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {selectedCasting.deadline.slice(0, 10)} 마감
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {selectedCasting.casting_applications?.[0]?.count ?? 0}명 지원
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(selectedCasting)}
                        className="gap-1.5 text-xs"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        수정
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(selectedCasting.id)}
                        className="gap-1.5 text-xs text-red-500 hover:text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        삭제
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 지원자 목록 */}
                <h3 className="text-sm font-semibold text-gray-700 mb-3">지원자 목록</h3>

                {loadingApps ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : !applications || applications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <Users className="w-10 h-10 opacity-30 mb-3" />
                    <p className="text-sm">아직 지원자가 없습니다</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {applications.map((app) => (
                      <Card key={app.id} className="border border-gray-200 shadow-none">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">
                                {app.profile?.name ?? "이름 없음"}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {app.applied_at ? new Date(app.applied_at).toLocaleDateString("ko-KR") : "-"} 지원
                              </p>
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusColors[app.admin_status] ?? statusColors["대기"]}`}>
                              {app.admin_status}
                            </span>
                          </div>

                          <div className="space-y-1 text-xs text-gray-600 mb-3">
                            {app.profile?.email && (
                              <p className="truncate">{app.profile.email}</p>
                            )}
                            {app.profile?.phone && (
                              <p>{app.profile.phone}</p>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            {app.portfolio_url ? (
                              <a
                                href={app.portfolio_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                <FileText className="w-3 h-3" />
                                포트폴리오
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-xs text-gray-300">포트폴리오 없음</span>
                            )}
                            <Select
                              value={app.admin_status}
                              onValueChange={(v) => handleStatusChange(selectedCasting.id, app.id, v)}
                            >
                              <SelectTrigger className="h-7 text-xs w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {["대기", "합격", "보류", "탈락"].map((s) => (
                                  <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
