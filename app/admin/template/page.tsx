"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Download, Upload, FileText } from "lucide-react"

const FILE_NAME = "profile-form.pptx"
const BUCKET = "templates"
const FILE_URL = `https://ywokkwjetjyagqzvcepz.supabase.co/storage/v1/object/public/${BUCKET}/${FILE_NAME}`
const DOWNLOAD_URL = `${FILE_URL}?download=${encodeURIComponent("배우 프로필 양식.pptx")}`
const PREVIEW_URL = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(FILE_URL)}`

interface FileInfo {
  name: string
  updated_at: string | null
}

export default function AdminTemplatePage() {
  const { toast } = useToast()
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchFileInfo = async () => {
    // HEAD 요청으로 파일 존재 여부 확인
    try {
      const res = await fetch(FILE_URL, { method: "HEAD" })
      if (res.ok) {
        const lastModified = res.headers.get("last-modified")
        setFileInfo({
          name: "배우 프로필 양식.pptx",
          updated_at: lastModified,
        })
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    fetchFileInfo()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({ title: "파일을 선택해주세요.", variant: "destructive" })
      return
    }
    if (!selectedFile.name.endsWith(".pptx")) {
      toast({ title: ".pptx 파일만 업로드할 수 있습니다.", variant: "destructive" })
      return
    }
    setUploading(true)
    const supabase = createClient()
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(FILE_NAME, selectedFile, { upsert: true })
    setUploading(false)
    if (error) {
      toast({ title: "업로드 실패", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "업로드 성공", description: "프로필 양식이 업데이트되었습니다." })
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      window.location.reload()
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="p-8 pl-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">프로필 양식 관리</h1>

      {/* 현재 파일 카드 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4">현재 파일</h2>
        {loading ? (
          <p className="text-sm text-gray-400">불러오는 중...</p>
        ) : fileInfo ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">{fileInfo.name}</p>
                <p className="text-xs text-gray-500">업데이트: {formatDate(fileInfo.updated_at)}</p>
              </div>
            </div>
            <a href={DOWNLOAD_URL}>
              <Button variant="outline" size="sm" className="gap-2 text-gray-600 border-gray-300">
                <Download className="w-4 h-4" />
                다운로드
              </Button>
            </a>
          </div>
        ) : (
          <p className="text-sm text-gray-400">파일 정보를 찾을 수 없습니다.</p>
        )}
      </div>

      {/* 미리보기 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4">미리보기</h2>
        <iframe
          src={PREVIEW_URL}
          className="w-full h-[600px] rounded-lg border border-gray-200"
          title="프로필 양식 미리보기"
        />
      </div>

      {/* 업로드 섹션 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4">양식 파일 교체</h2>
        <p className="text-sm text-gray-500 mb-4">.pptx 파일을 업로드하면 기존 파일이 교체됩니다.</p>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pptx"
            onChange={handleFileChange}
            className="block text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100 cursor-pointer"
          />
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="gap-2 bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Upload className="w-4 h-4" />
            {uploading ? "업로드 중..." : "업로드"}
          </Button>
        </div>
        {selectedFile && (
          <p className="mt-2 text-xs text-gray-500">선택된 파일: {selectedFile.name}</p>
        )}
      </div>
    </div>
  )
}
