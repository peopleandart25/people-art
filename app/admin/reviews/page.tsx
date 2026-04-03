"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

type Review = {
  id: string
  title: string
  content: string | null
  category: string
  user_id: string
  is_hidden: boolean | null
  rating: number | null
  created_at: string | null
  profiles: { name: string | null; email: string | null } | null
}

const categoryColors: Record<string, string> = {
  "투어": "bg-purple-100 text-purple-700",
  "이벤트": "bg-blue-100 text-blue-700",
  "오디션": "bg-orange-100 text-orange-700",
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    fetchReviews()
  }, [])

  async function fetchReviews() {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("reviews")
      .select("id, title, content, category, user_id, is_hidden, rating, created_at, profiles(name, email)")
      .order("created_at", { ascending: false })

    if (error) setError(error.message)
    else setReviews((data ?? []) as Review[])
    setLoading(false)
  }

  async function handleToggleHidden(review: Review) {
    setTogglingId(review.id)
    const supabase = createClient()
    const { error } = await supabase
      .from("reviews")
      .update({ is_hidden: !review.is_hidden })
      .eq("id", review.id)

    if (error) {
      setError(error.message)
    } else {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === review.id ? { ...r, is_hidden: !r.is_hidden } : r
        )
      )
    }
    setTogglingId(null)
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">후기 관리</h1>
        <p className="text-sm text-gray-500 mt-1">전체 후기 목록 및 숨김 관리</p>
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
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">작성자</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">평점</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">숨김여부</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">작성일</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          categoryColors[review.category] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {review.category}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900 max-w-xs truncate">{review.title}</td>
                    <td className="px-6 py-3">
                      <div className="text-sm font-medium text-gray-900">{review.profiles?.name ?? '-'}</div>
                      <div className="text-xs text-gray-400">{review.profiles?.email ?? review.user_id.slice(0, 8)}</div>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {review.rating !== null ? `${review.rating}점` : "-"}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          review.is_hidden
                            ? "bg-red-100 text-red-600"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {review.is_hidden ? "숨김" : "공개"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500">
                      {review.created_at
                        ? new Date(review.created_at).toLocaleDateString("ko-KR")
                        : "-"}
                    </td>
                    <td className="px-6 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleHidden(review)}
                        disabled={togglingId === review.id}
                        className="text-xs"
                      >
                        {togglingId === review.id
                          ? "처리 중..."
                          : review.is_hidden
                          ? "공개"
                          : "숨김"}
                      </Button>
                    </td>
                  </tr>
                ))}
                {reviews.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-400">
                      후기가 없습니다
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
