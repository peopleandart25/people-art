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
import { useAdminList } from "@/hooks/use-admin-list"
import { AdminListToolbar } from "@/components/admin/AdminListToolbar"
import { AdminPagination } from "@/components/admin/AdminPagination"
import { ImageIcon } from "lucide-react"

type Banner = {
  id: string
  title: string
  image_url: string
  link_url: string | null
  is_active: boolean
  sort_order: number
  created_at: string | null
  updated_at: string | null
}

type BannerForm = {
  title: string
  link_url: string
  sort_order: number
  is_active: boolean
}

const defaultForm: BannerForm = {
  title: "",
  link_url: "",
  sort_order: 0,
  is_active: true,
}

const SORT_OPTIONS = [
  { value: "sort_order", label: "노출 순서" },
  { value: "created_at", label: "등록일순" },
  { value: "updated_at", label: "수정일순" },
  { value: "title", label: "제목순" },
]

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [form, setForm] = useState<BannerForm>(defaultForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
  } = useAdminList(banners as Record<string, unknown>[], {
    searchFields: ["title"] as never[],
    defaultSortField: "sort_order" as never,
    defaultSortDirection: "asc",
    pageSize: 20,
  })

  useEffect(() => { fetchBanners() }, [])

  async function fetchBanners() {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("banners")
      .select("id, title, image_url, link_url, is_active, sort_order, created_at, updated_at")

    if (error) setError(error.message)
    else setBanners((data ?? []) as Banner[])
    setLoading(false)
  }

  function openAddDialog() {
    setEditingBanner(null)
    setForm(defaultForm)
    setImageFile(null)
    setImagePreview(null)
    setError(null)
    setDialogOpen(true)
  }

  function openEditDialog(banner: Banner) {
    setEditingBanner(banner)
    setForm({ title: banner.title, link_url: banner.link_url ?? "", sort_order: banner.sort_order, is_active: banner.is_active })
    setImageFile(null)
    setImagePreview(banner.image_url)
    setError(null)
    setDialogOpen(true)
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function uploadImage(file: File): Promise<string> {
    const supabase = createClient()
    const ext = file.name.split(".").pop()
    const path = `${Date.now()}.${ext}`
    const { error } = await supabase.storage.from("banners").upload(path, file, { upsert: true })
    if (error) throw new Error(error.message)
    const { data } = supabase.storage.from("banners").getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSave() {
    if (!form.title.trim()) { setError("제목을 입력해주세요."); return }
    if (!editingBanner && !imageFile) { setError("이미지를 선택해주세요."); return }
    setSaving(true)
    setError(null)
    const supabase = createClient()
    try {
      let image_url = editingBanner?.image_url ?? ""
      if (imageFile) image_url = await uploadImage(imageFile)
      const payload = { title: form.title, image_url, link_url: form.link_url || null, sort_order: form.sort_order, is_active: form.is_active }
      if (editingBanner) {
        const { error } = await supabase.from("banners").update(payload).eq("id", editingBanner.id)
        if (error) throw new Error(error.message)
      } else {
        const { error } = await supabase.from("banners").insert(payload)
        if (error) throw new Error(error.message)
      }
      await fetchBanners()
      setDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("이 배너를 삭제하시겠습니까?")) return
    const supabase = createClient()
    const { error } = await supabase.from("banners").delete().eq("id", id)
    if (error) setError(error.message)
    else await fetchBanners()
  }

  const updateForm = (key: keyof BannerForm, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">메인배너 관리</h1>
          <p className="text-sm text-gray-500 mt-1">메인 페이지 배너 목록 및 관리</p>
        </div>
        <Button onClick={openAddDialog} className="bg-orange-500 hover:bg-orange-600 text-white">
          배너 추가
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
      )}

      <AdminListToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="제목 검색..."
        sortField={String(sortField)}
        onSortFieldChange={(v) => setSortField(v as never)}
        sortOptions={SORT_OPTIONS}
        sortDirection={sortDirection}
        onToggleSortDirection={toggleSortDirection}
        filteredCount={filteredCount}
        totalCount={banners.length}
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
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-20">이미지</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">링크</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">활성여부</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">순서</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">등록일</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(paginatedItems as Banner[]).map((banner) => (
                  <tr key={banner.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      {banner.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={banner.image_url}
                          alt={banner.title}
                          className="w-16 h-10 object-cover rounded border border-gray-100"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                            const sib = e.currentTarget.nextElementSibling as HTMLElement | null
                            if (sib) sib.style.display = "flex"
                          }}
                        />
                      ) : null}
                      <div
                        className="w-16 h-10 bg-gray-100 rounded flex items-center justify-center"
                        style={banner.image_url ? { display: "none" } : undefined}
                      >
                        <ImageIcon className="h-4 w-4 text-gray-400" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{banner.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                      {banner.link_url ? (
                        <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">{banner.link_url}</a>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${banner.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {banner.is_active ? "활성" : "비활성"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{banner.sort_order}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {banner.created_at ? new Date(banner.created_at).toLocaleDateString("ko-KR") : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(banner)} className="text-xs">수정</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(banner.id)} className="text-xs">삭제</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-400">
                      {searchTerm ? "검색 결과가 없습니다" : "배너가 없습니다"}
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
            <DialogTitle>{editingBanner ? "배너 수정" : "배너 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>제목 *</Label>
              <Input value={form.title} onChange={(e) => updateForm("title", e.target.value)} placeholder="배너 제목" />
            </div>
            <div className="space-y-2">
              <Label>이미지 {!editingBanner && "*"}</Label>
              <Input type="file" accept="image/*" onChange={handleImageChange} className="cursor-pointer" />
              {imagePreview && (
                <div className="mt-2 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="미리보기" className="w-full max-h-44 object-cover" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>링크 URL (선택)</Label>
              <Input value={form.link_url} onChange={(e) => updateForm("link_url", e.target.value)} placeholder="https://example.com" />
            </div>
            <div className="space-y-2">
              <Label>정렬 순서 (노출 순서)</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => updateForm("sort_order", Number(e.target.value))} placeholder="0" min={0} />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => updateForm("is_active", e.target.checked)} className="w-4 h-4 accent-orange-500" />
              <Label htmlFor="is_active" className="cursor-pointer">활성화</Label>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>취소</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white">
                {saving ? "저장 중..." : "저장"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
