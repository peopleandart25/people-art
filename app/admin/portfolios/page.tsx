"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Download, FileText, Package } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type PortfolioRow = {
  user_id: string
  name: string | null
  activity_name: string | null
  email: string | null
  portfolio_url: string | null
  portfolio_file_name: string | null
  portfolio_updated_at: string | null
}

type PortfolioResponse = {
  rows: PortfolioRow[]
  last_bulk_download_at: string | null
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleString("ko-KR")
}

export default function AdminPortfoliosPage() {
  const { toast } = useToast()
  const [rows, setRows] = useState<PortfolioRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [bulkLoading, setBulkLoading] = useState(false)
  const [lastBulkDownloadAt, setLastBulkDownloadAt] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 검색어 디바운스 (300ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/portfolios")
      if (!res.ok) {
        toast({ title: "조회 실패", variant: "destructive" })
        return
      }
      const data = (await res.json()) as PortfolioResponse
      setRows(data.rows ?? [])
      setLastBulkDownloadAt(data.last_bulk_download_at ?? null)
    } catch {
      toast({ title: "조회 실패", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        (r.name ?? "").toLowerCase().includes(q) ||
        (r.activity_name ?? "").toLowerCase().includes(q) ||
        (r.email ?? "").toLowerCase().includes(q)
    )
  }, [rows, debouncedSearch])

  // 마지막 다운로드 이후 업데이트된 건수 (신규 배지)
  const newCount = useMemo(() => {
    if (!lastBulkDownloadAt) return rows.length
    return rows.filter((r) => r.portfolio_updated_at && r.portfolio_updated_at > lastBulkDownloadAt)
      .length
  }, [rows, lastBulkDownloadAt])

  async function handleBulkDownload() {
    setBulkLoading(true)
    try {
      const res = await fetch("/api/admin/portfolios/bulk-download", { method: "POST" })
      const contentType = res.headers.get("Content-Type") ?? ""
      if (contentType.includes("application/json")) {
        const data = await res.json()
        toast({
          title: data.message ?? data.error ?? "다운로드 실패",
          variant: data.error ? "destructive" : "default",
        })
        return
      }
      if (!res.ok) {
        toast({ title: "다운로드 실패", variant: "destructive" })
        return
      }

      const watermark = res.headers.get("X-Bulk-Download-Watermark")
      const includedCount = res.headers.get("X-Bulk-Download-Included") ?? "?"
      const missedCount = res.headers.get("X-Bulk-Download-Missed") ?? "0"

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const disp = res.headers.get("Content-Disposition") ?? ""
      const match = disp.match(/filename="([^"]+)"/)
      a.download = match?.[1] ?? `portfolios_${new Date().toISOString().slice(0, 10)}.zip`
      a.click()
      URL.revokeObjectURL(url)

      // Blob 저장 완료 후 워터마크 advance
      if (watermark) {
        try {
          await fetch("/api/admin/portfolios/bulk-download/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ watermark }),
          })
          setLastBulkDownloadAt(watermark)
        } catch {
          toast({
            title: "워터마크 갱신 실패",
            description: "다음 다운로드 시 동일 파일이 다시 포함될 수 있습니다.",
            variant: "destructive",
          })
        }
      }

      toast({
        title: "다운로드 완료",
        description: `포함 ${includedCount}건${Number(missedCount) > 0 ? ` / 누락 ${missedCount}건` : ""}`,
      })
    } catch {
      toast({ title: "다운로드 실패", variant: "destructive" })
    } finally {
      setBulkLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-orange-500" />
          포트폴리오 관리
        </h1>
        <p className="text-sm text-gray-500 mt-1">배우 PDF 포트폴리오 목록 및 일괄 다운로드</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex flex-col gap-3">
        {/* 검색 행 */}
        <div className="flex gap-2">
          <Input
            placeholder="이름 / 활동명 / 이메일 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setDebouncedSearch(search)}
            className="h-9 text-sm flex-1"
          />
          <Button
            size="sm"
            onClick={() => setDebouncedSearch(search)}
            className="h-9 bg-orange-500 hover:bg-orange-600 text-white"
          >
            검색
          </Button>
        </div>
        {/* 일괄 다운로드 행 (우측 정렬) */}
        <div className="flex flex-col items-end gap-0.5">
          <Button
            size="sm"
            onClick={handleBulkDownload}
            disabled={bulkLoading}
            className="h-9 bg-blue-500 hover:bg-blue-600 text-white gap-1.5"
          >
            <Package className="w-4 h-4" />
            {bulkLoading ? "다운로드 중..." : `일괄 다운로드 (신규 ${newCount}건)`}
          </Button>
          <div className="text-[11px] text-gray-400">
            마지막 일괄 다운로드:{" "}
            <span className="font-medium text-gray-600">
              {lastBulkDownloadAt ? formatDate(lastBulkDownloadAt) : "기록 없음"}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-2 text-sm text-gray-500">
        총 <span className="font-semibold text-gray-800">{filtered.length}</span>건
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-7 h-7 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    이름
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    이메일
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    포트폴리오 파일
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    최종 업데이트
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    다운로드
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((r) => {
                  const isNew =
                    !lastBulkDownloadAt ||
                    (r.portfolio_updated_at && r.portfolio_updated_at > lastBulkDownloadAt)
                  return (
                    <tr key={r.user_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">
                        {r.name ?? "-"}
                        {r.activity_name && (
                          <span className="ml-1 text-xs text-gray-400">({r.activity_name})</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.email ?? "-"}</td>
                      <td
                        className="px-4 py-3 text-gray-600 max-w-[280px] truncate"
                        title={r.portfolio_file_name ?? ""}
                      >
                        {r.portfolio_file_name ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          {formatDate(r.portfolio_updated_at)}
                          {isNew && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-semibold">
                              NEW
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.portfolio_url ? (
                          <a
                            href={r.portfolio_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-orange-50 text-orange-600 hover:bg-orange-100 text-xs font-medium"
                          >
                            <Download className="w-3.5 h-3.5" />
                            다운로드
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">없음</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                      포트폴리오가 없습니다
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
