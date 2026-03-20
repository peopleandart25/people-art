"use client"

// 후기 타입 정의
export interface Review {
  id: string
  category: string
  categoryLabel: string
  author: string
  title: string
  content: string
  date: string
  image?: string | null
}

// 카테고리 정의
export const reviewCategories = [
  { value: "all", label: "전체" },
  { value: "service", label: "이용후기" },
  { value: "acting", label: "연기특강" },
  { value: "event", label: "이벤트" },
  { value: "etc", label: "기타" },
]

// 카테고리별 색상
export const categoryColors: Record<string, string> = {
  service: "bg-green-50 text-green-600",
  acting: "bg-blue-50 text-blue-600",
  event: "bg-purple-50 text-purple-600",
  etc: "bg-gray-50 text-gray-600",
}

// 회원 ID 마스킹 함수
export function maskAuthorId(author: string): string {
  if (author === "admin" || author === "people_art") {
    return author === "admin" ? "관리자" : "피플앤아트"
  }
  if (author.length <= 2) {
    return author[0] + "*"
  } else if (author.length <= 4) {
    return author[0] + "*".repeat(author.length - 2) + author[author.length - 1]
  } else {
    return author.slice(0, 4) + "***"
  }
}

// DB Row → Review 변환 헬퍼
export function toReview(row: {
  id: string
  category: string
  title: string
  content: string | null
  user_id: string
  image_url: string | null
  created_at: string | null
}): Review {
  const categoryLabel = reviewCategories.find((c) => c.value === row.category)?.label ?? row.category
  return {
    id: row.id,
    category: row.category,
    categoryLabel,
    author: row.user_id,
    title: row.title,
    content: row.content ?? "",
    date: row.created_at ? new Date(row.created_at).toLocaleDateString("ko-KR") : "",
    image: row.image_url,
  }
}
