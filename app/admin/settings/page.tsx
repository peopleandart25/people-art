"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type AppSetting = {
  key: string
  value: string
  description: string | null
  updated_at: string | null
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [welcomeEnabled, setWelcomeEnabled] = useState(false)
  const [welcomeAmount, setWelcomeAmount] = useState("5000")

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("app_settings")
      .select("key, value, description, updated_at")
      .in("key", ["welcome_points_enabled", "welcome_points_amount"])

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const settings = (data ?? []) as AppSetting[]
    const enabledSetting = settings.find((s) => s.key === "welcome_points_enabled")
    const amountSetting = settings.find((s) => s.key === "welcome_points_amount")

    if (enabledSetting) {
      setWelcomeEnabled(enabledSetting.value === "true")
    }
    if (amountSetting) {
      setWelcomeAmount(amountSetting.value)
    }

    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setToast(null)

    const supabase = createClient()
    const now = new Date().toISOString()

    const upsertData = [
      {
        key: "welcome_points_enabled",
        value: String(welcomeEnabled),
        description: "신규 가입 시 웰컴포인트 지급 활성화 여부",
        updated_at: now,
      },
      {
        key: "welcome_points_amount",
        value: welcomeAmount,
        description: "신규 가입 시 지급할 웰컴포인트 금액",
        updated_at: now,
      },
    ]

    const { error } = await supabase
      .from("app_settings")
      .upsert(upsertData, { onConflict: "key" })

    if (error) {
      setError(error.message)
    } else {
      setToast("설정이 저장되었습니다.")
      setTimeout(() => setToast(null), 3000)
    }

    setSaving(false)
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">서비스 설정</h1>
        <p className="text-sm text-gray-500 mt-1">서비스 운영 설정 관리</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {toast && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          {toast}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-7 h-7 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6 max-w-xl">
          {/* 웰컴포인트 설정 카드 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">웰컴포인트 설정</h2>
            <p className="text-sm text-gray-500 mb-5">신규 가입 시 웰컴포인트 지급 여부와 금액을 설정합니다.</p>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-gray-700">웰컴포인트 활성화</Label>
                  <p className="text-xs text-gray-400 mt-0.5">신규 가입 시 포인트를 자동으로 지급합니다</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={welcomeEnabled}
                  onClick={() => setWelcomeEnabled((prev) => !prev)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                    welcomeEnabled ? "bg-orange-500" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      welcomeEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcome_amount" className="text-sm font-medium text-gray-700">
                  지급 포인트
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="welcome_amount"
                    type="number"
                    value={welcomeAmount}
                    onChange={(e) => setWelcomeAmount(e.target.value)}
                    placeholder="5000"
                    min={0}
                    className="w-40"
                    disabled={!welcomeEnabled}
                  />
                  <span className="text-sm text-gray-500">P</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
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
    </div>
  )
}
