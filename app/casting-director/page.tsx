"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { DirectorProfileForm } from "@/components/director-profile-form"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
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
  ChevronLeft,
  Download,
  Save,
} from "lucide-react"

type ActiveView = "projects" | "register" | "bookmarks" | "profile" | "proposals"

type BookmarkItem = {
  id: string
  created_at: string
  artist_profile_id: string
  main_photo: string | null
  artist_profiles: {
    id: string
    user_id: string
    gender: string | null
    birth_date: string | null
    height: number | null
    portfolio_url?: string | null
    profiles: { name: string | null } | null
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
  artist_profile_id: string | null
  main_photo: string | null
  gender: string | null
  birth_date: string | null
  height: number | null
  weight: number | null
  status_tags: string[]
}

type ShortlistItem = {
  id: string
  created_at: string
  artist_user_id: string
  name: string
  artist_profile: {
    id: string
    gender: string | null
    birth_date: string | null
    height: number | null
    weight: number | null
  } | null
  main_photo: string | null
  portfolio_url: string | null
}

type ProposalRecord = {
  id: string
  status: "pending" | "accepted" | "rejected"
  message: string | null
  created_at: string
  expires_at: string | null
  casting_id: string | null
  artist_user_id: string
  artist_name: string
  casting_title: string | null
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
  title: "", category: "영화", role_type: "기타", gender: "무관",
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
  "리스트업": "bg-purple-100 text-purple-700 border-purple-200",
  "합격": "bg-green-100 text-green-700 border-green-200",
  "최종합격": "bg-orange-100 text-orange-700 border-orange-200",
  "보류": "bg-blue-100 text-blue-700 border-blue-200",
  "탈락": "bg-gray-100 text-gray-600 border-gray-200",
}

const PROPOSAL_STATUS_LABEL: Record<string, string> = {
  pending: "대기", accepted: "수락", rejected: "거절",
}

const PROPOSAL_STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  accepted: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-gray-100 text-gray-500 border-gray-200",
}

const CATEGORIES = ["영화", "드라마", "웹드라마", "광고", "뮤직비디오", "기타"] as const
const GENDERS = ["남자", "여자", "무관"] as const
const ROLE_TYPES = ["주연", "조연", "단역", "엑스트라", "기타"] as const
const STATUS_OPTIONS = ["대기", "리스트업", "합격", "최종합격", "보류", "탈락"] as const

const SIDEBAR_MENUS = [
  { id: "profile" as ActiveView, icon: User, label: "내 프로필 관리", shortLabel: "프로필" },
  { id: "projects" as ActiveView, icon: FolderOpen, label: "나의 캐스팅 프로젝트", shortLabel: "캐스팅" },
  { id: "register" as ActiveView, icon: PlusCircle, label: "새 공고 등록하기", shortLabel: "등록" },
  { id: "bookmarks" as ActiveView, icon: Bookmark, label: "나의 배우 보관함", shortLabel: "보관함", badge: 0 },
  { id: "proposals" as ActiveView, icon: Send, label: "보낸 제안 관리", shortLabel: "제안", badge: 0 },
]

