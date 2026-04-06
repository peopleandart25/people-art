"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Briefcase,
  FolderOpen,
  User,
  PlusCircle,
  Bookmark,
  Users,
  Calendar,
  Film,
  Plus,
  Pencil,
  Trash2,
  Send,
  ExternalLink,
  X,
  FileText,
} from "lucide-react"

type ActiveView = "projects" | "register" | "bookmarks" | "profile"

type BookmarkItem = {
  id: string
  created_at: string
  artist_profile_id: string
  artist_profiles: {
    id: string
    gender: string | null
    birth_date: string | null
    height: number | null
    profiles: { name: string | null } | null
    artist_photos: { url: string; is_main: boolean }[]
  } | null
}

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

const categoryStyle: Record<string, { icon: string; badge: string; folder: string }> = {
  "영화": { icon: "text-orange-400", badge: "bg-orange-100 text-orange-600", folder: "bg-orange-50" },
  "드라마": { icon: "text-blue-400", badge: "bg-blue-100 text-blue-600", folder: "bg-blue-50" },
  "광고": { icon: "text-green-400", badge: "bg-green-100 text-green-600", folder: "bg-green-50" },
  "웹드라마": { icon: "text-blue-400", badge: "bg-blue-100 text-blue-600", folder: "bg-blue-50" },
  "뮤직비디오": { icon: "text-purple-400", badge: "bg-purple-100 text-purple-600", folder: "bg-purple-50" },
  "기타": { icon: "text-purple-400", badge: "bg-purple-100 text-purple-600", folder: "bg-purple-50" },
}

const getCategoryStyle = (category: string) =>
  categoryStyle[category] ?? categoryStyle["기타"]

const statusColors: Record<string, string> = {
  "대기": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "합격": "bg-green-100 text-green-700 border-green-200",
  "보류": "bg-blue-100 text-blue-700 border-blue-200",
  "탈락": "bg-gray-100 text-gray-600 border-gray-200",
}

const CATEGORIES = ["영화", "드라마", "웹드라마", "광고", "뮤직비디오", "기타"] as const
const GENDERS = ["남자", "여자", "무관"] as const
const STATUS_OPTIONS = ["대기", "합격", "보류", "탈락"] as const

const SIDEBAR_MENUS = [
  { id: "profile" as ActiveView, icon: User, label: "내 프로필 관리", shortLabel: "프로필" },
  { id: "projects" as ActiveView, icon: FolderOpen, label: "나의 캐스팅 프로젝트", shortLabel: "캐스팅" },
  { id: "register" as ActiveView, icon: PlusCircle, label: "새 공고 등록하기", shortLabel: "등록" },
  { id: "bookmarks" as ActiveView, icon: Bookmark, label: "나의 배우 보관함", shortLabel: "보관함", badge: 0 },
]

