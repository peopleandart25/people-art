// ============================================================================
// 프로필 투어 리스트 데이터
// 
// [관리자 안내]
// - 새 투어 추가: 아래 tourData 배열에 객체 하나만 추가하면 웹사이트에 즉시 반영됩니다.
// - 필드 설명:
//   * id: 고유 숫자 (중복 불가)
//   * category: "영화" 또는 "드라마"
//   * title: 공고 제목
//   * status: "new"(NEW), "ongoing"(진행중), "closed"(마감)
// ============================================================================

export interface TourItem {
  id: number
  category: "영화" | "드라마"
  title: string
  status: "new" | "ongoing" | "closed"
}

export const tourData: TourItem[] = [
  { id: 1, category: "영화", title: "008", status: "ongoing" },
  { id: 2, category: "영화", title: "BE-LONG (노바필름)", status: "ongoing" },
  { id: 3, category: "영화", title: "노바필름 (제작사)", status: "ongoing" },
  { id: 4, category: "드라마", title: "숏폼드라마 진행 중 (에이전시)", status: "new" },
  { id: 5, category: "드라마", title: "정원사들 (하이브미디어코프)", status: "ongoing" },
  { id: 6, category: "드라마", title: "나미야 잡화점의 기적 (더캠프)", status: "ongoing" },
  { id: 7, category: "드라마", title: "드라마 내부자들 (하이브미디어코프)", status: "ongoing" },
  { id: 8, category: "드라마", title: "다수 드라마 캐스팅 중 (A&O 에이전시)", status: "new" },
  { id: 9, category: "드라마", title: "숏폼 드라마 제작 외 (십스토리)", status: "ongoing" },
  { id: 10, category: "드라마", title: "지담 미디어 (제작사)", status: "closed" },
  { id: 11, category: "드라마", title: "KBS (방송사,제작사)", status: "ongoing" },
  { id: 12, category: "드라마", title: "비욘드제이 (제작사)", status: "closed" },
]

// 투어 안내 정보
export const tourInfo = {
  title: "프로필투어 진행 안내",
  schedule: "투어 진행 : 매주 월~금",
  certification: "투어 인증 : 매주 금 ~ 토 회원방에서 투어 인증자료 공유드립니다.",
}
