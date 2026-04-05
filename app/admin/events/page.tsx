"use client"

import { Fragment, useEffect, useRef, useState } from "react"
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
import { Calendar, ChevronDown, ChevronUp, Pencil, Trash2, Users, FileDown } from "lucide-react"

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
  profile: { name: string | null; email: string | null; phone: string | null } | null
  portfolio_url: string | null
}

const defaultForm: EventForm = {
  title: "", type: "오디션", status: "예정", description: "",
  director: "", project_name: "", location: "", event_time: "", deadline: "", is_member_only: false,
}

const statusColors: Record<string, string> = {
  "진행중": "bg-green-100 text-green-700",
  "마감": "bg-gray-100 text-gray-600",
  "예정": "bg-blue-100 text-blue-700",
}

const resultColors: Record<string, string> = {
  "합격": "bg-green-100 text-green-700 border-green-200",
  "다음기회에": "bg-gray-100 text-gray-500 border-gray-200",
  "검토중": "bg-yellow-100 text-yellow-700 border-yellow-200",
}

const resultOptions = ["검토중", "다음기회에", "합격"]

async function uploadEventImage(file: File, folderId: string): Promise<string> {
  const supabase = createClient()
  const ext = file.name.split(".").pop()
  const path = `${folderId}/${Date.now()}.${ext}`
  console.log("[uploadEventImage] uploading to path:", path)
  const { error } = await supabase.storage.from("event-images").upload(path, file, { upsert: true })
  if (error) {
    console.error("[uploadEventImage] error:", error)
    throw new Error(`이미지 업로드 실패: ${error.message}`)
  }
  const { data } = supabase.storage.from("event-images").getPublicUrl(path)
  console.log("[uploadEventImage] success:", data.publicUrl)
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

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 인라인 확장 상태
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
  const [applicationsMap, setApplicationsMap] = useState<Record<string, Application[]>>({})
  const [loadingApps, setLoadingApps] = useState<string | null>(null)

  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null)
  const [pdfViewerName, setPdfViewerName] = useState<string>("")

  useEffect(() => { fetchEvents() }, [])

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
    if (applicationsMap[eventId]) return // 이미 로드됨
    setLoadingApps(eventId)
    const supabase = createClient()
    const { data: apps } = await supabase
      .from("event_applications")
      .select("id, result, applied_at, user_id")
      .eq("event_id", eventId)
      .order("applied_at", { ascending: false })

    if (!apps) { setLoadingApps(null); return }

    const enriched: Application[] = await Promise.all(
      apps.map(async (app) => {
        const [{ data: profile }, { data: artistProfile }] = await Promise.all([
          supabase.from("profiles").select("name, email, phone").eq("id", app.user_id).single(),
          supabase.from("artist_profiles").select("portfolio_url").eq("user_id", app.user_id).single(),
        ])
        return { id: app.id, result: app.result, applied_at: app.applied_at, user_id: app.user_id, profile: profile ?? null, portfolio_url: artistProfile?.portfolio_url ?? null }
      })
    )

    setApplicationsMap((prev) => ({ ...prev, [eventId]: enriched }))
    setLoadingApps(null)
  }

  function toggleExpand(eventId: string) {
    if (expandedEventId === eventId) {
      setExpandedEventId(null)
    } else {
      setExpandedEventId(eventId)
      fetchApplications(eventId)
    }
  }

  async function handleResultChange(eventId: string, applicationId: string, result: string) {
    const supabase = createClient()
    await supabase.from("event_applications").update({ result }).eq("id", applicationId)
    setApplicationsMap((prev) => ({
      ...prev,
      [eventId]: (prev[eventId] ?? []).map((a) => a.id === applicationId ? { ...a, result } : a),
    }))
  }

  function downloadApplicantsPDF(event: Event) {
    const apps = applicationsMap[event.id] ?? []
    if (apps.length === 0) return
    const rows = apps.map((app) => `
      <tr>
        <td>${app.profile?.name ?? "-"}</td>
        <td>${app.profile?.email ?? "-"}</td>
        <td>${app.profile?.phone ?? "-"}</td>
        <td>${app.applied_at ? new Date(app.applied_at).toLocaleString("ko-KR") : "-"}</td>
        <td>${app.result ?? "검토중"}</td>
      </tr>`).join("")
    const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>${event.title} - 신청자 목록</title>
    <style>body{font-family:sans-serif;padding:24px;color:#111}h1{font-size:18px;margin-bottom:4px}p{font-size:12px;color:#666;margin-bottom:16px}table{width:100%;border-collapse:collapse;font-size:13px}th{background:#f3f4f6;text-align:left;padding:8px 12px;border-bottom:2px solid #e5e7eb}td{padding:8px 12px;border-bottom:1px solid #f3f4f6}@media print{body{padding:0}}</style>
    </head><body>
    <h1>${event.title} — 신청자 목록</h1>
    <p>총 ${apps.length}명 · 출력일: ${new Date().toLocaleDateString("ko-KR")}</p>
    <table><thead><tr><th>이름</th><th>이메일</th><th>전화번호</th><th>지원일시</th><th>결과</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <script>window.onload=function(){window.print()}<\/script></body></html>`
    const win = window.open("", "_blank")
    if (win) { win.document.write(html); win.document.close() }
  }

  function openAddDialog() {
    setEditingEvent(null); setForm(defaultForm); setImageFile(null); setImagePreview(null); setDialogOpen(true)
  }

  function openEditDialog(event: Event) {
    setEditingEvent(event)
    setForm({ title: event.title, type: event.type, status: event.status, description: event.description ?? "", director: event.director ?? "", project_name: event.project_name ?? "", location: event.location ?? "", event_time: event.event_time ?? "", deadline: event.deadline ?? "", is_member_only: event.is_member_only ?? false })
    setImageFile(null); setImagePreview(event.image_url ?? null); setDialogOpen(true)
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    if (!form.title.trim()) { setError("제목을 입력해주세요."); return }
    setSaving(true); setError(null)
    let imageUrl: string | null = editingEvent?.image_url ?? null
    try {
      if (imageFile) {
        const eventId = editingEvent?.id ?? String(Date.now())
        imageUrl = await uploadEventImage(imageFile, eventId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "이미지 업로드 실패")
      setSaving(false)
      return
    }
    const payload = { title: form.title, type: form.type, status: form.status, description: form.description || null, director: form.director || null, project_name: form.project_name || null, location: form.location || null, event_time: form.event_time || null, deadline: form.deadline || null, is_member_only: form.is_member_only, image_url: imageUrl }

    const res = await fetch("/api/admin/events", {
      method: editingEvent ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingEvent ? { id: editingEvent.id, ...payload } : payload),
    })
    if (!res.ok) {
      const err = await res.json()
      setError(err.error ?? "저장 실패")
      setSaving(false)
      return
    }
    await fetchEvents(); setDialogOpen(false); setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("이 이벤트를 삭제하시겠습니까?")) return
    const res = await fetch("/api/admin/events", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) {
      const err = await res.json()
      setError(err.error ?? "삭제 실패")
      return
    }
    if (expandedEventId === id) setExpandedEventId(null)
    await fetchEvents()
  }

  const updateForm = (key: keyof EventForm, value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">이벤트 관리</h1>
          <p className="text-sm text-gray-500 mt-1">이벤트 / 오디션 / 워크샵 목록</p>
        </div>
        <Button onClick={openAddDialog} className="bg-gray-900 hover:bg-gray-700 text-white">이벤트 추가</Button>
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
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">이미지</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">타입</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">마감일</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">작성일</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">지원자</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const isExpanded = expandedEventId === event.id
                  const apps = applicationsMap[event.id]
                  const appCount = event.event_applications?.[0]?.count ?? 0

                  return (
                    <Fragment key={event.id}>
                      <tr
                        className={`border-b border-gray-50 transition-colors ${isExpanded ? "bg-orange-50" : "hover:bg-gray-50"}`}
                      >
                        <td className="px-4 py-3">
                          {event.image_url ? (
                            <img src={event.image_url} alt={event.title} className="w-12 h-12 object-cover rounded-md border border-gray-200" />
                          ) : (
                            <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-900 font-medium max-w-xs truncate">
                          {event.title}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600 whitespace-nowrap">{event.type}</td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[event.status] ?? "bg-gray-100 text-gray-600"}`}>
                            {event.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {event.deadline ? new Date(event.deadline).toLocaleDateString("ko-KR") : "-"}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {event.created_at ? new Date(event.created_at).toLocaleDateString("ko-KR") : "-"}
                        </td>
                        <td className="px-6 py-3">
                          <button
                            onClick={() => toggleExpand(event.id)}
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
                              onClick={() => openEditDialog(event)}
                              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                              title="수정"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(event.id)}
                              className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                              title="삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* 인라인 지원자 패널 */}
                      {isExpanded && (
                        <tr key={`${event.id}-expanded`} className="border-b border-orange-100">
                          <td colSpan={8} className="p-0">
                            <div className="bg-orange-50/50 border-t border-orange-100">
                              {/* 패널 헤더 */}
                              <div className="flex items-center justify-between px-6 py-3 border-b border-orange-100">
                                <div>
                                  <p className="text-sm font-semibold text-gray-800">{event.title} — 지원자 목록</p>
                                  <p className="text-xs text-gray-500 mt-0.5">총 {appCount}명 지원</p>
                                </div>
                                <button
                                  onClick={() => downloadApplicantsPDF(event)}
                                  disabled={!apps || apps.length === 0}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                  <FileDown className="w-3.5 h-3.5" />
                                  PDF 출력
                                </button>
                              </div>

                              {/* 지원자 테이블 */}
                              {loadingApps === event.id ? (
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
                                        <th className="text-left px-6 py-2.5 text-xs font-medium text-gray-500">결과</th>
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
                                              <div className="flex items-center gap-2">
                                                <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline text-xs">PDF 보기</a>
                                                <button
                                                  onClick={() => { setPdfViewerUrl(app.portfolio_url!); setPdfViewerName(app.profile?.name ?? "지원자") }}
                                                  className="text-xs px-2 py-0.5 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                                                >
                                                  미리보기
                                                </button>
                                              </div>
                                            ) : <span className="text-gray-400 text-xs">-</span>}
                                          </td>
                                          <td className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${resultColors[app.result ?? "검토중"]}`}>
                                                {app.result ?? "검토중"}
                                              </span>
                                              <Select
                                                value={app.result ?? "검토중"}
                                                onValueChange={(v) => handleResultChange(event.id, app.id, v)}
                                              >
                                                <SelectTrigger className="h-7 text-xs w-32 bg-white">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {resultOptions.map((opt) => (
                                                    <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
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
                {events.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-400">이벤트가 없습니다</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PDF 뷰어 모달 */}
      <Dialog open={!!pdfViewerUrl} onOpenChange={(open) => { if (!open) setPdfViewerUrl(null) }}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{pdfViewerName} 포트폴리오</DialogTitle>
          </DialogHeader>
          {pdfViewerUrl && (
            <div className="space-y-2">
              <div className="flex justify-end">
                <a href={pdfViewerUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:underline">새 탭에서 열기 ↗</a>
              </div>
              <iframe
                src={`/api/pdf-proxy?url=${encodeURIComponent(pdfViewerUrl)}`}
                className="w-full h-[600px] rounded border border-gray-200"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 이벤트 추가/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "이벤트 수정" : "이벤트 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>제목 *</Label>
              <Input value={form.title} onChange={(e) => updateForm("title", e.target.value)} placeholder="이벤트 제목" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>타입</Label>
                <Select value={form.type} onValueChange={(v) => updateForm("type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
              <Textarea value={form.description} onChange={(e) => updateForm("description", e.target.value)} placeholder="이벤트 설명" rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>감독/연출</Label>
                <Input value={form.director} onChange={(e) => updateForm("director", e.target.value)} placeholder="감독명" />
              </div>
              <div className="space-y-2">
                <Label>프로젝트명</Label>
                <Input value={form.project_name} onChange={(e) => updateForm("project_name", e.target.value)} placeholder="프로젝트명" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>장소</Label>
              <Input value={form.location} onChange={(e) => updateForm("location", e.target.value)} placeholder="장소" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>이벤트 일시</Label>
                <Input type="datetime-local" value={form.event_time} onChange={(e) => updateForm("event_time", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>마감일</Label>
                <Input type="datetime-local" value={form.deadline} onChange={(e) => updateForm("deadline", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>포스터 이미지</Label>
              {imagePreview && (
                <img src={imagePreview} alt="포스터 미리보기" className="w-full max-h-48 object-cover rounded-lg border border-gray-200" />
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange}
                className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer" />
            </div>

            <div className="flex items-center gap-3">
              <input type="checkbox" id="is_member_only" checked={form.is_member_only}
                onChange={(e) => updateForm("is_member_only", e.target.checked)} className="w-4 h-4 accent-orange-500" />
              <Label htmlFor="is_member_only" className="cursor-pointer">멤버 전용</Label>
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
