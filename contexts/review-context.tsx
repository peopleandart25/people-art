"use client"

import { createContext, useContext, useState, ReactNode } from "react"

/**
 * [후기 데이터 중앙 저장소]
 * 
 * 모든 후기 데이터를 한 곳에서 관리합니다.
 * - 메인 페이지: reviews.slice(0, 5)로 5개만 표시
 * - 전체 페이지: 모든 후기 표시
 * - 후기 추가/수정/삭제 시 모든 페이지에 즉시 반영
 */

// 후기 타입 정의
export interface Review {
  id: number
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

// 초기 후기 데이터
const initialReviews: Review[] = [
  {
    id: 1,
    category: "service",
    categoryLabel: "이용후기",
    author: "actor_kim92",
    title: "프로필 투어 후기",
    content: "피플앤아트를 통해 캐스팅 기회를 얻게 되어 감사합니다. 전문적인 서비스와 친절한 상담 덕분에 좋은 결과를 얻을 수 있었습니다.",
    date: "2025-12-11",
  },
  {
    id: 2,
    category: "service",
    categoryLabel: "이용후기",
    author: "leejun_actor",
    title: "멤버십 이용 후기",
    content: "멤버십 가입 후 다양한 오디션 기회가 많아졌습니다. 프로필 지원 횟수 제한이 없어서 적극적으로 활동할 수 있게 되었어요.",
    date: "2025-12-09",
  },
  {
    id: 3,
    category: "acting",
    categoryLabel: "연기특강",
    author: "star_park99",
    title: "연기 특강 참여 후기",
    content: "연기 특강에서 정말 많은 것을 배웠습니다. 실습 위주의 수업이라 직접 경험하며 성장할 수 있었어요. 다음에도 꼭 참여하고 싶습니다!",
    date: "2025-12-07",
  },
  {
    id: 4,
    category: "acting",
    categoryLabel: "연기특강",
    author: "minsu_kim95",
    title: "카메라 연기 워크샵 후기",
    content: "카메라 앞에서의 연기가 무대 연기와 어떻게 다른지 체험할 수 있었던 좋은 기회였습니다. 실제 촬영 환경에서 연기해보니 긴장도 되었지만, 피드백을 통해 많이 성장할 수 있었어요.",
    date: "2025-12-05",
  },
  {
    id: 5,
    category: "event",
    categoryLabel: "이벤트",
    author: "jihoon_park",
    title: "신규 회원 이벤트 당첨!",
    content: "신규 회원 가입 이벤트에 당첨되어 무료 프로필 촬영권을 받았어요! 정말 감사드립니다. 덕분에 새로운 프로필 사진으로 업데이트할 수 있게 되었네요.",
    date: "2025-12-03",
  },
  {
    id: 6,
    category: "event",
    categoryLabel: "이벤트",
    author: "junseo_oh",
    title: "추천인 이벤트 포인트 적립 완료",
    content: "친구에게 피플앤아트를 추천했더니 보너스 포인트를 받았어요! 이 포인트로 다음 달 멤버십 결제에 사용할 예정입니다. 좋은 서비스를 친구에게 알릴 수 있어서 뿌듯하네요.",
    date: "2025-12-01",
  },
  {
    id: 7,
    category: "service",
    categoryLabel: "이용후기",
    author: "choi_actor",
    title: "프로필 촬영 서비스 후기",
    content: "전문 포토그래퍼분께서 촬영해주셔서 퀄리티가 정말 좋았습니다. 다양한 컨셉으로 촬영하니 프로필 선택의 폭도 넓어졌어요. 강력 추천합니다!",
    date: "2025-11-28",
  },
  {
    id: 8,
    category: "acting",
    categoryLabel: "연기특강",
    author: "taehee_kim",
    title: "감정 연기 마스터 클래스 참여 후기",
    content: "눈물 연기, 웃음 연기 등 다양한 감정 표현을 배울 수 있었습니다. 특히 강사님께서 개인별로 피드백을 주셔서 더욱 도움이 되었어요.",
    date: "2025-11-25",
  },
  {
    id: 9,
    category: "etc",
    categoryLabel: "기타",
    author: "sohee_han99",
    title: "피플앤아트 앱 사용 후기",
    content: "앱 인터페이스가 직관적이고 사용하기 편리해요. 오디션 정보도 빠르게 확인할 수 있고, 알림 기능 덕분에 놓치는 기회가 없어졌습니다.",
    date: "2025-11-22",
  },
  {
    id: 10,
    category: "etc",
    categoryLabel: "기타",
    author: "dongwook_lee",
    title: "고객센터 친절 후기",
    content: "문의사항이 있어서 고객센터에 연락했는데 정말 친절하게 안내해주셨어요. 덕분에 궁금한 점을 모두 해결할 수 있었습니다.",
    date: "2025-11-20",
  },
]

// Context 타입 정의
interface ReviewContextType {
  reviews: Review[]
  addReview: (review: Omit<Review, "id">) => void
  removeReview: (id: number) => void
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined)

export function ReviewProvider({ children }: { children: ReactNode }) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews)

  // 후기 추가
  const addReview = (review: Omit<Review, "id">) => {
    const newReview: Review = {
      ...review,
      id: Date.now(),
    }
    setReviews((prev) => [newReview, ...prev])
  }

  // 후기 삭제
  const removeReview = (id: number) => {
    setReviews((prev) => prev.filter((review) => review.id !== id))
  }

  return (
    <ReviewContext.Provider value={{ reviews, addReview, removeReview }}>
      {children}
    </ReviewContext.Provider>
  )
}

export function useReviews() {
  const context = useContext(ReviewContext)
  if (context === undefined) {
    throw new Error("useReviews must be used within a ReviewProvider")
  }
  return context
}

// Provider 외부에서 사용 시 기본값 반환
export function useReviewsSafe() {
  const context = useContext(ReviewContext)
  if (context === undefined) {
    return {
      reviews: initialReviews,
      addReview: () => {},
      removeReview: () => {},
    }
  }
  return context
}

// 회원 ID 마스킹 함수 (공통 사용)
export function maskAuthorId(author: string): string {
  if (author === "admin" || author === "people_art") {
    return author === "admin" ? "관리자" : "피플앤아트"
  }
  if (author.length <= 2) {
    return author[0] + "*"
  } else if (author.length <= 4) {
    return author[0] + "*".repeat(author.length - 2) + author[author.length - 1]
  } else {
    // 앞 2글자 + *** + 뒤 1글자
    return author.slice(0, 2) + "***" + author.slice(-1)
  }
}
