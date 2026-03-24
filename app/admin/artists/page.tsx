"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ArtistRow = {
  user_id: string
  bio: string | null
  birth_date: string | null
  gender: string | null
  height: number | null
  weight: number | null
  is_public: boolean | null
  updated_at: string | null
  profiles: {
    name: string | null
    email: string | null
    phone: string | null
  } | null
}

export default function AdminArtistsPage() {
  const [artists, setArtists] = useState<ArtistRow[]>([])
  const [filtered, setFiltered] = useState<ArtistRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<ArtistRow | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchArtists()
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    if (!q) {
      setFiltered(artists)
    } else {
      setFiltered(
        artists.filter(
          (a) =>
            (a.profiles?.name ?? "").toLowerCase().includes(q) ||
            (a.profiles?.email ?? "").toLowerCase().includes(q)
        )
      )
    }
  }, [search, artists])

  async function fetchArtists() {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("artist_profiles")
      .select("user_id, bio, birth_date, gender, height, weight, is_public, updated_at, profiles(name, email, phone)")
      .order("updated_at", { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setArtists((data ?? []) as ArtistRow[])
      setFiltered((data ?? []) as ArtistRow[])
    }
    setLoading(false)
  }

  function openDetail(artist: ArtistRow) {
    setSelected(artist)
    setDialogOpen(true)
  }

  async function handleTogglePublic() {
    if (!selected) return
    setToggling(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("artist_profiles")
      .update({ is_public: !selected.is_public })
      .eq("user_id", selected.user_id)

    if (error) {
      setError(error.message)
    } else {
      await fetchArtists()
      setSelected((prev) => prev ? { ...prev, is_public: !prev.is_public } : null)
    }
    setToggling(false)
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">배우 관리</h1>
        <p className="text-sm text-gray-500 mt-1">등록된 배우 프로필 목록 및 공개 여부 관리</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 검색 */}
      <div className="mb-4">
        <Input
          placeholder="이름 또는 이메일로 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* 테이블 */}
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
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">성별</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">키/몸무게</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">공개 여부</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">최근 수정</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((artist) => (
                  <tr key={artist.user_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-sm text-gray-900">{artist.profiles?.name ?? "-"}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{artist.profiles?.email ?? "-"}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{artist.gender ?? "-"}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {artist.height ? `${artist.height}cm` : "-"}
                      {artist.weight ? ` / ${artist.weight}kg` : ""}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        artist.is_public ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {artist.is_public ? "공개" : "비공개"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500">
                      {artist.updated_at
                        ? new Date(artist.updated_at).toLocaleDateString("ko-KR")
                        : "-"}
                    </td>
                    <td className="px-6 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetail(artist)}
                        className="text-xs"
                      >
                        상세
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-400">
                      등록된 배우 프로필이 없습니다
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 상세 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>배우 프로필 상세</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">이름</p>
                  <p className="text-gray-900 font-medium">{selected.profiles?.name ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">이메일</p>
                  <p className="text-gray-700">{selected.profiles?.email ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">전화번호</p>
                  <p className="text-gray-700">{selected.profiles?.phone ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">생년월일</p>
                  <p className="text-gray-700">{selected.birth_date ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">성별</p>
                  <p className="text-gray-700">{selected.gender ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">키 / 몸무게</p>
                  <p className="text-gray-700">
                    {selected.height ? `${selected.height}cm` : "-"}
                    {selected.weight ? ` / ${selected.weight}kg` : ""}
                  </p>
                </div>
              </div>
              {selected.bio && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">자기소개</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-4">{selected.bio}</p>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">공개 여부</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    selected.is_public ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {selected.is_public ? "공개" : "비공개"}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTogglePublic}
                  disabled={toggling}
                  className="text-xs"
                >
                  {toggling ? "변경 중..." : (selected.is_public ? "비공개로 변경" : "공개로 변경")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
