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
import { useAdminList } from "@/hooks/use-admin-list"
import { AdminListToolbar } from "@/components/admin/AdminListToolbar"
import { AdminPagination } from "@/components/admin/AdminPagination"
import { ImageIcon } from "lucide-react"

type News = {
  id: string
  title: string
  content: string | null
  excerpt: string | null
  image_url: string | null
  is_published: boolean | null
  published_at: string | null
  created_at: string | null
  updated_at: string | null
}

type NewsForm = {
  title: string
  content: string
  excerpt: string
  published_at: string
  is_published: boolean
}

const defaultForm: NewsForm = {
  title: "",
  content: "",
  excerpt: "",
  published_at: "",
  is_published: false,
}

const SORT_OPTIONS = [
  { value: "created_at", label: "등록일순" },
  { value: "updated_at", label: "수정일순" },
  { value: "title", label: "제목순" },
]

export default function AdminNewsPage() {
  const [newsList, setNewsList] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingNews, setEditingNews] = useState<News | null>(null)
  const [form, setForm] = useState<NewsForm>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newsImageFile, setNewsImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    paginatedItems,
    filteredCount,
    searchTerm,
    setSearchTerm,
    sortField,
    setSortField,
    sortDirection,
    toggleSortDirection,
    currentPage,
    setCurrentPage,
    totalPages,
  } = useAdminList(newsList as Record<string, unknown>[], {
    searchFields: ["title", "excerpt"] as never[],
    defaultSortField: "created_at" as never,
    defaultSortDirection: "desc",
    pageSize: 20,
  })

  useEffect(() => { fetchNews() }, [])

  async function fetchNews() {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("news")
      .select("id, title, content, excerpt, image_url, is_published, published_at, created_at, updated_at")

    if (error) setError(error.message)
    else setNewsList((data ?? []) as News[])
    setLoading(false)
  }

  async function uploadNewsImage(file: File): Promise<string | null> {
    const supabase = createClient()
    const ext = file.name.split(".").pop()
    const path = `news/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from("news-images").upload(path, file, { upsert: true })
    if (error) return null
    const { data } = supabase.storage.from("news-images").getPublicUrl(path)
    return data.publicUrl
  }

  function openAddDialog() {
    setEditingNews(null)
    setForm(defaultForm)
    setNewsImageFile(null)
    setImagePreview(null)
    setError(null)
    setDialogOpen(true)
  }

  function openEditDialog(news: News) {
    setEditingNews(news)
    setForm({
      title: news.title,
      content: news.content ?? "",
      excerpt: news.excerpt ?? "",
      published_at: news.published_at ? new Date(news.published_at).toISOString().slice(0, 16) : "",
      is_published: news.is_published ?? false,
    })
    setNewsImageFile(null)
    setImagePreview(news.image_url ?? null)
    setError(null)
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.title.trim()) { setError("제목을 입력해주세요."); return }
    setSaving(true)
    setError(null)
    const supabase = createClient()

    let imageUrl: string | null | undefined = undefined
    if (newsImageFile) {
      const uploaded = await uploadNewsImage(newsImageFile)
      if (!uploaded) { setError("이미지 업로드에 실패했습니다."); setSaving(false); return }
      imageUrl = uploaded
    }

    const payload: {
      title: string
      content: string | null
      excerpt: string | null
      published_at: string | null
      is_published: boolean
      image_url?: string
    } = {
      title: form.title,
      content: form.content || null,
      excerpt: form.excerpt || null,
      published_at: form.published_at || null,
      is_published: form.is_published,
    }

    if (imageUrl !== undefined) payload.image_url = imageUrl

    if (editingNews) {
      const { error } = await supabase.from("news").update(payload).eq("id", editingNews.id)
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from("news").insert(payload)
      if (error) { setError(error.message); setSaving(false); return }
    }

    await fetchNews()
    setDialogOpen(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("이 뉴스를 삭제하시겠습니까?")) return
    const supabase = createClient()
    const { error } = await supabase.from("news").delete().eq("id", id)
    if (error) setError(error.message)
    else await fetchNews()
  }

  const updateForm = (key: keyof NewsForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setNewsImageFile(file)
    if (file) setImagePreview(URL.createObjectURL(file))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">뉴스 관리</h1>
          <p className="text-sm text-gray-500 mt-1">뉴스 목록 및 발행 관리</p>
        </div>
        <Button onClick={openAddDialog} className="bg-gray-900 hover:bg-gray-700 text-white">
          뉴스 추가
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
      )}

      <AdminListToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="제목, 요약 검색..."
        sortField={String(sortField)}
        onSortFieldChange={(v) => setSortField(v as never)}
        sortOptions={SORT_OPTIONS}
        sortDirection={sortDirection}
        onToggleSortDirection={toggleSortDirection}
        filteredCount={filteredCount}
        totalCount={newsList.length}
      />

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
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-16">이미지</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">발행여부</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">발행일</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">등록일</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(paginatedItems as News[]).map((news) => (
                  <tr key={news.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      {news.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={news.image_url}
                          alt={news.title}
                          className="w-12 h-12 object-cover rounded border border-gray-100"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                            const sib = e.currentTarget.nextElementSibling as HTMLElement | null
                            if (sib) sib.style.display = "flex"
                          }}
                        />
                      ) : null}
                      <div
                        className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center"
                        style={news.image_url ? { display: "none" } : undefined}
                      >
                        <ImageIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{news.title}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${news.is_published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {news.is_published ? "발행" : "미발행"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {news.published_at ? new Date(news.published_at).toLocaleDateString("ko-KR") : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {news.created_at ? new Date(news.created_at).toLocaleDateString("ko-KR") : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(news)} className="text-xs">수정</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(news.id)} className="text-xs">삭제</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400">
                      {searchTerm ? "검색 결과가 없습니다" : "뉴스가 없습니다"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNews ? "뉴스 수정" : "뉴스 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>제목 *</Label>
              <Input value={form.title} onChange={(e) => updateForm("title", e.target.value)} placeholder="뉴스 제목" />
            </div>
            <div className="space-y-2">
              <Label>요약</Label>
              <Textarea value={form.excerpt} onChange={(e) => updateForm("excerpt", e.target.value)} placeholder="뉴스 요약" rows={2} />
            </div>
            <div className="space-y-2">
              <Label>내용</Label>
              <Textarea value={form.content} onChange={(e) => updateForm("content", e.target.value)} placeholder="뉴스 내용" rows={6} />
            </div>
            <div className="space-y-2">
              <Label>이미지</Label>
              {imagePreview && (
                <div className="rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                  <p className="text-xs text-gray-500 px-3 pt-2 pb-1">현재 이미지</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="미리보기" className="w-full max-h-48 object-cover" />
                </div>
              )}
              <div className="flex items-center gap-3 mt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="text-xs">
                  {imagePreview ? "이미지 변경" : "파일 선택"}
                </Button>
                {newsImageFile && (
                  <span className="text-xs text-gray-500 truncate max-w-[180px]">{newsImageFile.name}</span>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
            <div className="space-y-2">
              <Label>발행일</Label>
              <Input type="datetime-local" value={form.published_at} onChange={(e) => updateForm("published_at", e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="is_published" checked={form.is_published} onChange={(e) => updateForm("is_published", e.target.checked)} className="w-4 h-4 accent-orange-500" />
              <Label htmlFor="is_published" className="cursor-pointer">발행하기</Label>
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