export default function CastingDirectorPage() {
  const router = useRouter()
  const { profile, loading } = useAuth()
  const { toast } = useToast()

  // — 기존 state —
  const [castings, setCastings] = useState<Casting[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [activeView, setActiveView] = useState<ActiveView>("projects")

  // URL ?view= 파라미터로 초기 뷰 설정
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const view = params.get("view") as ActiveView | null
    if (view && ["projects", "register", "bookmarks", "profile", "proposals"].includes(view)) {
      setActiveView(view)
    }
  }, [])
  const [selectedCastingId, setSelectedCastingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CastingForm>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [applicationsMap, setApplicationsMap] = useState<Record<string, Application[]>>({})
  const [loadingApps, setLoadingApps] = useState(false)
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
  const [bookmarkLoading, setBookmarkLoading] = useState(false)

  // — 신규 state —
  const [castingDetailTab, setCastingDetailTab] = useState<"applicants" | "shortlist" | "myproposals">("applicants")
  const [shortlistMap, setShortlistMap] = useState<Record<string, ShortlistItem[]>>({})
  const [loadingShortlist, setLoadingShortlist] = useState(false)
  const [proposals, setProposals] = useState<ProposalRecord[]>([])
  const [proposalsLoading, setProposalsLoading] = useState(false)
  const [selectedApplicants, setSelectedApplicants] = useState<Set<string>>(new Set())
  const [applicantSearch, setApplicantSearch] = useState("")
  const [filterGender, setFilterGender] = useState<string>("전체")
  const [filterAgeRange, setFilterAgeRange] = useState<[number, number]>([5, 90])
  const [filterHeightRange, setFilterHeightRange] = useState<[number, number]>([120, 200])
  const [filterWeightRange, setFilterWeightRange] = useState<[number, number]>([30, 120])
  const [proposalModal, setProposalModal] = useState<{ open: boolean; artistUserIds: string[] }>({ open: false, artistUserIds: [] })
  const [proposalMessage, setProposalMessage] = useState("")
  const [proposalCastingId, setProposalCastingId] = useState("none")
  const [sendingProposal, setSendingProposal] = useState(false)
  const [proposalStatusFilter, setProposalStatusFilter] = useState<"all" | "pending" | "accepted" | "rejected">("all")
  const [statusChanging, setStatusChanging] = useState<Set<string>>(new Set())
  const [shortlistAdding, setShortlistAdding] = useState<Set<string>>(new Set())
  const [bookmarkBulkAdding, setBookmarkBulkAdding] = useState(false)
  const [cancellingProposal, setCancellingProposal] = useState<Set<string>>(new Set())
  const [deletingBookmark, setDeletingBookmark] = useState<Set<string>>(new Set())

  // — fetch 함수 —
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

  const fetchShortlist = useCallback(async (castingId: string) => {
    setLoadingShortlist(true)
    try {
      const res = await fetch(`/api/director/shortlists?casting_id=${castingId}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setShortlistMap((prev) => ({ ...prev, [castingId]: data }))
      }
    } catch {
      // silent
    } finally {
      setLoadingShortlist(false)
    }
  }, [])

  const fetchProposals = useCallback(async () => {
    setProposalsLoading(true)
    try {
      const res = await fetch("/api/director/proposals")
      const data = await res.json()
      if (Array.isArray(data)) setProposals(data)
    } catch {
      // silent
    } finally {
      setProposalsLoading(false)
    }
  }, [])

  // — effects —
  useEffect(() => {
    if (!loading) {
      if (profile && profile.role !== "casting_director") {
        router.replace("/")
        return
      }
      // 승인되지 않은 CD에게는 데이터 fetch 자체를 막아 403 호출 낭비 방지
      if (profile?.role === "casting_director" && profile?.cd_approval_status === "approved") {
        fetchCastings()
      }
    }
  }, [loading, profile, router, fetchCastings])

  // profile view는 대시보드 내 인라인 폼으로 처리 (마이페이지 이동 X)

  const isCdApproved = profile?.role === "casting_director" && profile?.cd_approval_status === "approved"

  useEffect(() => {
    if (isCdApproved && activeView === "bookmarks") {
      fetchBookmarks()
    }
  }, [isCdApproved, activeView, fetchBookmarks])

  useEffect(() => {
    if (isCdApproved && activeView === "proposals") {
      fetchProposals()
    }
  }, [isCdApproved, activeView, fetchProposals])

  useEffect(() => {
    if (selectedCastingId && !applicationsMap[selectedCastingId]) {
      fetchApplications(selectedCastingId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCastingId, fetchApplications])

  useEffect(() => {
    if (selectedCastingId && castingDetailTab === "shortlist" && !shortlistMap[selectedCastingId]) {
      fetchShortlist(selectedCastingId)
    }
  }, [selectedCastingId, castingDetailTab, shortlistMap, fetchShortlist])

  useEffect(() => {
    // activeView !== "proposals"일 때만 호출 (proposals 탭에서는 위 effect가 이미 처리)
    if (selectedCastingId && castingDetailTab === "myproposals" && activeView !== "proposals") {
      fetchProposals()
    }
  }, [selectedCastingId, castingDetailTab, activeView, fetchProposals])

  // — 핸들러 —
  const handleStatusChange = useCallback(
    async (castingId: string, applicationId: string, admin_status: string) => {
      setStatusChanging((prev) => new Set(prev).add(applicationId))
      const res = await fetch("/api/director/castings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_id: applicationId, admin_status }),
      })
      setStatusChanging((prev) => { const next = new Set(prev); next.delete(applicationId); return next })
      if (!res.ok) {
        toast({ title: "상태 변경 실패", description: "잠시 후 다시 시도해주세요.", variant: "destructive" })
        return
      }
      setApplicationsMap((prev) => ({
        ...prev,
        [castingId]: (prev[castingId] ?? []).map((a) =>
          a.id === applicationId ? { ...a, admin_status } : a
        ),
      }))
    },
    [toast]
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
    if (id !== "projects") setSelectedCastingId(null)
    setActiveView(id)
  }, [])

  const openProposalModal = useCallback((artistUserIds: string[], castingId?: string) => {
    setProposalModal({ open: true, artistUserIds })
    setProposalMessage("")
    setProposalCastingId(castingId ?? "none")
  }, [])

  const handleSendProposal = useCallback(async () => {
    if (proposalModal.artistUserIds.length === 0) return
    setSendingProposal(true)
    try {
      const res = await fetch("/api/director/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artist_user_ids: proposalModal.artistUserIds,
          casting_id: proposalCastingId !== "none" ? proposalCastingId : undefined,
          message: proposalMessage || undefined,
        }),
      })
      if (!res.ok) {
        toast({ title: "전송 실패", variant: "destructive" })
        return
      }
      toast({
        title: "제안 전송 완료",
        description: `${proposalModal.artistUserIds.length}명에게 제안을 보냈습니다.`,
      })
      setProposalModal({ open: false, artistUserIds: [] })
      setProposalMessage("")
      setProposalCastingId("none")
      setSelectedApplicants(new Set())
    } catch {
      toast({ title: "전송 실패", variant: "destructive" })
    } finally {
      setSendingProposal(false)
    }
  }, [proposalModal, proposalCastingId, proposalMessage, toast])

  const handleShortlistAdd = useCallback(async (castingId: string, artistUserIds: string[]) => {
    artistUserIds.forEach((id) => setShortlistAdding((prev) => new Set(prev).add(id)))
    const res = await fetch("/api/director/shortlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ casting_id: castingId, artist_user_ids: artistUserIds }),
    })
    artistUserIds.forEach((id) => setShortlistAdding((prev) => { const next = new Set(prev); next.delete(id); return next }))
    if (!res.ok) {
      toast({ title: "리스트업 실패", description: "잠시 후 다시 시도해주세요.", variant: "destructive" })
      return
    }
    toast({ title: "리스트업 완료", description: `${artistUserIds.length}명이 1차 리스트에 추가됐습니다.` })
    setShortlistMap((prev) => {
      const copy = { ...prev }
      delete copy[castingId]
      return copy
    })
  }, [toast])

  const handleShortlistRemove = useCallback(async (castingId: string, artistUserId: string) => {
    const res = await fetch("/api/director/shortlists", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ casting_id: castingId, artist_user_id: artistUserId }),
    })
    if (res.ok) {
      setShortlistMap((prev) => ({
        ...prev,
        [castingId]: (prev[castingId] ?? []).filter((s) => s.artist_user_id !== artistUserId),
      }))
    }
  }, [])

  const handleBookmarkBulkAdd = useCallback(async (userIds: string[]) => {
    setBookmarkBulkAdding(true)
    const appsInCasting = selectedCastingId ? (applicationsMap[selectedCastingId] ?? []) : []
    const profileIds = userIds.map((uid) => appsInCasting.find((a) => a.user_id === uid)?.artist_profile_id).filter(Boolean) as string[]
    await Promise.all(
      profileIds.map((id) =>
        fetch("/api/director/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ artist_profile_id: id }),
        })
      )
    )
    setBookmarkBulkAdding(false)
    toast({ title: "보관함에 추가됐습니다", description: `${profileIds.length}명이 나의 배우 보관함에 추가되었습니다.` })
  }, [selectedCastingId, applicationsMap, toast])

  const handleCancelProposal = useCallback(async (proposalId: string) => {
    setCancellingProposal((prev) => new Set(prev).add(proposalId))
    const res = await fetch("/api/director/proposals", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposal_id: proposalId }),
    })
    setCancellingProposal((prev) => { const next = new Set(prev); next.delete(proposalId); return next })
    if (res.ok) {
      setProposals((prev) => prev.filter((p) => p.id !== proposalId))
      toast({ title: "제안이 취소됐습니다." })
    } else {
      toast({ title: "제안 취소 실패", variant: "destructive" })
    }
  }, [toast])

  const toggleApplicant = useCallback((userId: string) => {
    setSelectedApplicants((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }, [])

  // — computed —
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
  const filteredApplications = useMemo(() => {
    if (!applications) return []
    const currentYear = new Date().getFullYear()
    return applications.filter((a) => {
      if (applicantSearch.trim()) {
        const q = applicantSearch.toLowerCase()
        if (!a.profile?.name?.toLowerCase().includes(q)) return false
      }
      if (filterGender !== "전체" && a.gender !== filterGender && !a.gender?.startsWith(filterGender === "남성" ? "남" : "여")) return false
      if (a.birth_date) {
        const age = currentYear - new Date(a.birth_date).getFullYear()
        if (age < filterAgeRange[0] || age > filterAgeRange[1]) return false
      }
      if (a.height !== null && a.height !== undefined) {
        if (a.height < filterHeightRange[0] || a.height > filterHeightRange[1]) return false
      }
      if (a.weight !== null && a.weight !== undefined) {
        if (a.weight < filterWeightRange[0] || a.weight > filterWeightRange[1]) return false
      }
      return true
    })
  }, [applications, applicantSearch, filterGender, filterAgeRange, filterHeightRange, filterWeightRange])

  const shortlist = useMemo(
    () => (selectedCastingId ? (shortlistMap[selectedCastingId] ?? null) : null),
    [selectedCastingId, shortlistMap]
  )
  const castingProposals = useMemo(
    () => proposals.filter((p) => p.casting_id === selectedCastingId),
    [proposals, selectedCastingId]
  )
  const filteredProposals = useMemo(() => {
    if (proposalStatusFilter === "all") return proposals
    return proposals.filter((p) => p.status === proposalStatusFilter)
  }, [proposals, proposalStatusFilter])

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F7F4]">
        <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (profile && profile.role !== "casting_director") {
    router.replace("/")
    return null
  }
  if (!profile) return null

  if (profile?.cd_approval_status !== "approved") {
    const status = profile?.cd_approval_status ?? "pending"
    const statusLabel = status === "rejected" ? "승인 거절됨" : "승인 대기 중"
    const statusColor = status === "rejected" ? "bg-red-100 text-red-700 border-red-200" : "bg-yellow-100 text-yellow-700 border-yellow-200"
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F7F4] p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-7 h-7 text-orange-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">캐스팅 디렉터 승인 대기</h1>
          <p className="text-sm text-gray-500 mb-4">관리자 승인 후 캐스팅 디렉터 기능을 이용하실 수 있습니다.</p>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
            {statusLabel}
          </span>
          <div className="mt-6">
            <Button variant="outline" onClick={() => router.push("/")} className="w-full">
              홈으로
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#F8F7F4]">
      {/* ── 제안 모달 ── */}
      {proposalModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">캐스팅 제안 보내기</h3>
              <button
                onClick={() => setProposalModal({ open: false, artistUserIds: [] })}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm mb-1.5 block">캐스팅 공고 선택</Label>
                <Select value={proposalCastingId} onValueChange={setProposalCastingId}>
                  <SelectTrigger>
                    <SelectValue placeholder="공고를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">공고 없이 제안</SelectItem>
                    {castings.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">메시지 (선택)</Label>
                <Textarea
                  value={proposalMessage}
                  onChange={(e) => setProposalMessage(e.target.value)}
                  placeholder="제안 메시지를 입력하세요"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => setProposalModal({ open: false, artistUserIds: [] })}
                >
                  취소
                </Button>
                <Button
                  onClick={handleSendProposal}
                  disabled={sendingProposal}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {sendingProposal
                    ? "전송 중..."
                    : `제안 보내기 (${proposalModal.artistUserIds.length}명)`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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

        {/* ── projects 목록 뷰 ── */}
        {activeView === "projects" && !selectedCastingId && (
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
                    <p className="text-3xl font-bold text-green-600">{proposals.length}</p>
                    <p className="text-xs text-green-400 mt-1">건</p>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {castings.map((casting) => {
                  const appCount = casting.casting_applications?.[0]?.count ?? 0
                  const style = getCategoryStyle(casting.category)
                  return (
                    <div
                      key={casting.id}
                      onClick={() => {
                        setSelectedCastingId(casting.id)
                        setCastingDetailTab("applicants")
                        setSelectedApplicants(new Set())
                        setApplicantSearch("")
                      }}
                      className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all cursor-pointer group relative"
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

        {/* ── 공고 상세 뷰 ── */}
        {activeView === "projects" && selectedCastingId && selectedCasting && (
          <div className="px-6 py-8">
            {/* 헤더 */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <button
                onClick={() => {
                  setSelectedCastingId(null)
                  setCastingDetailTab("applicants")
                  setSelectedApplicants(new Set())
                  setApplicantSearch("")
                }}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
                공고 목록으로
              </button>
              <span className="text-gray-300 shrink-0">/</span>
              <h2 className="text-base font-bold text-gray-900 truncate flex-1 min-w-0">
                {selectedCasting.title}
              </h2>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(selectedCasting)}
                  className="gap-1"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  공고 수정
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(selectedCasting.id)}
                  className="gap-1 text-red-500 hover:text-red-600 hover:border-red-300"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  공고 삭제
                </Button>
              </div>
            </div>

            {/* 탭 */}
            <div className="flex border-b border-gray-200 mb-6">
              {[
                { id: "applicants" as const, label: "지원자 리스트" },
                { id: "shortlist" as const, label: "1차 리스트업" },
                { id: "myproposals" as const, label: "내가 제안한 리스트" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCastingDetailTab(tab.id)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                    castingDetailTab === tab.id
                      ? "border-orange-500 text-orange-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── 지원자 리스트 탭 ── */}
            {castingDetailTab === "applicants" && (
              <div className="flex gap-4">
                {/* 왼쪽 필터 사이드바 */}
                <div className="w-52 shrink-0 space-y-4 bg-gray-50 rounded-xl p-4 border border-gray-100 self-start sticky top-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">필터</span>
                    <button
                      onClick={() => { setFilterGender("전체"); setFilterAgeRange([5, 90]); setFilterHeightRange([120, 200]); setFilterWeightRange([30, 120]); setApplicantSearch("") }}
                      className="text-xs text-gray-400 hover:text-gray-600 underline"
                    >
                      초기화
                    </button>
                  </div>

                  {/* 이름 검색 */}
                  <Input
                    value={applicantSearch}
                    onChange={(e) => setApplicantSearch(e.target.value)}
                    placeholder="이름, 특기 검색"
                    className="h-8 text-xs"
                  />

                  {/* 성별 */}
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">성별</p>
                    <div className="flex gap-1">
                      {[["전체", "전체"], ["남", "남성"], ["여", "여성"]].map(([label, value]) => (
                        <button
                          key={value}
                          onClick={() => setFilterGender(value)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            filterGender === value ? "bg-orange-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 나이 슬라이더 */}
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      나이 <span className="text-orange-500 font-normal">{filterAgeRange[0]}세 ~ {filterAgeRange[1]}세</span>
                    </p>
                    <Slider
                      min={5} max={90} step={1}
                      value={filterAgeRange}
                      onValueChange={(v) => setFilterAgeRange(v as [number, number])}
                    />
                  </div>

                  {/* 키 슬라이더 */}
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      키 <span className="text-orange-500 font-normal">{filterHeightRange[0]}cm ~ {filterHeightRange[1]}cm</span>
                    </p>
                    <Slider
                      min={120} max={200} step={1}
                      value={filterHeightRange}
                      onValueChange={(v) => setFilterHeightRange(v as [number, number])}
                    />
                  </div>

                  {/* 몸무게 슬라이더 */}
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      몸무게 <span className="text-orange-500 font-normal">{filterWeightRange[0]}kg ~ {filterWeightRange[1]}kg</span>
                    </p>
                    <Slider
                      min={30} max={120} step={1}
                      value={filterWeightRange}
                      onValueChange={(v) => setFilterWeightRange(v as [number, number])}
                    />
                  </div>
                </div>

                {/* 오른쪽 카드 영역 */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-3">총 {filteredApplications.length}명의 지원자</p>

                  {loadingApps ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="w-6 h-6 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : filteredApplications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                      <Users className="w-10 h-10 opacity-30" />
                      <p className="text-sm">지원자가 없습니다</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                      {filteredApplications.map((app) => {
                        const isChecked = selectedApplicants.has(app.user_id)
                        const birthYear = app.birth_date ? new Date(app.birth_date).getFullYear() : null
                        const age = birthYear ? new Date().getFullYear() - birthYear : null
                        const infoLine = [
                          app.gender,
                          age ? `${age}세` : null,
                          app.height ? `${app.height}cm` : null,
                          app.weight ? `${app.weight}kg` : null,
                        ].filter(Boolean).join(" · ")
                        return (
                          <div
                            key={app.id}
                            className={`bg-white rounded-xl border overflow-hidden shadow-sm transition-all ${
                              isChecked ? "border-orange-300 ring-2 ring-orange-200" : "border-gray-100 hover:shadow-md"
                            }`}
                          >
                            {/* 사진 + 체크박스 */}
                            <div className="aspect-square relative bg-gray-100">
                              {app.main_photo ? (
                                <Image src={app.main_photo} alt={app.profile?.name ?? ""} fill className="object-cover" />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Users className="w-8 h-8 text-gray-300" />
                                </div>
                              )}
                              <label className="absolute top-2 left-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleApplicant(app.user_id)}
                                  className="w-4 h-4 accent-orange-500"
                                />
                              </label>
                              <span className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold border ${statusColors[app.admin_status] ?? statusColors["대기"]}`}>
                                {app.admin_status}
                              </span>
                            </div>

                            {/* 정보 */}
                            <div className="p-2.5 space-y-2">
                              <div>
                                <p className="font-semibold text-gray-900 text-sm truncate">
                                  {app.profile?.name ?? "이름 없음"}
                                </p>
                                {infoLine && (
                                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">{infoLine}</p>
                                )}
                                {app.status_tags && app.status_tags.length > 0 && (
                                  <div className="flex flex-wrap gap-0.5 mt-1">
                                    {app.status_tags.slice(0, 3).map((tag) => (
                                      <span key={tag} className="text-[10px] text-orange-500">#{tag}</span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* 상태 변경 */}
                              <Select
                                value={app.admin_status}
                                onValueChange={(v) => handleStatusChange(selectedCasting.id, app.id, v)}
                                disabled={statusChanging.has(app.id)}
                              >
                                <SelectTrigger className="h-7 text-xs w-full">
                                  {statusChanging.has(app.id) ? <span className="text-muted-foreground">저장 중...</span> : <SelectValue />}
                                </SelectTrigger>
                                <SelectContent>
                                  {STATUS_OPTIONS.map((s) => (
                                    <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              {/* 버튼 */}
                              <div className="flex gap-1.5">
                                {app.artist_profile_id && (
                                  <Link
                                    href={`/artists/${app.artist_profile_id}`}
                                    target="_blank"
                                    className="flex-1 h-7 text-[11px] flex items-center justify-center gap-0.5 border border-gray-200 rounded-md text-gray-500 hover:bg-gray-50 transition-colors"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    상세
                                  </Link>
                                )}
                                {app.portfolio_url && (() => {
                                  const yr = app.birth_date ? String(new Date(app.birth_date).getFullYear()).slice(2) : null
                                  const nameLabel = app.profile?.name ?? "배우"
                                  const castingTitle = selectedCasting?.title ?? "공고"
                                  const filename = [castingTitle, yr ? `${yr}년` : null, app.gender, nameLabel, "프로필"].filter(Boolean).join("_") + ".pdf"
                                  return (
                                    <a
                                      href={`/api/pdf-proxy?url=${encodeURIComponent(app.portfolio_url!)}&filename=${encodeURIComponent(filename)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-1 h-7 text-[11px] flex items-center justify-center gap-0.5 border border-gray-200 rounded-md text-gray-500 hover:bg-gray-50 transition-colors"
                                      title={filename}
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                      PDF
                                    </a>
                                  )
                                })()}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 h-7 text-[11px] px-1"
                                  disabled={shortlistAdding.has(app.user_id)}
                                  onClick={() => handleShortlistAdd(selectedCastingId, [app.user_id])}
                                >
                                  {shortlistAdding.has(app.user_id) ? "추가 중..." : "리스트업"}
                                </Button>
                              </div>
                              <Button
                                size="sm"
                                className="w-full h-7 text-[11px] bg-orange-500 hover:bg-orange-600 text-white"
                                onClick={() => handleStatusChange(selectedCasting!.id, app.id, "최종합격")}
                                disabled={statusChanging.has(app.id)}
                              >
                                {statusChanging.has(app.id) ? "저장 중..." : "📎 캐스팅 픽스 (최종합격)"}
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* 하단 액션바 */}
                  {selectedApplicants.size > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-xl shadow-2xl px-5 py-3 flex items-center gap-2 z-30 flex-wrap justify-center">
                      <span className="text-sm font-medium">{selectedApplicants.size}명 선택</span>
                      <button
                        onClick={() => setSelectedApplicants(new Set())}
                        className="text-xs text-gray-300 hover:text-white underline transition-colors"
                      >
                        선택 해제
                      </button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20"
                        disabled={bookmarkBulkAdding}
                        onClick={() => handleBookmarkBulkAdd(Array.from(selectedApplicants))}
                      >
                        {bookmarkBulkAdding ? "추가 중..." : "보관함에 담기"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20"
                        onClick={() => handleShortlistAdd(selectedCastingId, Array.from(selectedApplicants))}
                      >
                        공고 리스트업
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-orange-500 hover:bg-orange-600 text-white border-0"
                        onClick={() => openProposalModal(Array.from(selectedApplicants), selectedCastingId)}
                      >
                        일괄 캐스팅 제안
                      </Button>
                      <button
                        onClick={() => setSelectedApplicants(new Set())}
                        className="text-gray-400 hover:text-white transition-colors ml-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── 1차 리스트업 탭 ── */}
            {castingDetailTab === "shortlist" && (
              <div>
                {loadingShortlist ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-6 h-6 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : !shortlist || shortlist.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                    <Users className="w-10 h-10 opacity-30" />
                    <p className="text-sm">리스트업된 배우가 없습니다</p>
                    <p className="text-xs text-gray-300">지원자 목록에서 배우를 리스트업하세요</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {shortlist.map((item) => {
                        const birthYear = item.artist_profile?.birth_date
                          ? new Date(item.artist_profile.birth_date).getFullYear()
                          : null
                        const age = birthYear ? new Date().getFullYear() - birthYear : null
                        return (
                          <div
                            key={item.id}
                            className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm"
                          >
                            <div className="aspect-[3/4] relative bg-gray-100">
                              {item.main_photo ? (
                                <Image
                                  src={item.main_photo}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Users className="w-8 h-8 text-gray-300" />
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {[
                                  item.artist_profile?.gender,
                                  age ? `${age}세` : null,
                                  item.artist_profile?.height
                                    ? `${item.artist_profile.height}cm`
                                    : null,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                              <div className="flex gap-1.5 mt-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs px-2 flex-1 gap-1"
                                  onClick={() =>
                                    handleShortlistRemove(selectedCastingId, item.artist_user_id)
                                  }
                                >
                                  <X className="w-3 h-3" />
                                  제거
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-7 text-xs px-2 flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                                  onClick={() =>
                                    openProposalModal([item.artist_user_id], selectedCastingId)
                                  }
                                >
                                  제안
                                </Button>
                              </div>
                              {item.portfolio_url && (() => {
                                const birthYear = item.artist_profile?.birth_date ? String(new Date(item.artist_profile.birth_date).getFullYear()).slice(2) : null
                                const filename = [birthYear ? `${birthYear}년` : null, item.name, "프로필"].filter(Boolean).join("_") + ".pdf"
                                return (
                                  <a
                                    href={`/api/pdf-proxy?url=${encodeURIComponent(item.portfolio_url!)}&filename=${encodeURIComponent(filename)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-1.5 w-full text-xs text-gray-500 hover:text-blue-500 transition-colors py-1 flex items-center justify-center gap-1 border border-gray-200 rounded-lg"
                                  >
                                    <Download className="w-3 h-3" />
                                    PDF 다운로드
                                  </a>
                                )
                              })()}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-6 flex justify-end">
                      <Button
                        className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
                        onClick={() =>
                          openProposalModal(
                            shortlist.map((s) => s.artist_user_id),
                            selectedCastingId
                          )
                        }
                      >
                        <Send className="w-4 h-4" />
                        일괄 제안 보내기
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── 내가 제안한 리스트 탭 ── */}
            {castingDetailTab === "myproposals" && (
              <div>
                {proposalsLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-6 h-6 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : castingProposals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                    <Send className="w-10 h-10 opacity-30" />
                    <p className="text-sm">이 공고에 보낸 제안이 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {castingProposals.map((p) => (
                      <div
                        key={p.id}
                        className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{p.artist_name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(p.created_at).toLocaleDateString("ko-KR")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {p.portfolio_url && (
                            <a
                              href={`/api/pdf-proxy?url=${encodeURIComponent(p.portfolio_url)}&filename=${encodeURIComponent(p.artist_name + "_프로필.pdf")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-gray-400 hover:text-blue-500 transition-colors flex items-center gap-1 border border-gray-200 rounded-lg px-2 py-1"
                            >
                              <Download className="w-3 h-3" />
                              PDF
                            </a>
                          )}
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${
                              PROPOSAL_STATUS_COLOR[p.status]
                            }`}
                          >
                            {PROPOSAL_STATUS_LABEL[p.status]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
                  <Label htmlFor="role_type">역할 유형</Label>
                  <Select value={form.role_type} onValueChange={(v) => updateForm("role_type", v)}>
                    <SelectTrigger id="role_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_TYPES.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <div className="grid grid-cols-2 gap-2">
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
                  <div className="space-y-2">
                    <Label htmlFor="birth_year_end">출생연도 종료</Label>
                    <Input
                      id="birth_year_end"
                      type="number"
                      value={form.birth_year_end}
                      onChange={(e) => updateForm("birth_year_end", e.target.value)}
                      placeholder="예: 2005"
                    />
                  </div>
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
                  <Button variant="outline" size="sm" className="mt-2">
                    배우 목록 보기
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {bookmarks.map((bm) => {
                  const ap = bm.artist_profiles
                  const name = ap?.profiles?.name ?? "-"
                  const mainPhoto = bm.main_photo
                  const birthYear = ap?.birth_date ? new Date(ap.birth_date).getFullYear() : null
                  const age = birthYear ? new Date().getFullYear() - birthYear : null
                  const portfolioUrl = ap?.portfolio_url
                  const infoLine = [age ? `${age}세` : null, ap?.gender, ap?.height ? `${ap.height}cm` : null].filter(Boolean).join(" | ")

                  return (
                    <div
                      key={bm.id}
                      className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
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
                        {infoLine && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{infoLine}</p>
                        )}
                      </div>
                      <div className="px-3 pb-3 flex gap-1.5">
                        <Link
                          href={`/artists/${bm.artist_profile_id}`}
                          target="_blank"
                          className="flex-1 text-xs text-gray-500 hover:text-blue-500 transition-colors py-1.5 flex items-center justify-center gap-1 border border-gray-200 rounded-lg"
                        >
                          <ExternalLink className="w-3 h-3" />
                          프로필
                        </Link>
                        {portfolioUrl && (
                          <a
                            href={`/api/pdf-proxy?url=${encodeURIComponent(portfolioUrl)}&filename=${encodeURIComponent(name + "_프로필.pdf")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-xs text-gray-500 hover:text-blue-500 transition-colors py-1.5 flex items-center justify-center gap-1 border border-gray-200 rounded-lg"
                          >
                            <Download className="w-3 h-3" />
                            다운로드
                          </a>
                        )}
                        <button
                          disabled={deletingBookmark.has(bm.id)}
                          onClick={async () => {
                            setDeletingBookmark((prev) => new Set(prev).add(bm.id))
                            const res = await fetch("/api/director/bookmarks", {
                              method: "DELETE",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ artist_profile_id: bm.artist_profile_id }),
                            })
                            setDeletingBookmark((prev) => { const next = new Set(prev); next.delete(bm.id); return next })
                            if (res.ok) setBookmarks((prev) => prev.filter((b) => b.id !== bm.id))
                          }}
                          className="flex-1 text-xs text-gray-400 hover:text-red-500 transition-colors py-1.5 flex items-center justify-center gap-1 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingBookmark.has(bm.id) ? <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : <X className="w-3 h-3" />}
                          {deletingBookmark.has(bm.id) ? "삭제 중..." : "삭제"}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── profile 뷰 ── */}
        {activeView === "profile" && profile && (
          <ProfileViewPanel
            initialName={profile.name ?? ""}
            initialPhone={(profile as unknown as { phone?: string }).phone ?? ""}
            email={profile.email ?? ""}
            initialCompany={(profile as unknown as { company?: string }).company ?? ""}
            initialJobTitle={(profile as unknown as { job_title?: string }).job_title ?? ""}
          />
        )}

        {/* ── proposals 뷰 ── */}
        {activeView === "proposals" && (
          <div className="px-6 py-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
                <Send className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">보낸 제안 관리</h2>
                <p className="text-sm text-gray-500">아티스트에게 보낸 캐스팅 제안을 확인하세요.</p>
              </div>
            </div>

            {/* 상태 필터 탭 */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {(
                [
                  { id: "all" as const, label: "전체" },
                  { id: "pending" as const, label: "대기" },
                  { id: "accepted" as const, label: "수락" },
                  { id: "rejected" as const, label: "거절" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setProposalStatusFilter(tab.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    proposalStatusFilter === tab.id
                      ? "bg-orange-500 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {proposalsLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredProposals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                <Send className="w-10 h-10 opacity-30" />
                <p className="text-sm">보낸 제안이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProposals.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">{p.artist_name}</p>
                        {p.casting_title && (
                          <span className="text-xs text-gray-400 truncate max-w-[200px]">
                            {p.casting_title}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(p.created_at).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${
                          PROPOSAL_STATUS_COLOR[p.status]
                        }`}
                      >
                        {PROPOSAL_STATUS_LABEL[p.status]}
                      </span>
                      {p.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2 text-red-500 hover:text-red-600 hover:border-red-300"
                          disabled={cancellingProposal.has(p.id)}
                          onClick={() => handleCancelProposal(p.id)}
                        >
                          {cancellingProposal.has(p.id) ? "취소 중..." : "취소"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

// ── 프로필 관리 패널 (캐스팅 디렉터 전용) ──────────────────────
function ProfileViewPanel({
  initialName,
  initialPhone,
  email,
  initialCompany,
  initialJobTitle,
}: {
  initialName: string
  initialPhone: string
  email: string
  initialCompany: string
  initialJobTitle: string
}) {
  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
          <User className="w-5 h-5 text-orange-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">내 프로필 관리</h2>
          <p className="text-sm text-gray-500">캐스팅 디렉터 프로필 정보를 관리합니다.</p>
        </div>
      </div>

      {/* 아바타 + 이름 카드 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4 flex items-center gap-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
          <User className="w-8 h-8 text-gray-400" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-base">{initialName || "이름 없음"}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            캐스팅 디렉터{initialCompany ? ` | ${initialCompany}` : ""}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-600">
              인증됨
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-600">
              프리뷰어
            </span>
          </div>
        </div>
      </div>

      <DirectorProfileForm
        initialName={initialName}
        initialPhone={initialPhone}
        email={email}
        initialCompany={initialCompany}
        initialJobTitle={initialJobTitle}
      />
    </div>
  )
}
