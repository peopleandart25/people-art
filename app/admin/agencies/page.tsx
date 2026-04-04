"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useAdminList } from "@/hooks/use-admin-list"
import { AdminListToolbar } from "@/components/admin/AdminListToolbar"
import { AdminPagination } from "@/components/admin/AdminPagination"

type Agency = {
  id: string
  name: string
  category: string | null
  email: string | null
  website: string | null
  description: string | null
  is_active: boolean | null
  sort_order: number | null
  created_at: string | null
  updated_at: string | null
}

const emptyForm = {
  name: "",
  category: "엔터테인먼트",
  email: "",
  website: "",
  description: "",
  sort_order: 0,
  is_active: true,
}

const SORT_OPTIONS = [
  { value: "created_at", label: "등록일순" },
  { value: "updated_at", label: "수정일순" },
  { value: "name", label: "이름순" },
]

export default function AdminAgenciesPage() {
  const { toast } = useToast()
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Agency | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

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
  } = useAdminList(agencies as Record<string, unknown>[], {
    searchFields: ["name", "email", "website"] as never[],
    defaultSortField: "created_at" as never,
    defaultSortDirection: "desc",
    pageSize: 20,
  })

  const fetchAgencies = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("support_agencies")
      .select("id, name, category, email, website, description, is_active, sort_order, created_at, updated_at")
    setAgencies((data ?? []) as Agency[])
    setLoading(false)
  }

  useEffect(() => { fetchAgencies() }, [])

  const openCreate = () => {
    setEditTarget(null)
    setForm(emptyForm)
    setIsDialogOpen(true)
  }

  const openEdit = (agency: Agency) => {
    setEditTarget(agency)
    setForm({
      name: agency.name,
      category: agency.category ?? "엔터테인먼트",
      email: agency.email ?? "",
      website: agency.website ?? "",
      description: agency.description ?? "",
      sort_order: agency.sort_order ?? 0,
      is_active: agency.is_active ?? true,
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast({ title: "기관명을 입력해주세요.", variant: "destructive" }); return }
    setSubmitting(true)
    const supabase = createClient()
    const payload = {
      name: form.name.trim(),
      category: form.category,
      email: form.email.trim() || null,
      website: form.website.trim() || null,
      description: form.description.trim() || null,
      sort_order: form.sort_order,
      is_active: form.is_active,
    }
    if (editTarget) {
      const { error } = await supabase.from("support_agencies").update(payload).eq("id", editTarget.id)
      if (error) { toast({ title: "수정 실패", variant: "destructive" }); setSubmitting(false); return }
      toast({ title: "수정되었습니다." })
    } else {
      const { error } = await supabase.from("support_agencies").insert(payload)
      if (error) { toast({ title: "추가 실패", variant: "destructive" }); setSubmitting(false); return }
      toast({ title: "추가되었습니다." })
    }
    setIsDialogOpen(false)
    setSubmitting(false)
    await fetchAgencies()
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}"을(를) 삭제하시겠습니까?`)) return
    const supabase = createClient()
    await supabase.from("support_agencies").delete().eq("id", id)
    toast({ title: "삭제되었습니다." })
    await fetchAgencies()
  }

  const toggleActive = async (agency: Agency) => {
    const supabase = createClient()
    await supabase.from("support_agencies").update({ is_active: !agency.is_active }).eq("id", agency.id)
    await fetchAgencies()
  }

  return (
    <div className="p-8 pl-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">지원기관 관리</h1>
          <p className="text-sm text-gray-500 mt-1">지원기관 목록 및 관리</p>
        </div>
        <Button onClick={openCreate} className="bg-gray-900 hover:bg-gray-700 text-white gap-2">
          <Plus className="h-4 w-4" /> 기관 추가
        </Button>
      </div>

      <AdminListToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="기관명, 이메일 검색..."
        sortField={String(sortField)}
        onSortFieldChange={(v) => setSortField(v as never)}
        sortOptions={SORT_OPTIONS}
        sortDirection={sortDirection}
        onToggleSortDirection={toggleSortDirection}
        filteredCount={filteredCount}
        totalCount={agencies.length}
      />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <span className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>기관명</TableHead>
                <TableHead>구분</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>홈페이지</TableHead>
                <TableHead>활성</TableHead>
                <TableHead>등록일</TableHead>
                <TableHead className="w-24 text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(paginatedItems as Agency[]).map((agency) => (
                <TableRow key={agency.id}>
                  <TableCell className="font-medium">{agency.name}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${agency.category === "광고에이전시" ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"}`}>
                      {agency.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{agency.email ?? "-"}</TableCell>
                  <TableCell className="text-sm text-gray-600 max-w-[200px] truncate">{agency.website ?? "-"}</TableCell>
                  <TableCell>
                    <button
                      onClick={() => toggleActive(agency)}
                      className={`text-xs px-2 py-1 rounded-full font-medium cursor-pointer ${agency.is_active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}
                    >
                      {agency.is_active ? "활성" : "비활성"}
                    </button>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                    {agency.created_at ? new Date(agency.created_at).toLocaleDateString("ko-KR") : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(agency)} className="h-8 w-8 p-0">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(agency.id, agency.name)} className="h-8 w-8 p-0 text-red-500 hover:text-red-700">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-gray-400">
                    {searchTerm ? "검색 결과가 없습니다" : "등록된 기관이 없습니다"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <AdminPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? "기관 수정" : "기관 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>기관명 *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="기관명" />
            </div>
            <div className="space-y-2">
              <Label>구분</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="엔터테인먼트">엔터테인먼트</SelectItem>
                  <SelectItem value="광고에이전시">광고에이전시</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>이메일</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="casting@example.co.kr" />
            </div>
            <div className="space-y-2">
              <Label>홈페이지</Label>
              <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://www.example.co.kr" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>정렬 순서 (프론트 노출 순서)</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>활성 여부</Label>
                <Select value={form.is_active ? "true" : "false"} onValueChange={(v) => setForm({ ...form, is_active: v === "true" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">활성</SelectItem>
                    <SelectItem value="false">비활성</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>취소</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-gray-900 hover:bg-gray-700 text-white">
              {submitting ? "저장 중..." : editTarget ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
