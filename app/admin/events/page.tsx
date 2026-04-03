"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
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

type Event = {
  id: string
  title: string
  type: string
  status: string
  description: string | null
  detail_content: string | null
  director: string | null
  project_name: string | null
  location: string | null
  event_time: string | null
  deadline: string | null
  is_member_only: boolean | null
  created_at: string | null
  image_url: string | null
  event_applications: { count: number }[]
}

type EventForm = {
  title: string
  type: string
  status: string
  description: string
  director: string
  project_name: string
  location: string
  event_time: string
  deadline: string
  is_member_only: boolean
}

type Application = {
  id: string
  result: string | null
  applied_at: string | null
  user_id: string
  profile: {
    name: string | null
    email: string | null
    phone: string | null
  } | null
  portfolio_url: string | null
}

const defaultForm: EventForm = {
  title: "",
  type: "오디션",
  status: "예정",
  description: "",
  director: "",
  project_name: "",
  location: "",
  event_time: "",
  deadline: "",
  is_member_only: false,
}

const statusColors: Record<string, string> = {
  "진행중": "bg-green-100 text-green-700",
  "마감": "bg-gray-100 text-gray-600",
  "예정": "bg-blue-100 text-blue-700",
}

const resultOptions = ["검토중", "다음기회에", "합격"]

