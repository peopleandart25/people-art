// ============================================================================
// 제휴업체 데이터 (Partnership)
// 
// [관리자 안내]
// - 새 제휴업체 추가: 아래 partnershipData.items 배열에 객체 하나만 추가하면 즉시 반영됩니다.
// - 필드 설명:
//   * id: 고유 식별자 (중복 불가)
//   * name: 업체명
//   * description: 업체 설명/카테고리
//   * imageUrl: 업체 이미지 경로 (public 폴더 기준 또는 외부 URL)
//   * link: 업체 홈페이지 또는 상세 페이지 링크
// 
// [향후 확장]
// - DB나 외부 JSON/API에서 데이터를 불러올 경우, partnershipData만 교체하면 됩니다.
// - 컴포넌트와 데이터가 분리되어 있어 유지보수가 용이합니다.
// ============================================================================

export interface PartnershipItem {
  id: string
  name: string
  description: string
  imageUrl: string
  link: string
}

export interface PartnershipData {
  sectionTitle: string
  sectionSubtitle: string
  pageDescription: string
  itemsPerPage: number
  items: PartnershipItem[]
}

export const partnershipData: PartnershipData = {
  sectionTitle: "PARTNERSHIP",
  sectionSubtitle: "제휴업체",
  pageDescription: "피플앤아트 공식 제휴 업체입니다. 회원님들께 다양한 혜택을 제공합니다.",
  itemsPerPage: 8,
  items: [
    {
      id: "partner-1",
      name: "OJ STUDIO",
      description: "프로필 촬영 스튜디오",
      imageUrl: "/images/partners/oj-studio.jpg",
      link: "https://example.com/oj-studio",
    },
    {
      id: "partner-2",
      name: "펠리즈 아트",
      description: "연기 아카데미",
      imageUrl: "/images/partners/feliz-art.jpg",
      link: "https://example.com/feliz-art",
    },
    {
      id: "partner-3",
      name: "스튜디오 필름",
      description: "영상제작 스튜디오",
      imageUrl: "/images/partners/studio-film.jpg",
      link: "https://example.com/studio-film",
    },
    {
      id: "partner-4",
      name: "더 스튜디오",
      description: "프로필 촬영 스튜디오",
      imageUrl: "/images/partners/the-studio.jpg",
      link: "https://example.com/the-studio",
    },
    {
      id: "partner-5",
      name: "액팅 랩",
      description: "연기 아카데미",
      imageUrl: "/images/partners/acting-lab.jpg",
      link: "https://example.com/acting-lab",
    },
    {
      id: "partner-6",
      name: "무브먼트 스튜디오",
      description: "댄스/무브먼트",
      imageUrl: "/images/partners/movement-studio.jpg",
      link: "https://example.com/movement-studio",
    },
    {
      id: "partner-7",
      name: "보이스 트레이닝",
      description: "보컬/발성 트레이닝",
      imageUrl: "/images/partners/voice-training.jpg",
      link: "https://example.com/voice-training",
    },
    {
      id: "partner-8",
      name: "뷰티 스튜디오",
      description: "헤어/메이크업",
      imageUrl: "/images/partners/beauty-studio.jpg",
      link: "https://example.com/beauty-studio",
    },
    {
      id: "partner-9",
      name: "포토그래피 서울",
      description: "프로필 촬영 스튜디오",
      imageUrl: "/images/partners/photography-seoul.jpg",
      link: "https://example.com/photography-seoul",
    },
    {
      id: "partner-10",
      name: "액터스 스쿨",
      description: "연기 아카데미",
      imageUrl: "/images/partners/actors-school.jpg",
      link: "https://example.com/actors-school",
    },
    {
      id: "partner-11",
      name: "필름 팩토리",
      description: "영상제작 스튜디오",
      imageUrl: "/images/partners/film-factory.jpg",
      link: "https://example.com/film-factory",
    },
    {
      id: "partner-12",
      name: "댄스 아카데미",
      description: "댄스/무브먼트",
      imageUrl: "/images/partners/dance-academy.jpg",
      link: "https://example.com/dance-academy",
    },
    {
      id: "partner-13",
      name: "스타 메이크업",
      description: "헤어/메이크업",
      imageUrl: "/images/partners/star-makeup.jpg",
      link: "https://example.com/star-makeup",
    },
    {
      id: "partner-14",
      name: "캐스팅 플러스",
      description: "캐스팅 에이전시",
      imageUrl: "/images/partners/casting-plus.jpg",
      link: "https://example.com/casting-plus",
    },
    {
      id: "partner-15",
      name: "프로필 스튜디오",
      description: "프로필 촬영 스튜디오",
      imageUrl: "/images/partners/profile-studio.jpg",
      link: "https://example.com/profile-studio",
    },
    {
      id: "partner-16",
      name: "아트 스페이스",
      description: "연기 아카데미",
      imageUrl: "/images/partners/art-space.jpg",
      link: "https://example.com/art-space",
    },
  ],
}
