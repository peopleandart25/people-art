"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DirectorProfileFormProps {
  initialName: string
  initialPhone: string
  email: string
  initialCompany: string
  initialJobTitle: string
}

export function DirectorProfileForm({
  initialName,
  initialPhone,
  email,
  initialCompany,
  initialJobTitle,
}: DirectorProfileFormProps) {
  const { toast } = useToast()
  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState(initialPhone)
  const [company, setCompany] = useState(initialCompany)
  const [jobTitle, setJobTitle] = useState(initialJobTitle)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          company: company.trim(),
          job_title: jobTitle.trim(),
        }),
      })
      if (!res.ok) throw new Error()
      setSaved(true)
      toast({ title: "저장 완료", description: "프로필이 업데이트되었습니다." })
      setTimeout(() => setSaved(false), 2000)
    } catch {
      toast({ title: "저장 실패", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">연락처 정보</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="dir-name" className="text-xs text-gray-500">이름</Label>
          <Input
            id="dir-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            className="text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500">이메일</Label>
          <Input value={email} disabled className="bg-gray-50 text-gray-500 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dir-phone" className="text-xs text-gray-500">연락처</Label>
          <Input
            id="dir-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-0000-0000"
            className="text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dir-company" className="text-xs text-gray-500">소속 회사</Label>
          <Input
            id="dir-company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="ABC 엔터테인먼트"
            className="text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dir-job-title" className="text-xs text-gray-500">직책</Label>
          <Input
            id="dir-job-title"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="캐스팅 디렉터"
            className="text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? "저장 중..." : saved ? "저장됨 ✓" : "저장하기"}
        </Button>
      </div>
    </div>
  )
}