async function uploadEventImage(file: File, eventId: string): Promise<string | null> {
  const supabase = createClient()
  const ext = file.name.split(".").pop()
  const path = `${eventId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from("event-images").upload(path, file, { upsert: true })
  if (error) return null
  const { data } = supabase.storage.from("event-images").getPublicUrl(path)
  return data.publicUrl
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [form, setForm] = useState<EventForm>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 이미지 업로드
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 지원자 모달
  const [applicantsDialogOpen, setApplicantsDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [applicationsLoading, setApplicationsLoading] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [])

  async function fetchEvents() {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("events")
      .select("id, title, type, status, description, detail_content, director, project_name, location, event_time, deadline, is_member_only, created_at, image_url, event_applications(count)")
      .order("created_at", { ascending: false })

    if (error) setError(error.message)
    else setEvents((data ?? []) as Event[])
    setLoading(false)
  }

  async function fetchApplications(eventId: string) {
    setApplicationsLoading(true)
    const supabase = createClient()

    const { data: apps, error: appsError } = await supabase
      .from("event_applications")
      .select("id, result, applied_at, user_id")
      .eq("event_id", eventId)
      .order("applied_at", { ascending: false })

    if (appsError || !apps) {
      setApplicationsLoading(false)
      return
    }

    const enriched: Application[] = await Promise.all(
      apps.map(async (app) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, email, phone")
          .eq("id", app.user_id)
          .single()

        const { data: artistProfile } = await supabase
          .from("artist_profiles")
          .select("portfolio_url")
          .eq("user_id", app.user_id)
          .single()

        return {
          id: app.id,
          result: app.result,
          applied_at: app.applied_at,
          user_id: app.user_id,
          profile: profile ?? null,
          portfolio_url: artistProfile?.portfolio_url ?? null,
        }
      })
    )

    setApplications(enriched)
    setApplicationsLoading(false)
  }

  function openAddDialog() {
    setEditingEvent(null)
    setForm(defaultForm)
    setImageFile(null)
    setImagePreview(null)
    setDialogOpen(true)
  }

  function openEditDialog(event: Event) {
    setEditingEvent(event)
    setForm({
      title: event.title,
      type: event.type,
      status: event.status,
      description: event.description ?? "",
      director: event.director ?? "",
      project_name: event.project_name ?? "",
      location: event.location ?? "",
      event_time: event.event_time ?? "",
      deadline: event.deadline ?? "",
      is_member_only: event.is_member_only ?? false,
    })
    setImageFile(null)
    setImagePreview(event.image_url ?? null)
    setDialogOpen(true)
  }

  function openApplicantsDialog(event: Event) {
    setSelectedEvent(event)
    setApplications([])
    setApplicantsDialogOpen(true)
    fetchApplications(event.id)
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    if (!form.title.trim()) {
      setError("제목을 입력해주세요.")
      return
    }
    setSaving(true)
    setError(null)
    const supabase = createClient()

    let imageUrl: string | null = editingEvent?.image_url ?? null

    if (imageFile) {
      const eventId = editingEvent?.id ?? String(Date.now())
      const uploaded = await uploadEventImage(imageFile, eventId)
      if (uploaded) imageUrl = uploaded
    }

    const payload = {
      title: form.title,
      type: form.type,
      status: form.status,
      description: form.description || null,
      director: form.director || null,
      project_name: form.project_name || null,
      location: form.location || null,
      event_time: form.event_time || null,
      deadline: form.deadline || null,
      is_member_only: form.is_member_only,
      image_url: imageUrl,
    }

    if (editingEvent) {
      const { error } = await supabase
        .from("events")
        .update(payload)
        .eq("id", editingEvent.id)
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.from("events").insert(payload)
      if (error) setError(error.message)
    }

    await fetchEvents()
    setDialogOpen(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("이 이벤트를 삭제하시겠습니까?")) return
    const supabase = createClient()
    const { error } = await supabase.from("events").delete().eq("id", id)
    if (error) setError(error.message)
    else await fetchEvents()
  }

  async function handleResultChange(applicationId: string, result: string) {
    const supabase = createClient()
    await supabase
      .from("event_applications")
      .update({ result })
      .eq("id", applicationId)

    setApplications((prev) =>
      prev.map((a) => (a.id === applicationId ? { ...a, result } : a))
    )
  }

  const updateForm = (key: keyof EventForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">이벤트 관리</h1>
          <p className="text-sm text-gray-500 mt-1">이벤트 / 오디션 / 워크샵 목록</p>
        </div>
        <Button
          onClick={openAddDialog}
          className="bg-gray-900 hover:bg-gray-700 text-white"
        >
          이벤트 추가
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
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">타입</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">지원자 수</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">마감일</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">작성일</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-sm text-gray-900 max-w-xs truncate">
                      <button
                        className="text-left hover:underline hover:text-orange-600 transition-colors"
                        onClick={() => openApplicantsDialog(event)}
                      >
                        {event.title}
                      </button>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">{event.type}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[event.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      <button
                        className="hover:underline hover:text-orange-600 transition-colors"
                        onClick={() => openApplicantsDialog(event)}
                      >
                        {event.event_applications?.[0]?.count ?? 0}명
                      </button>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500">
                      {event.deadline
                        ? new Date(event.deadline).toLocaleDateString("ko-KR")
                        : "-"}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500">
                      {event.created_at
                        ? new Date(event.created_at).toLocaleDateString("ko-KR")
                        : "-"}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(event)}
                          className="text-xs"
                        >
                          수정
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(event.id)}
                          className="text-xs"
                        >
                          삭제
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-400">
                      이벤트가 없습니다
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "이벤트 수정" : "이벤트 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>제목 *</Label>
              <Input
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
                placeholder="이벤트 제목"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>타입</Label>
                <Select value={form.type} onValueChange={(v) => updateForm("type", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="오디션">오디션</SelectItem>
                    <SelectItem value="이벤트">이벤트</SelectItem>
                    <SelectItem value="워크샵">워크샵</SelectItem>
                  </SelectContent>
                </Select>
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
            </div>

            <div className="space-y-2">
              <Label>설명</Label>
              <Textarea
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                placeholder="이벤트 설명"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>감독/연출</Label>
                <Input
                  value={form.director}
                  onChange={(e) => updateForm("director", e.target.value)}
                  placeholder="감독명"
                />
              </div>
              <div className="space-y-2">
                <Label>프로젝트명</Label>
                <Input
                  value={form.project_name}
                  onChange={(e) => updateForm("project_name", e.target.value)}
                  placeholder="프로젝트명"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>장소</Label>
              <Input
                value={form.location}
                onChange={(e) => updateForm("location", e.target.value)}
                placeholder="장소"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>이벤트 일시</Label>
                <Input
                  type="datetime-local"
                  value={form.event_time}
                  onChange={(e) => updateForm("event_time", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>마감일</Label>
                <Input
                  type="datetime-local"
                  value={form.deadline}
                  onChange={(e) => updateForm("deadline", e.target.value)}
                />
              </div>
            </div>

            {/* 포스터 이미지 업로드 */}
            <div className="space-y-2">
              <Label>포스터 이미지</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
              />
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="포스터 미리보기"
                    className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_member_only"
                checked={form.is_member_only}
                onChange={(e) => updateForm("is_member_only", e.target.checked)}
                className="w-4 h-4 accent-orange-500"
              />
              <Label htmlFor="is_member_only" className="cursor-pointer">
                멤버 전용
              </Label>
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

      {/* 지원자 관리 모달 */}
      <Dialog open={applicantsDialogOpen} onOpenChange={setApplicantsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              지원자 목록 — {selectedEvent?.title}
            </DialogTitle>
          </DialogHeader>

          {applicationsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-7 h-7 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : applications.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">지원자가 없습니다</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">이름</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">이메일</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">전화번호</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">지원일시</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">포트폴리오</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">결과</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2 text-gray-900">{app.profile?.name ?? "-"}</td>
                      <td className="px-4 py-2 text-gray-600">{app.profile?.email ?? "-"}</td>
                      <td className="px-4 py-2 text-gray-600">{app.profile?.phone ?? "-"}</td>
                      <td className="px-4 py-2 text-gray-500">
                        {app.applied_at
                          ? new Date(app.applied_at).toLocaleString("ko-KR")
                          : "-"}
                      </td>
                      <td className="px-4 py-2">
                        {app.portfolio_url ? (
                          <a
                            href={app.portfolio_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-600 hover:underline text-xs"
                          >
                            PDF 다운로드
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <Select
                          value={app.result ?? "검토중"}
                          onValueChange={(v) => handleResultChange(app.id, v)}
                        >
                          <SelectTrigger className="h-7 text-xs w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {resultOptions.map((opt) => (
                              <SelectItem key={opt} value={opt} className="text-xs">
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setApplicantsDialogOpen(false)}>
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
