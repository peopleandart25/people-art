// ============================================================================
// 이벤트(EVENT) 데이터
// [관리 필드: 이벤트 ID, 타입, 제목, 마감일, 상태, 내용, 이미지, 링크 등]
// ============================================================================

export type EventType = "오디션" | "특강"
export type EventStatus = "진행중" | "마감"

export interface EventItem {
  id: string
  type: EventType
  title: string
  deadline: string
  status: EventStatus
  description: string
  location: string
  time: string
  imageUrl: string
  href: string
  isMemberOnly: boolean
  // 상세 정보
  projectName?: string      // 작품명
  director?: string         // 감독/연출
  closingDate?: string      // 마감일자
  detailContent?: string    // 상세 안내 내용
}

export const eventData = {
  sectionTitle: "EVENT",
  sectionSubtitle: "오디션 및 특강 이벤트",
  viewAllLink: "/events",
  itemsPerPage: 6,
  items: [
    {
      id: "event-1",
      type: "오디션" as EventType,
      title: "이상길 대표 오디션",
      deadline: "2026-03-01",
      status: "진행중" as EventStatus,
      description: "영화 '보통사람들' 캐스팅을 위한 내부 오디션입니다.",
      location: "서울특별시 강남구",
      time: "14:00 - 18:00",
      imageUrl: "/images/events/event-1.jpg",
      href: "/events/1",
      isMemberOnly: true,
      projectName: "가나다",
      director: "비공개",
      closingDate: "2026-03-01",
      detailContent: "현재 제작사 및 캐스팅 진행 상황에 따라\n작품 관련 정보는 비공개로 운영되며,\n최종 픽스된 분들에 한해 상세 정보가 오픈될 예정입니다.\n\n형식적인 오디션이 아닌,\n실제 캐스팅 검토 단계로 이어지는 내부 오디션입니다.\n관심있는 배우분들의 많은 관심 바랍니다.",
    },
    {
      id: "event-2",
      type: "특강" as EventType,
      title: '연기특강 "오디션 피드백"',
      deadline: "2026-03-01",
      status: "마감" as EventStatus,
      description: "현업 배우가 직접 진행하는 오디션 피드백 특강입니다.",
      location: "서울특별시 성북구",
      time: "10:00 - 13:00",
      imageUrl: "/images/events/event-2.jpg",
      href: "/events/2",
      isMemberOnly: true,
      projectName: "연기 특강",
      director: "김OO 배우",
      closingDate: "2026-03-01",
      detailContent: "현업에서 활동 중인 배우가 직접 오디션 팁과 피드백을 제공합니다.\n실제 오디션 상황을 시뮬레이션하고 개인별 피드백을 받을 수 있습니다.",
    },
    {
      id: "event-3",
      type: "오디션" as EventType,
      title: "넷플릭스 드라마 오디션",
      deadline: "2026-03-15",
      status: "진행중" as EventStatus,
      description: "넷플릭스 오리지널 드라마 조연 캐스팅 오디션입니다.",
      location: "서울특별시 마포구",
      time: "09:00 - 17:00",
      imageUrl: "/images/events/event-3.jpg",
      href: "/events/3",
      isMemberOnly: true,
      projectName: "비공개",
      director: "비공개",
      closingDate: "2026-03-15",
      detailContent: "넷플릭스 오리지널 드라마의 조연 캐스팅을 위한 오디션입니다.\n작품 정보는 캐스팅 확정 후 개별 안내됩니다.",
    },
    {
      id: "event-4",
      type: "오디션" as EventType,
      title: "영화 '새벽의 약속' 오디션",
      deadline: "2026-03-20",
      status: "진행중" as EventStatus,
      description: "장편 영화 주연 및 조연 캐스팅 오디션입니다.",
      location: "서울특별시 종로구",
      time: "13:00 - 18:00",
      imageUrl: "/images/events/event-4.jpg",
      href: "/events/4",
      isMemberOnly: true,
      projectName: "새벽의 약속",
      director: "박OO 감독",
      closingDate: "2026-03-20",
      detailContent: "2026년 하반기 개봉 예정인 장편 영화 '새벽의 약속'의 캐스팅 오디션입니다.\n주연 및 조연 배역을 모집합니다.",
    },
    {
      id: "event-5",
      type: "특강" as EventType,
      title: "카메라 연기 워크샵",
      deadline: "2026-03-25",
      status: "진행중" as EventStatus,
      description: "카메라 앞에서의 자연스러운 연기를 배우는 실전 워크샵입니다.",
      location: "서울특별시 강남구",
      time: "15:00 - 19:00",
      imageUrl: "/images/events/event-5.jpg",
      href: "/events/5",
      isMemberOnly: false,
      projectName: "카메라 연기 워크샵",
      director: "이OO 배우",
      closingDate: "2026-03-25",
      detailContent: "카메라 앞에서의 자연스러운 연기를 배우는 실전 워크샵입니다.\n소규모로 진행되어 개인별 피드백이 가능합니다.",
    },
    {
      id: "event-6",
      type: "오디션" as EventType,
      title: "광고 모델 오디션",
      deadline: "2026-04-01",
      status: "진행중" as EventStatus,
      description: "대기업 광고 모델 캐스팅 오디션입니다.",
      location: "서울특별시 서초구",
      time: "10:00 - 16:00",
      imageUrl: "/images/events/event-6.jpg",
      href: "/events/6",
      isMemberOnly: true,
      projectName: "비공개",
      director: "비공개",
      closingDate: "2026-04-01",
      detailContent: "대기업 광고 캠페인 모델 캐스팅 오디션입니다.\n브랜드 정보는 캐스팅 확정 후 개별 안내됩니다.",
    },
    {
      id: "event-7",
      type: "오디션" as EventType,
      title: "웹드라마 '첫사랑' 오디션",
      deadline: "2026-04-10",
      status: "진행중" as EventStatus,
      description: "유튜브 웹드라마 주연 캐스팅 오디션입니다.",
      location: "서울특별시 영등포구",
      time: "11:00 - 17:00",
      imageUrl: "/images/events/event-7.jpg",
      href: "/events/7",
      isMemberOnly: true,
      projectName: "첫사랑",
      director: "정OO PD",
      closingDate: "2026-04-10",
      detailContent: "유튜브 오리지널 웹드라마 '첫사랑'의 주연 캐스팅 오디션입니다.",
    },
    {
      id: "event-8",
      type: "특강" as EventType,
      title: "발성 및 발음 교정 특강",
      deadline: "2026-04-15",
      status: "진행중" as EventStatus,
      description: "성우 출신 강사의 발성 및 발음 교정 특강입니다.",
      location: "서울특별시 강남구",
      time: "14:00 - 17:00",
      imageUrl: "/images/events/event-8.jpg",
      href: "/events/8",
      isMemberOnly: false,
      projectName: "발성/발음 특강",
      director: "최OO 성우",
      closingDate: "2026-04-15",
      detailContent: "현직 성우가 직접 진행하는 발성 및 발음 교정 특강입니다.\n배우에게 필수적인 목소리 훈련을 배울 수 있습니다.",
    },
    {
      id: "event-9",
      type: "오디션" as EventType,
      title: "뮤지컬 '레미제라블' 오디션",
      deadline: "2026-04-20",
      status: "진행중" as EventStatus,
      description: "뮤지컬 앙상블 캐스팅 오디션입니다.",
      location: "서울특별시 용산구",
      time: "10:00 - 18:00",
      imageUrl: "/images/events/event-9.jpg",
      href: "/events/9",
      isMemberOnly: true,
      projectName: "레미제라블",
      director: "비공개",
      closingDate: "2026-04-20",
      detailContent: "뮤지컬 '레미제라블' 앙상블 캐스팅 오디션입니다.\n노래와 연기 심사가 함께 진행됩니다.",
    },
  ],
}

// 헬퍼 함수: ID로 이벤트 찾기
export function getEventById(id: string): EventItem | undefined {
  const numericId = id.replace("event-", "")
  return eventData.items.find(
    (item) => item.id === `event-${numericId}` || item.id === id
  )
}

// 헬퍼 함수: 이전/다음 이벤트 찾기
export function getAdjacentEvents(id: string): { prev: EventItem | null; next: EventItem | null } {
  const currentIndex = eventData.items.findIndex(
    (item) => item.id === `event-${id}` || item.id === id || item.id.replace("event-", "") === id
  )
  
  return {
    prev: currentIndex > 0 ? eventData.items[currentIndex - 1] : null,
    next: currentIndex < eventData.items.length - 1 ? eventData.items[currentIndex + 1] : null,
  }
}
