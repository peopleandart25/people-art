"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DirectorProfileFormProps {
  initialName: string
  initialPhone: string
  email: string
  initialCompany: string
  initialJobTitle: string
  isEmailUser?: boolean
}

export function DirectorProfileForm({
  initialName,
  initialPhone,
  email,
  initialCompany,
  initialJobTitle,
  isEmailUser = false,
}: DirectorProfileFormProps) {
  const { toast } = useToast()
  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState(initialPhone)
  const [company, setCompany] = useState(initialCompany)
  const [jobTitle, setJobTitle] = useState(initialJobTitle)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)

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

      {isEmailUser && (
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">비밀번호</Label>
            <div className="flex items-center gap-2">
              <Input value="••••••••" disabled className="bg-gray-50 text-gray-500 text-sm" />
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 text-xs"
                onClick={() => { setShowPasswordDialog(true); setCurrentPassword(""); setNewPassword("") }}
              >
                변경
              </Button>
            </div>
          </div>
        </div>
      )}

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

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>비밀번호 변경</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="dir-pw-current">현재 비밀번호</Label>
              <Input id="dir-pw-current" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dir-pw-new">새 비밀번호 (6자 이상)</Label>
              <Input id="dir-pw-new" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>취소</Button>
            <Button
              disabled={passwordLoading || !currentPassword || newPassword.length < 6}
              onClick={async () => {
                setPasswordLoading(true)
                try {
                  const res = await fetch("/api/auth/change-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ currentPassword, newPassword }),
                  })
                  if (res.ok) {
                    toast({ title: "비밀번호가 변경되었습니다." })
                    setShowPasswordDialog(false)
                    setCurrentPassword("")
                    setNewPassword("")
                  } else {
                    const data = await res.json().catch(() => ({}))
                    toast({ title: "변경 실패", description: data.error ?? "다시 시도해주세요.", variant: "destructive" })
                  }
                } catch {
                  toast({ title: "오류", description: "네트워크 오류가 발생했습니다.", variant: "destructive" })
                }
                setPasswordLoading(false)
              }}
            >
              {passwordLoading ? "변경 중..." : "변경"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