export default function CastingDirectorPage() {
  const router = useRouter()
  const { profile, loading } = useAuth()

  const [castings, setCastings] = useState<Casting[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [activeView, setActiveView] = useState<ActiveView>("projects")
  const [selectedCastingId, setSelectedCastingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CastingForm>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [applicationsMap, setApplicationsMap] = useState<Record<string, Application[]>>({})
  const [loadingApps, setLoadingApps] = useState(false)
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
  const [bookmarkLoading, setBookmarkLoading] = useState(false)

  const fetchCastings = useCallback(async () => {
    setLoadingData(true)
    try {
      const res = await fetch("/api/director/castings")
      const data = await res.json()
      if (Array.isArray(data)) setCastings(data)
    } catch {
      setError("데이터를 불러오지 못했습니다.")
    } finally {
      setLoadingData(false)
    }
  }, [])

  const fetchApplications = useCallback(async (castingId: string) => {
    setLoadingApps(true)
    try {
      const res = await fetch(`/api/director/castings?casting_id=${castingId}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setApplicationsMap((prev) => ({ ...prev, [castingId]: data }))
      }
    } catch {
      setError("지원자 목록을 불러오지 못했습니다.")
    } finally {
      setLoadingApps(false)
    }
  }, [])

  useEffect(() => {
    if (!loading) {
      if (profile?.role !== "casting_director") {
        router.replace("/")
        return
      }
      fetchCastings()
    }
  }, [loading, profile, router, fetchCastings])

  const fetchBookmarks = useCallback(async () => {
    setBookmarkLoading(true)
    try {
      const res = await fetch("/api/director/bookmarks")
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "보관함을 불러오지 못했습니다.")
      } else if (Array.isArray(data)) {
        setBookmarks(data)
      }
    } catch {
      setError("보관함을 불러오지 못했습니다.")
    } finally {
      setBookmarkLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeView === "profile") {
      router.push("/mypage")
    }
  }, [activeView, router])

  useEffect(() => {
    if (activeView === "bookmarks") {
      fetchBookmarks()
    }
  }, [activeView, fetchBookmarks])

  useEffect(() => {
    if (selectedCastingId && !applicationsMap[selectedCastingId]) {
      fetchApplications(selectedCastingId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCastingId, fetchApplications])

  const handleStatusChange = useCallback(
    async (castingId: string, applicationId: string, admin_status: string) => {
      const res = await fetch("/api/director/castings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_id: applicationId, admin_status }),
      })
      if (!res.ok) {
        setError("상태 변경에 실패했습니다.")
        return
      }
      setApplicationsMap((prev) => ({
        ...prev,
        [castingId]: (prev[castingId] ?? []).map((a) =>
          a.id === applicationId ? { ...a, admin_status } : a
        ),
      }))
    },
    []
  )

  const openAdd = useCallback(() => {
    setEditingId(null)
    setForm(defaultForm)
    setError(null)
    setActiveView("register")
  }, [])

  const openEdit = useCallback((casting: Casting) => {
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
    setActiveView("register")
  }, [])

  const handleSave = useCallback(async () => {
    if (!form.title.trim()) {
      setError("제목을 입력해주세요.")
      return
    }
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
    setActiveView("projects")
    setSaving(false)
  }, [editingId, form, fetchCastings])

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("이 공고를 삭제하시겠습니까?")) return
      const res = await fetch("/api/director/castings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error ?? "삭제 실패")
        return
      }
      if (selectedCastingId === id) setSelectedCastingId(null)
      await fetchCastings()
    },
    [selectedCastingId, fetchCastings]
  )

  const updateForm = useCallback(
    (key: keyof CastingForm, value: string | boolean) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    []
  )

  const handleCancelForm = useCallback(() => {
    setActiveView("projects")
    setEditingId(null)
    setForm(defaultForm)
  }, [])

  const handleMenuClick = useCallback((id: ActiveView) => {
    if (id === "register") {
      setEditingId(null)
      setForm(defaultForm)
      setError(null)
    }
    setActiveView(id)
  }, [])

  const activeCastings = useMemo(() => castings.filter((c) => !c.is_closed), [castings])
  const totalApplicants = useMemo(
    () => castings.reduce((sum, c) => sum + (c.casting_applications?.[0]?.count ?? 0), 0),
    [castings]
  )
  const selectedCasting = useMemo(
    () => castings.find((c) => c.id === selectedCastingId) ?? null,
    [castings, selectedCastingId]
  )
  const applications = useMemo(
    () => (selectedCastingId ? (applicationsMap[selectedCastingId] ?? null) : null),
    [selectedCastingId, applicationsMap]
  )

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F7F4]">
        <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (profile?.role !== "casting_director") return null

  return (
    <div className="flex min-h-screen bg-[#F8F7F4]">
      {/* ── 왼쪽 사이드바 (데스크탑) ── */}
      <aside className="hidden md:flex w-64 shrink-0 bg-white border-r border-gray-100 flex-col">
        <div className="px-5 py-6 border-b border-gray-100">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <FolderOpen className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">캐스팅 워크스페이스</p>
              <p className="text-[10px] text-gray-400">캐스팅 디렉터 전용</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-3">
          {SIDEBAR_MENUS.map((menu) => {
            const Icon = menu.icon
            const isActive = activeView === menu.id
            return (
              <button
                key={menu.id}
                onClick={() => handleMenuClick(menu.id)}
                aria-label={menu.label}
                className={`px-4 py-3 flex items-center gap-3 text-sm font-medium rounded-lg mx-2 w-[calc(100%-16px)] cursor-pointer transition-colors ${
                  isActive ? "bg-orange-50 text-orange-600" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{menu.label}</span>
                {menu.badge !== undefined && menu.badge > 0 && (
                  <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {menu.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* ── 모바일 탭 바 ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-50">
        {SIDEBAR_MENUS.map((menu) => {
          const Icon = menu.icon
          const isActive = activeView === menu.id
          return (
            <button
              key={menu.id}
              onClick={() => handleMenuClick(menu.id)}
              aria-label={menu.label}
              className={`flex-1 py-3 flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
                isActive ? "text-orange-600" : "text-gray-400"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="leading-none">{menu.shortLabel}</span>
            </button>
          )
        })}
      </div>

      {/* ── 메인 컨텐츠 ── */}
      <main className="flex-1 min-w-0 overflow-y-auto pb-20 md:pb-0">
        {error && activeView !== "register" && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} aria-label="에러 닫기">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── projects 뷰 ── */}
        {activeView === "projects" && (
          <div className="px-6 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-blue-500 font-medium mb-1">진행 중인 캐스팅</p>
                    <p className="text-3xl font-bold text-blue-600">{activeCastings.length}</p>
                    <p className="text-xs text-blue-400 mt-1">건</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-200/50 rounded-xl flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm text-orange-500 font-medium">신규 지원자</p>
                      <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">NEW</span>
                    </div>
                    <p className="text-3xl font-bold text-orange-500">{totalApplicants}</p>
                    <p className="text-xs text-orange-400 mt-1">명</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-200/50 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-orange-500" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-green-500 font-medium mb-1">보낸 제안</p>
                    <p className="text-lg font-medium text-green-500 mt-1">준비 중</p>
                  </div>
                  <div className="w-12 h-12 bg-green-200/50 rounded-xl flex items-center justify-center">
                    <Send className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">나의 캐스팅 프로젝트</h2>
                <p className="text-sm text-gray-500 mt-1">등록한 캐스팅 공고를 관리합니다.</p>
              </div>
              <Button
                onClick={openAdd}
                className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5 shrink-0"
                size="sm"
              >
                <Plus className="w-4 h-4" />
                새 공고 등록
              </Button>
            </div>

            {castings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                  <Film className="w-8 h-8 opacity-40" />
                </div>
                <div className="text-center">
                  <p className="text-base font-medium text-gray-500">등록된 공고가 없습니다</p>
                  <p className="text-sm text-gray-400 mt-1">첫 캐스팅 공고를 등록해보세요</p>
                </div>
                <Button onClick={openAdd} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
                  <Plus className="w-4 h-4" />
                  공고 등록하기
                </Button>
              </div>
            ) : (
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${selectedCastingId ? "lg:grid-cols-2" : ""}`}
              >
                {castings.map((casting) => {
                  const appCount = casting.casting_applications?.[0]?.count ?? 0
                  const style = getCategoryStyle(casting.category)
                  const isSelected = selectedCastingId === casting.id
                  return (
                    <div
                      key={casting.id}
                      onClick={() => setSelectedCastingId(isSelected ? null : casting.id)}
                      className={`bg-white rounded-2xl border p-5 hover:shadow-md transition-all cursor-pointer group relative ${
                        isSelected
                          ? "border-orange-300 shadow-md ring-1 ring-orange-200"
                          : "border-gray-100"
                      }`}
                    >
                      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openEdit(casting)
                          }}
                          aria-label="공고 수정"
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(casting.id)
                          }}
                          aria-label="공고 삭제"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-start justify-between mb-3">
                        <div
                          className={`w-10 h-10 ${style.folder} rounded-xl flex items-center justify-center`}
                        >
                          <FolderOpen className={`w-5 h-5 ${style.icon}`} />
                        </div>
                        <div className="flex items-center gap-1.5">
                          {casting.is_urgent && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                              긴급
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                              casting.is_closed
                                ? "bg-gray-100 text-gray-500 border-gray-200"
                                : "bg-green-50 text-green-600 border-green-200"
                            }`}
                          >
                            {casting.is_closed ? "마감" : "진행중"}
                          </span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>
                        {casting.category}
                      </span>

                      <p className="text-base font-bold text-gray-900 mt-2 leading-snug line-clamp-2">
                        {casting.title}
                      </p>
                      {casting.role_type && (
                        <p className="text-sm text-gray-500 mt-0.5 truncate">{casting.role_type}</p>
                      )}

                      <div className="border-t border-gray-100 mt-4 pt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Users className="w-3.5 h-3.5" />
                          <span>지원자 {appCount}명</span>
                        </div>
                        {casting.deadline && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{casting.deadline.slice(0, 10)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── 지원자 슬라이드 패널 ── */}
        {activeView === "projects" && selectedCasting && (
          <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white border-l border-gray-200 shadow-2xl z-40 flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {selectedCasting.is_urgent && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      긴급
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                      getCategoryStyle(selectedCasting.category).badge
                    }`}
                  >
                    {selectedCasting.category}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                      selectedCasting.is_closed
                        ? "bg-gray-100 text-gray-500 border-gray-200"
                        : "bg-green-50 text-green-600 border-green-200"
                    }`}
                  >
                    {selectedCasting.is_closed ? "마감" : "진행중"}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 truncate">{selectedCasting.title}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  {selectedCasting.deadline && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {selectedCasting.deadline.slice(0, 10)} 마감
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {selectedCasting.casting_applications?.[0]?.count ?? 0}명
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEdit(selectedCasting)}
                  aria-label="공고 수정"
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(selectedCasting.id)}
                  aria-label="공고 삭제"
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedCastingId(null)}
                  aria-label="패널 닫기"
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="px-5 py-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">지원자 목록</p>

                {loadingApps ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-6 h-6 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : !applications || applications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                    <Users className="w-10 h-10 opacity-30" />
                    <p className="text-sm">아직 지원자가 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {applications.map((app) => (
                      <div key={app.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {app.profile?.name ?? "이름 없음"}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              지원일:{" "}
                              {app.applied_at
                                ? new Date(app.applied_at).toLocaleDateString("ko-KR")
                                : "-"}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                              statusColors[app.admin_status] ?? statusColors["대기"]
                            }`}
                          >
                            {app.admin_status}
                          </span>
                        </div>

                        <div className="space-y-0.5 text-xs text-gray-500 mb-3">
                          {app.profile?.email && (
                            <p className="truncate">{app.profile.email}</p>
                          )}
                          {app.profile?.phone && <p>{app.profile.phone}</p>}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          {app.portfolio_url ? (
                            <a
                              href={app.portfolio_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 hover:underline"
                            >
                              <FileText className="w-3 h-3" />
                              포트폴리오 보기
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-gray-300">포트폴리오 없음</span>
                          )}
                          <Select
                            value={app.admin_status}
                            onValueChange={(v) =>
                              handleStatusChange(selectedCasting.id, app.id, v)
                            }
                          >
                            <SelectTrigger className="h-7 text-xs w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((s) => (
                                <SelectItem key={s} value={s} className="text-xs">
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── register 뷰 ── */}
        {activeView === "register" && (
          <div className="max-w-2xl mx-auto px-6 py-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? "캐스팅 공고 수정" : "새 캐스팅 공고 등록"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                캐스팅 공고를 등록하면 관리자 승인 후 노출됩니다.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">작품명 / 프로젝트명 *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => updateForm("title", e.target.value)}
                  placeholder="예: 넷플릭스 오리지널 시리즈 야간경비"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">분류 *</Label>
                  <Select value={form.category} onValueChange={(v) => updateForm("category", v)}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role_type">배역명</Label>
                  <Input
                    id="role_type"
                    value={form.role_type}
                    onChange={(e) => updateForm("role_type", e.target.value)}
                    placeholder="예: 박준혁 (30대 초반 경비원)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">성별</Label>
                  <Select value={form.gender} onValueChange={(v) => updateForm("gender", v)}>
                    <SelectTrigger id="gender">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDERS.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birth_year_start">출생연도 시작</Label>
                  <Input
                    id="birth_year_start"
                    type="number"
                    value={form.birth_year_start}
                    onChange={(e) => updateForm("birth_year_start", e.target.value)}
                    placeholder="예: 1990"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="work_period">촬영일정</Label>
                  <Input
                    id="work_period"
                    value={form.work_period}
                    onChange={(e) => updateForm("work_period", e.target.value)}
                    placeholder="예: 2025년 8월 1일~15일"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">지원 마감일 *</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={form.deadline}
                    onChange={(e) => updateForm("deadline", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">상세 내용</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  placeholder="캐스팅 공고 상세 내용을 입력하세요"
                  rows={5}
                />
              </div>

              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                <p className="text-sm text-gray-400">파일 첨부 (선택)</p>
                <p className="text-xs text-gray-300 mt-1">대본, 콘티 등 관련 파일을 첨부하세요</p>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_urgent}
                    onChange={(e) => updateForm("is_urgent", e.target.checked)}
                    className="w-4 h-4 accent-red-500"
                  />
                  긴급 공고
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_closed}
                    onChange={(e) => updateForm("is_closed", e.target.checked)}
                    className="w-4 h-4 accent-gray-500"
                  />
                  마감 처리
                </label>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex gap-3 justify-end pt-2">
                <Button variant="outline" onClick={handleCancelForm} disabled={saving}>
                  취소
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {saving ? "저장 중..." : "저장하기"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── bookmarks 뷰 ── */}
        {activeView === "bookmarks" && (
          <div className="px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Bookmark className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">나의 배우 보관함</h2>
                  <p className="text-sm text-gray-500">관심 있는 배우들을 저장하고 관리하세요.</p>
                </div>
              </div>
              <span className="text-sm text-gray-400">{bookmarks.length}명 저장됨</span>
            </div>

            {bookmarkLoading ? (
              <div className="flex items-center justify-center py-24">
                <div className="w-7 h-7 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : bookmarks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                  <Bookmark className="w-8 h-8 opacity-40" />
                </div>
                <div className="text-center">
                  <p className="text-base font-medium text-gray-500">보관함이 비어있습니다</p>
                  <p className="text-sm text-gray-400 mt-1">
                    배우 프로필에서 북마크 버튼을 눌러 저장해보세요
                  </p>
                </div>
                <Link href="/artists">
                  <Button variant="outline" size="sm" className="mt-2">배우 목록 보기</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {bookmarks.map((bm) => {
                  const ap = bm.artist_profiles
                  const name = ap?.profiles?.name ?? "-"
                  const mainPhoto = ap?.artist_photos?.find(p => p.is_main)?.url
                    ?? ap?.artist_photos?.[0]?.url ?? null
                  const birthYear = ap?.birth_date ? new Date(ap.birth_date).getFullYear() : null
                  const age = birthYear ? new Date().getFullYear() - birthYear : null

                  return (
                    <div key={bm.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <Link href={`/artists/${bm.artist_profile_id}`}>
                        <div className="aspect-[3/4] relative bg-gray-100">
                          {mainPhoto ? (
                            <Image src={mainPhoto} alt={name} fill className="object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Users className="w-10 h-10 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="font-semibold text-gray-900 text-sm truncate">{name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {[ap?.gender, age ? `${age}세` : null].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      </Link>
                      <div className="px-3 pb-3">
                        <button
                          onClick={async () => {
                            const res = await fetch("/api/director/bookmarks", {
                              method: "DELETE",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ artist_profile_id: bm.artist_profile_id }),
                            })
                            if (res.ok) setBookmarks(prev => prev.filter(b => b.id !== bm.id))
                          }}
                          className="w-full text-xs text-gray-400 hover:text-red-500 transition-colors py-1 flex items-center justify-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          보관함에서 제거
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
