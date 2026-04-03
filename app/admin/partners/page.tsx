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

type Partner = {
  id: string
  name: string
  description: string | null
  image_url: string | null
  link: string | null
  is_active: boolean | null
  sort_order: number | null
  created_at: string | null
}

type PartnerForm = {
  name: string
  description: string
  link: string
  image_url: string
  is_active: boolean
  sort_order: string
}

const defaultForm: PartnerForm = {
  name: "",
  description: "",
  link: "",
  image_url: "",
  is_active: true,
  sort_order: "0",
}

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null)
  const [form, setForm] = useState<PartnerForm>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [partnerLogoFile, setPartnerLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchPartners()
  }, [])

  async function fetchPartners() {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("partners")
      .select("id, name, description, image_url, link, is_active, sort_order, created_at")
      .order("sort_order", { ascending: true })

    if (error) setError(error.message)
    else setPartners(data ?? [])
    setLoading(false)
  }

  async function uploadPartnerLogo(file: File): Promise<string | null> {
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('partner-logos').upload(path, file, { upsert: false })
    if (error) return null
    const { data } = supabase.storage.from('partner-logos').getPublicUrl(path)
    return data.publicUrl
  }

  function openAddDialog() {
    setEditingPartner(null)
    setForm(defaultForm)
    setPartnerLogoFile(null)
    setLogoPreview(null)
    setError(null)
    setDialogOpen(true)
  }

  function openEditDialog(partner: Partner) {
    setEditingPartner(partner)
    setForm({
      name: partner.name,
      description: partner.description ?? "",
      link: partner.link ?? "",
      image_url: partner.image_url ?? "",
      is_active: partner.is_active ?? true,
      sort_order: String(partner.sort_order ?? 0),
    })
    setPartnerLogoFile(null)
    setLogoPreview(partner.image_url ?? null)
    setError(null)
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError("이름을 입력해주세요.")
      return
    }
    setSaving(true)
    setError(null)
    const supabase = createClient()

    let imageUrl: string | null | undefined = undefined
    if (partnerLogoFile) {
      const uploaded = await uploadPartnerLogo(partnerLogoFile)
      if (!uploaded) {
        setError("이미지 업로드에 실패했습니다.")
        setSaving(false)
        return
      }
      imageUrl = uploaded
    }

    const payload: {
      name: string
      description: string | null
      link: string | null
      image_url?: string | null
      is_active: boolean
      sort_order: number
    } = {
      name: form.name,
      description: form.description || null,
      link: form.link || null,
      is_active: form.is_active,
      sort_order: parseInt(form.sort_order, 10) || 0,
    }

    if (imageUrl !== undefined) {
      payload.image_url = imageUrl
    } else if (!editingPartner) {
      payload.image_url = form.image_url || null
    }

    if (editingPartner) {
      const { error } = await supabase
        .from("partners")
        .update(payload)
        .eq("id", editingPartner.id)
      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase.from("partners").insert(payload)
      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }
    }

    await fetchPartners()
    setDialogOpen(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("이 파트너를 삭제하시겠습니까?")) return
    const supabase = createClient()
    const { error } = await supabase.from("partners").delete().eq("id", id)
    if (error) setError(error.message)
    else await fetchPartners()
  }

  const updateForm = (key: keyof PartnerForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setPartnerLogoFile(file)
    if (file) {
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">파트너 관리</h1>
          <p className="text-sm text-gray-500 mt-1">파트너사 목록 및 활성 상태 관리</p>
        </div>
        <Button
          onClick={openAddDialog}
          className="bg-gray-900 hover:bg-gray-700 text-white"
        >
          파트너 추가
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
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">로고</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">설명</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">링크</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">활성여부</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">순서</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {partners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      {partner.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={partner.image_url}
                          alt={partner.name}
                          className="w-10 h-10 object-contain rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">
                          없음
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{partner.name}</td>
                    <td className="px-6 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {partner.description ?? "-"}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {partner.link ? (
                        <a
                          href={partner.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {partner.link}
                        </a>
                      ) : "-"}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          partner.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {partner.is_active ? "활성" : "비활성"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {partner.sort_order ?? 0}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(partner)}
                          className="text-xs"
                        >
                          수정
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(partner.id)}
                          className="text-xs"
                        >
                          삭제
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {partners.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-400">
                      파트너가 없습니다
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPartner ? "파트너 수정" : "파트너 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>이름 *</Label>
              <Input
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
                placeholder="파트너사명"
              />
            </div>

            <div className="space-y-2">
              <Label>설명</Label>
              <Textarea
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                placeholder="파트너 설명"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>링크</Label>
              <Input
                value={form.link}
                onChange={(e) => updateForm("link", e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>로고 이미지</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs"
                >
                  파일 선택
                </Button>
                {partnerLogoFile && (
                  <span className="text-xs text-gray-500 truncate max-w-[160px]">
                    {partnerLogoFile.name}
                  </span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              {logoPreview && (
                <div className="mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoPreview}
                    alt="미리보기"
                    className="w-24 h-24 object-contain rounded border border-gray-200"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>정렬 순서</Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => updateForm("sort_order", e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={(e) => updateForm("is_active", e.target.checked)}
                className="w-4 h-4 accent-orange-500"
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                활성화
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
    </div>
  )
}
