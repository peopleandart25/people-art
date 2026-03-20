/**
 * ============================================================================
 * 피플앤아트 사이트 콘텐츠 관리 데이터
 * ============================================================================
 * 
 * [관리자 안내]
 * 이 파일에서 사이트의 모든 텍스트, 이미지, 링크를 관리할 수 있습니다.
 * 각 섹션별로 데이터가 분리되어 있으며, 필드를 수정하면 사이트에 즉시 반영됩니다.
 * 
 * [이미지 경로 규칙]
 * - public 폴더 기준 상대 경로 사용 (예: "/images/banner.jpg")
 * - 외부 URL도 지원 (예: "https://example.com/image.jpg")
 * 
 * [추후 확장]
 * - 이 파일을 API/CMS와 연동하면 관리자 대시보드에서 실시간 수정 가능
 * - 현재는 정적 데이터로, 수정 후 빌드/배포 필요
 * ============================================================================
 */

// ============================================================================
// 외부 링크 상수 (관리자가 쉽게 수정 가능)
// ============================================================================
export const KAKAO_SUPPORT_URL = "http://pf.kakao.com/_XVxbxon/chat"

// ============================================================================
// 사이트 기본 정보
// [관리 필드: 사이트명, 로고, 연락처, SNS 링크]
// ============================================================================
export const siteInfo = {
  name: "피플앤아트",
  nameEn: "PEOPLE & ART",
  logo: "/images/logo.png",
  description: "프로필이 캐스팅으로 연결되는 플랫폼",
  contact: {
    email: "support@peopleart.co.kr",
    phone: "02-1234-5678",
    address: "서울특별시 강남구 테헤란로 123",
    businessNumber: "123-45-67890",
    ceo: "홍길동",
  },
  social: {
    instagram: "https://instagram.com/peopleart",
    youtube: "https://youtube.com/@peopleart",
    blog: "https://blog.naver.com/peopleart",
    kakao: "https://pf.kakao.com/peopleart",
  },
  copyright: "© 2024 PEOPLE & ART. All rights reserved.",
}

// ============================================================================
// 메인 배너 슬라이드
// [관리 필드: 배경색/이미지, 메인 카피, 서브 카피, CTA 버튼]
// ============================================================================
export const heroBanners = [
  {
    id: "banner-1",
    // 배경 그라데이션 (이미지 사용 시 backgroundImage로 변경)
    backgroundColor: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)",
    backgroundImage: null, // "/images/banner/hero-1.jpg"
    badge: "PEOPLE & ART",
    title: ["배우 연예인지망생 맞춤 알바", "피플앤아트"],
    subtitle: "배우 준비중에도, 수입은 유지하세요",
    description: "오디션, 촬영, 레슨 일정을 고려한 유연한 근무 조건",
    ctaButton: {
      text: "알바 신청하기",
      link: "/jobs",
    },
    secondaryButton: {
      text: "자세히 보기",
      link: "#about",
    },
  },
  {
    id: "banner-2",
    backgroundColor: "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%)",
    backgroundImage: null,
    badge: "PROFILE TOUR",
    title: ["프로필 함이 아닌", "캐스팅 담당자에게 직접 전달"],
    subtitle: "검토 대상 배우로 연결되는 구조",
    description: "무작위 노출이 아닌, 작품과 캐스팅 기준에 맞춘 전략적 프로필 투어",
    ctaButton: {
      text: "프로필 투어 신청",
      link: "/tour",
    },
    secondaryButton: null,
  },
  {
    id: "banner-3",
    backgroundColor: "linear-gradient(135deg, #fee2e2 0%, #fecaca 50%, #fca5a5 100%)",
    backgroundImage: null,
    badge: "MEMBERSHIP",
    title: ["월 44,000원으로", "모든 기회를 무제한으로"],
    subtitle: "프로필 지원, 오디션, 특강까지",
    description: "멤버십 하나로 배우의 모든 활동을 서포트합니다",
    ctaButton: {
      text: "멤버십 가입",
      link: "/membership",
    },
    secondaryButton: {
      text: "혜택 보기",
      link: "/membership#benefits",
    },
  },
]

// ============================================================================
// 빠른 링크 (메인 페이지 서비스 버튼)
// [관리 필드: 아이콘 타입, 라벨, 서브라벨, 링크]
// ============================================================================
export const quickLinks = [
  {
    id: "quick-1",
    iconType: "document", // document, download, headset, crown
    lines: ["프로필 지원하기"],
    sublabel: "(광고에이전시/기획사)",
    href: "/support",
  },
  {
    id: "quick-2",
    iconType: "download",
    lines: ["프로필 양식", "다운로드"],
    sublabel: "",
    href: "/download/profile-template.pdf",
  },
  {
    id: "quick-3",
    iconType: "headset",
    lines: ["고객센터"],
    sublabel: "",
    href: KAKAO_SUPPORT_URL,
    isExternal: true,
  },
  {
    id: "quick-4",
    iconType: "crown",
    lines: ["멤버십 가입"],
    sublabel: "",
    href: "/membership",
  },
]

// ============================================================================
// 이벤트/오디션 목록
// [관리 필드: 제목, 타입, 상태, 마감일, 멤버십 전용 여부]
// ============================================================================
export const events = [
  {
    id: "event-1",
    title: "영화 '새벽의 약속' 오디션",
    type: "오디션", // 오디션, 특강, 이벤트
    status: "진행중", // 진행중, 마감
    deadline: "2026-03-20",
    isMemberOnly: true,
    thumbnail: "/images/events/event-1.jpg",
    description: "20대 초반 남녀 주연 배우를 찾습니다.",
  },
  {
    id: "event-2",
    title: "카메라 연기 워크샵",
    type: "특강",
    status: "진행중",
    deadline: "2026-03-25",
    isMemberOnly: false,
    thumbnail: "/images/events/event-2.jpg",
    description: "현직 감독이 직접 지도하는 카메라 연기 특강",
  },
  {
    id: "event-3",
    title: "광고 모델 오디션",
    type: "오디션",
    status: "진행중",
    deadline: "2026-04-01",
    isMemberOnly: true,
    thumbnail: "/images/events/event-3.jpg",
    description: "대기업 CF 광고 모델 공개 오디션",
  },
  {
    id: "event-4",
    title: "드라마 '청춘기록' 엑스트라",
    type: "오디션",
    status: "마감",
    deadline: "2026-03-10",
    isMemberOnly: false,
    thumbnail: "/images/events/event-4.jpg",
    description: "KBS 수목드라마 엑스트라 모집",
  },
]

// ============================================================================
// 프로필 투어 리스트
// [관리 필드: 작품명, 제작사, 방송사, 캐스팅 상태]
// ============================================================================
export const tourList = [
  {
    id: "tour-1",
    title: "드라마 '사랑의 계절'",
    production: "스튜디오드래곤",
    broadcaster: "tvN",
    status: "캐스팅중",
    roles: ["20대 여자 조연", "30대 남자 단역"],
  },
  {
    id: "tour-2",
    title: "영화 '마지막 여행'",
    production: "NEW",
    broadcaster: "CGV",
    status: "캐스팅중",
    roles: ["40대 남자 주연", "20대 여자 주연"],
  },
  {
    id: "tour-3",
    title: "웹드라마 '캠퍼스 러브'",
    production: "플레이리스트",
    broadcaster: "YouTube",
    status: "완료",
    roles: ["대학생 역할 다수"],
  },
]

// ============================================================================
// 뉴스/소식
// [관리 필드: 제목, 날짜, 썸네일, 링크]
// ============================================================================
export const news = [
  {
    id: "news-1",
    title: "피플앤아트, 2024 캐스팅 플랫폼 대상 수상",
    date: "2024-03-15",
    thumbnail: "/images/news/news-1.jpg",
    excerpt: "배우와 제작사를 연결하는 혁신적인 플랫폼으로 인정받아...",
    link: "/news/1",
  },
  {
    id: "news-2",
    title: "3월 연기 특강 일정 안내",
    date: "2024-03-10",
    thumbnail: "/images/news/news-2.jpg",
    excerpt: "현직 배우가 직접 진행하는 실전 연기 특강이 3월에 열립니다...",
    link: "/news/2",
  },
  {
    id: "news-3",
    title: "신규 제휴 업체 안내",
    date: "2024-03-05",
    thumbnail: "/images/news/news-3.jpg",
    excerpt: "더 많은 기회를 위해 새로운 광고 에이전시와 제휴를 맺었습니다...",
    link: "/news/3",
  },
]

// ============================================================================
// 제휴 업체
// [관리 필드: 업체명, 로고 이미지, 카테고리]
// ============================================================================
export const partners = [
  { id: "partner-1", name: "YG엔터테인먼트", logo: "/images/partners/yg.png", category: "엔터테인먼트" },
  { id: "partner-2", name: "SM엔터테인먼트", logo: "/images/partners/sm.png", category: "엔터테인먼트" },
  { id: "partner-3", name: "JYP엔터테인먼트", logo: "/images/partners/jyp.png", category: "엔터테인먼트" },
  { id: "partner-4", name: "CJ ENM", logo: "/images/partners/cj.png", category: "미디어" },
  { id: "partner-5", name: "스튜디오드래곤", logo: "/images/partners/dragon.png", category: "제작사" },
  { id: "partner-6", name: "제일기획", logo: "/images/partners/cheil.png", category: "광고" },
  { id: "partner-7", name: "이노션", logo: "/images/partners/innocean.png", category: "광고" },
  { id: "partner-8", name: "플레디스", logo: "/images/partners/pledis.png", category: "엔터테인먼트" },
]

// ============================================================================
// 후기
// [관리 필드: 작성자, 내용, 별점, 날짜, 프로필 이미지]
// ============================================================================
export const reviews = [
  {
    id: "review-1",
    author: "김O희",
    role: "배우",
    content: "프로필 투어를 통해 실제 드라마 오디션 기회를 얻었습니다. 캐스팅 담당자에게 직접 전달된다는 점이 가장 좋았어요.",
    rating: 5,
    date: "2024-03-10",
    avatar: null,
  },
  {
    id: "review-2",
    author: "이O준",
    role: "신인 배우",
    content: "멤버십 가입 후 3개월 만에 광고 촬영 기회를 얻었습니다. 연기 특강도 실질적인 도움이 많이 됐어요.",
    rating: 5,
    date: "2024-03-05",
    avatar: null,
  },
  {
    id: "review-3",
    author: "박O연",
    role: "뮤지컬 배우",
    content: "프로필 양식 제공과 지원 시스템이 정말 편리해요. 일일이 이메일 보낼 필요 없이 클릭 한 번으로 가능합니다.",
    rating: 4,
    date: "2024-02-28",
    avatar: null,
  },
]

// ============================================================================
// FAQ (자주 묻는 질문)
// [관리 필드: 질문, 답변, 카테고리]
// ============================================================================
export const faqs = [
  {
    id: "faq-1",
    question: "멤버십은 어떻게 가입하나요?",
    answer: "홈페이지 상단의 '멤버십 가입' 버튼을 클릭하시거나, 로그인 후 마이페이지에서 멤버십 탭을 선택하여 가입하실 수 있습니다. 월 44,000원의 이용료가 발생합니다.",
    category: "멤버십",
  },
  {
    id: "faq-2",
    question: "프로필 투어란 무엇인가요?",
    answer: "프로필 투어는 회원님의 프로필을 캐스팅 담당자에게 직접 전달하는 서비스입니다. 단순히 프로필을 올리는 것이 아니라, 작품과 캐스팅 기준에 맞춰 전략적으로 배우를 소개합니다.",
    category: "서비스",
  },
  {
    id: "faq-3",
    question: "프로필 지원은 몇 곳까지 가능한가요?",
    answer: "일반 회원은 총 5곳까지 무료로 지원 가능하며, 멤버십 회원은 무제한으로 지원하실 수 있습니다.",
    category: "서비스",
  },
  {
    id: "faq-4",
    question: "연기 특강은 어떻게 참여하나요?",
    answer: "멤버십 회원에게는 연기 특강 참여 기회가 제공됩니다. 특강 일정이 공지되면 이벤트 페이지에서 신청하실 수 있습니다.",
    category: "특강",
  },
  {
    id: "faq-5",
    question: "환불 규정이 어떻게 되나요?",
    answer: "결제 후 7일 이내, 서비스 이용 전이라면 전액 환불이 가능합니다. 자세한 사항은 고객센터로 문의해주세요.",
    category: "결제",
  },
]

// ============================================================================
// 멤버십 정보
// [관리 필드: 가격, 혜택, 서비스 설명]
// ============================================================================
export const membershipData = {
  price: 44000,
  signupBonus: 15000,
  referralBonus: 10000,
  benefits: [
    {
      id: "benefit-1",
      iconType: "send",
      title: "광고에이전시/엔터테인먼트 무제한 지원",
      description: "공개된 공식 지원 채널을 통한 무제한 프로필 지원",
    },
    {
      id: "benefit-2",
      iconType: "document",
      title: "프로필 양식 제공",
      description: "처음 시작하는 배우를 위한 전용 양식 다운로드",
    },
    {
      id: "benefit-3",
      iconType: "megaphone",
      title: "작품 오디션/이벤트 우선 신청",
      description: "멤버십 회원 대상 우선 오디션 및 이벤트 참여",
    },
    {
      id: "benefit-4",
      iconType: "users",
      title: "연기 특강 참여 기회",
      description: "현업 배우가 직접 진행하는 실전 중심 특강",
    },
    {
      id: "benefit-5",
      iconType: "film",
      title: "자동 프로필 투어",
      description: "캐스팅 담당자에게 직접 전달되는 프로필 투어",
    },
    {
      id: "benefit-6",
      iconType: "gift",
      title: "가입 포인트 지급",
      description: "멤버십 가입 시 15,000P 즉시 지급",
    },
  ],
  services: [
    {
      id: "service-1",
      number: "01",
      title: "프로필 투어",
      subtitle: "프로필 함이 아닌, 캐스팅 담당자에게 직접 전달",
      description: "작품과 캐스팅 기준에 맞춰 배우의 프로필이 실제 캐스팅 담당자에게 전달됩니다. 무작위 노출이 아닌, 검토 대상 배우로 연결되는 구조입니다.",
      image: "/images/membership/service-01-tour.jpg",
    },
    {
      id: "service-2",
      number: "02",
      title: "광고/엔터테인먼트 프로필 지원하기",
      subtitle: "광고/엔터테인먼트 공개 지원 창구를 통한 프로필 지원 기능",
      description: "광고/엔터테인먼트에서 공개한 공식 지원 채널을 통해 회원이 직접 자신의 프로필과 영상을 지원할 수 있는 기능을 제공합니다.",
      image: "/images/membership/service-02-support.jpg",
    },
    {
      id: "service-3",
      number: "03",
      title: "무료 연기 특강",
      subtitle: "현업 배우에게 배우는 실전 중심 특강",
      description: "아카데미 운영중인 현직 배우가 직접 연기를 지도하는 실전 중심 프로그램입니다. 오디션 합격의 가장 중요한 요소는 결국 연기력이며, 현업의 기준과 노하우를 경험할 수 있습니다.",
      image: "/images/membership/service-03-lecture.jpg",
    },
    {
      id: "service-4",
      number: "04",
      title: "프로필 양식 제공",
      subtitle: "처음 시작하는 배우를 위한 전용 양식",
      description: "첫 프로필 제작이 막막한 배우를 위해 프로필 양식을 제공합니다. 다운로드 후 간편하게 작성하여 바로 활용할 수 있습니다.",
      image: "/images/membership/service-04-template.jpg",
    },
    {
      id: "service-5",
      number: "05",
      title: "작품 오디션 기회",
      subtitle: "프로필 투어와 연계된 실제 오디션",
      description: "진행 중인 작품 오디션이 이벤트 형식으로 제공됩니다. 작품 조건, 연령대, 이미지 등에 따라 모든 회원이 무조건 참여할 수는 없지만, 가능한 많은 배우에게 기회가 연결되도록 운영됩니다.",
      image: "/images/membership/service-05-audition.jpg",
    },
  ],
  faqs: [
    {
      question: "멤버십은 어떻게 가입하나요?",
      answer: "회원가입 후 결제 페이지에서 멤버십(월 44,000원)을 선택해 결제하시면 됩니다. 추천인 코드가 있으시면 가입 시 입력해 주세요.",
    },
    {
      question: "프로필 투어는 무엇인가요?",
      answer: "작품/캐스팅 기준에 맞춰 회원 프로필이 캐스팅 담당자에게 자동 전달되는 서비스입니다. 멤버십 회원에게 제공됩니다.",
    },
    {
      question: "환불이 가능한가요?",
      answer: "환불 정책에 따라 이용 일수에 따른 차감 후 환불 가능합니다. 자세한 내용은 환불 정책 페이지를 확인해 주세요.",
    },
  ],
  comparison: [
    { feature: "프로필 양식 다운로드", basic: true, premium: true },
    { feature: "프로필 지원 (광고·엔터)", basic: "총 5곳 제공", premium: "무제한" },
    { feature: "자동 프로필 투어", basic: false, premium: true },
    { feature: "작품 오디션 및 이벤트 우선 신청", basic: false, premium: true },
    { feature: "연기 특강 참여 기회", basic: false, premium: true },
  ],
  steps: [
    { number: 1, title: "회원가입", description: "사이트에서 회원가입 후 로그인합니다." },
    { number: 2, title: "멤버십 결제", description: "결제 페이지에서 멤버십(월 44,000원)을 선택해 결제합니다. 추천인 코드가 있으면 입력하세요." },
    { number: 3, title: "기회 연결", description: "프로필 투어, 오디션·이벤트·특강 등 멤버십 혜택을 이용합니다." },
  ],
}

// ============================================================================
// 프로필 지원 가능 기관 목록
// [관리 필드: 기관명, 이메일, 홈페이지, 카테고리]
// ============================================================================
export const supportAgencies = [
  {
    id: "agency-1",
    name: "YG엔터테인먼트",
    email: "casting@ygent.com",
    website: "https://www.ygfamily.com",
    category: "엔터테인먼트",
    description: "빅뱅, 블랙핑크 등 소속",
  },
  {
    id: "agency-2",
    name: "SM엔터테인먼트",
    email: "audition@smtown.com",
    website: "https://www.smentertainment.com",
    category: "엔터테인먼트",
    description: "EXO, aespa 등 소속",
  },
  {
    id: "agency-3",
    name: "JYP엔터테인먼트",
    email: "audition@jype.com",
    website: "https://www.jype.com",
    category: "엔터테인먼트",
    description: "트와이스, 스트레이키즈 등 소속",
  },
  {
    id: "agency-4",
    name: "제일기획",
    email: "model@cheil.com",
    website: "https://www.cheil.com",
    category: "광고에이전시",
    description: "삼성그룹 광고 대행",
  },
  {
    id: "agency-5",
    name: "이노션",
    email: "casting@innocean.com",
    website: "https://www.innocean.com",
    category: "광고에이전시",
    description: "현대그룹 광고 대행",
  },
  // ... 더 많은 기관 추가 가능
]

// ============================================================================
// 소식(NEWS) 섹션 데이터
// [관리 필드: 뉴스 이미지, 제목, 날짜, 링크]
// ============================================================================
export const newsData = {
  sectionTitle: "NEWS",
  sectionSubtitle: "소식",
  viewAllLink: "/news",
  itemsPerPage: 8,
  items: [
    {
      id: "news-1",
      title: "12월 첫째 주 '오늘의 원픽' 배우 오재형",
      date: "2025-12-11",
      image: "/images/news/news-1.jpg",
      href: "/news/1",
      content: "피플앤아트가 선정한 12월 첫째 주 '오늘의 원픽' 배우는 오재형 배우입니다. 오재형 배우는 깊이 있는 연기력과 다양한 캐릭터 소화력으로 주목받고 있으며, 최근 여러 작품에서 인상적인 활약을 보여주고 있습니다.\n\n앞으로의 활동이 더욱 기대되는 배우입니다.",
    },
    {
      id: "news-2",
      title: "12월 둘째 주 '오늘의 원픽' 배우 장원준",
      date: "2025-12-11",
      image: "/images/news/news-2.jpg",
      href: "/news/2",
      content: "12월 둘째 주 '오늘의 원픽'으로 선정된 장원준 배우를 소개합니다. 장원준 배우는 섬세한 감정 연기와 자연스러운 표현력으로 많은 사랑을 받고 있습니다.\n\n다양한 장르의 작품에서 활약 중이며, 앞으로의 행보가 기대됩니다.",
    },
    {
      id: "news-3",
      title: "피플앤아트 신규 제휴 스튜디오 오픈",
      date: "2025-12-05",
      image: "/images/news/news-3.jpg",
      href: "/news/3",
      content: "피플앤아트가 새로운 제휴 스튜디오를 오픈했습니다. 이번에 새롭게 제휴를 맺은 스튜디오는 최신 장비와 전문 스태프를 갖추고 있어 더욱 퀄리티 높은 프로필 촬영이 가능합니다.\n\n회원 여러분께 특별 할인 혜택도 제공될 예정이니 많은 관심 부탁드립니다.",
    },
    {
      id: "news-4",
      title: "2026년 상반기 프로필 투어 일정 안내",
      date: "2025-12-01",
      image: "/images/news/news-4.jpg",
      href: "/news/4",
      content: "2026년 상반기 프로필 투어 일정을 안내드립니다.\n\n1월: 서울 지역 제작사 방문\n2월: 부산/경남 지역 제작사 방문\n3월: 대전/충청 지역 제작사 방문\n4월: 광주/전라 지역 제작사 방문\n5월: 대구/경북 지역 제작사 방문\n6월: 특별 기획 투어\n\n자세한 일정은 추후 공지될 예정입니다.",
    },
    {
      id: "news-5",
      title: "연기 특강 12월 일정 공지",
      date: "2025-11-28",
      image: "/images/news/news-5.jpg",
      href: "/news/5",
      content: "12월 연기 특강 일정을 안내드립니다.\n\n12월 7일(토) 오후 2시 - 카메라 연기 기초\n12월 14일(토) 오후 2시 - 감정 표현 워크숍\n12월 21일(토) 오후 2시 - 오디션 실전 대비\n\n현직 배우가 직접 지도하는 무료 프로그램입니다. 많은 참여 부탁드립니다.",
    },
    {
      id: "news-6",
      title: "신규 회원 가입 이벤트 안내",
      date: "2025-11-25",
      image: "/images/news/news-6.jpg",
      href: "/news/6",
      content: "피플앤아트 신규 회원 가입 이벤트를 진행합니다. 이벤트 기간 동안 가입하시는 분들께 특별 혜택을 드립니다.\n\n기간: 2025년 11월 25일 ~ 12월 31일\n혜택: 첫 프로필 투어 20% 할인",
    },
    {
      id: "news-7",
      title: "11월 프로필 투어 성공 후기",
      date: "2025-11-20",
      image: "/images/news/news-7.jpg",
      href: "/news/7",
      content: "11월 프로필 투어가 성공적으로 마무리되었습니다. 이번 투어에서는 총 15개 제작사를 방문하여 참가 배우들의 프로필을 전달했습니다.\n\n다음 투어도 많은 관심 부탁드립니다.",
    },
    {
      id: "news-8",
      title: "피플앤아트 공식 SNS 오픈",
      date: "2025-11-15",
      image: "/images/news/news-8.jpg",
      href: "/news/8",
      content: "피플앤아트 공식 SNS 채널을 오픈했습니다. 인스타그램과 유튜브에서 더 다양한 소식을 만나보세요.\n\n팔로우하시고 최신 소식을 빠르게 받아보세요!",
    },
    {
      id: "news-9",
      title: "연기 아카데미 제휴 안내",
      date: "2025-11-10",
      image: "/images/news/news-9.jpg",
      href: "/news/9",
      content: "새로운 연기 아카데미와 제휴를 맺었습니다. 피플앤아트 회원들은 제휴 아카데미에서 특별 할인 혜택을 받으실 수 있습니다.\n\n자세한 내용은 제휴업체 페이지를 확인해주세요.",
    },
    {
      id: "news-10",
      title: "10월 '오늘의 원픽' 총정리",
      date: "2025-11-05",
      image: "/images/news/news-10.jpg",
      href: "/news/10",
      content: "10월 한 달간 선정된 '오늘의 원픽' 배우들을 총정리했습니다. 다양한 매력을 가진 배우들의 프로필을 한눈에 확인해보세요.",
    },
    {
      id: "news-11",
      title: "광고 캐스팅 연결 성공 사례",
      date: "2025-11-01",
      image: "/images/news/news-11.jpg",
      href: "/news/11",
      content: "피플앤아트를 통해 광고 캐스팅에 성공한 사례를 소개합니다. 프로필 투어를 통해 전달된 자료가 실제 캐스팅으로 이어진 성공 스토리입니다.",
    },
    {
      id: "news-12",
      title: "가을 시즌 프로필 촬영 팁",
      date: "2025-10-28",
      image: "/images/news/news-12.jpg",
      href: "/news/12",
      content: "가을 시즌에 맞는 프로필 촬영 팁을 알려드립니다. 자연광을 활용한 야외 촬영과 따뜻한 톤의 의상 선택 등 실용적인 조언을 담았습니다.",
    },
  ],
}

// ============================================================================
// 제휴업체(PARTNERS) 섹션 데이터
// [관리 필드: 제휴업체 이미지, 이름, 카테고리, 링크]
// ============================================================================
export const partnersData = {
  sectionTitle: "PARTNERSHIP",
  sectionSubtitle: "제휴업체",
  viewAllLink: "/partners",
  description: "피플앤아트 공식 제휴 업체입니다.",
  items: [
    {
      id: "partner-1",
      name: "OJ STUDIO",
      category: "프로필 촬영 스튜디오",
      image: "/images/partners/oj-studio.jpg",
      link: "#",
    },
    {
      id: "partner-2",
      name: "펠리즈 아트",
      category: "연기 아카데미",
      image: "/images/partners/feliz-art.jpg",
      link: "#",
    },
    {
      id: "partner-3",
      name: "스튜디오 필름",
      category: "영상제작 스튜디오",
      image: "/images/partners/studio-film.jpg",
      link: "#",
    },
    {
      id: "partner-4",
      name: "더 스튜디오",
      category: "프로필 촬영 스튜디오",
      image: "/images/partners/the-studio.jpg",
      link: "#",
    },
    {
      id: "partner-5",
      name: "액팅 랩",
      category: "연기 아카데미",
      image: "/images/partners/acting-lab.jpg",
      link: "#",
    },
    {
      id: "partner-6",
      name: "무브먼트 스튜디오",
      category: "댄스/무브먼트",
      image: "/images/partners/movement-studio.jpg",
      link: "#",
    },
  ],
}

// ============================================================================
// 회사 소개 및 서비스 안내 페이지
// [관리 필드: 히어로 섹션, 서비스 소개, CTA 등 모든 텍스트]
// ============================================================================
export const aboutPageData = {
  hero: {
    badge: "PEOPLE & ART",
    title: "프로필이 캐스팅으로 연결되는 플랫폼",
    description:
      "피플앤아트는 배우의 프로필이 실제 캐스팅 현장에 도달할 수 있도록 설계된 프로필 전달 및 기회 연결 플랫폼입니다.",
  },
  directSystem: {
    badge: "다이렉트 전달 시스템",
    title: "프로필함이 아닌 직접 전달",
    description:
      "제작사 앞에 놓인 프로필함에 자료를 넣는 방식이 아니라, 매니지먼트 영업 방식에 가까운 구조로 배우의 프로필과 자료를 캐스팅 담당자에게 직접 전달하는 시스템을 운영합니다.",
    subDescription:
      "이를 통해 배우가 단순 지원자가 아닌, 검토 가능한 후보로 전달되는 구조를 만듭니다.",
    ctaButton: {
      text: "프로필 투어 알아보기",
      link: "/tour",
    },
    highlight: "검토 가능한 후보로 전달되는 구조",
  },
  services: {
    title: "서비스 안내",
    items: [
      {
        id: "service-about-1",
        number: "①",
        iconType: "send",
        title: "프로필 투어",
        subtitle: "프로필 함이 아닌, 캐스팅 담당자에게 직접 전달",
        description:
          "작품과 캐스팅 기준에 맞춰 배우의 프로필이 실제 캐스팅 담당자에게 전달됩니다. 무작위 지원이 아닌, 검토 대상 배우로 연결되는 구조입니다.",
      },
      {
        id: "service-about-2",
        number: "②",
        iconType: "document",
        title: "무료 프로필 양식",
        subtitle: "이제 막 시작한 배우를 위한 전용 프로필 양식 제공",
        description:
          "첫 프로필 제작할 때 막막한 배우를 위해 피플앤아트가 프로필 양식을 제공합니다. 다운로드 후 간편하게 작성하여 사용할 수 있습니다.",
      },
      {
        id: "service-about-3",
        number: "③",
        iconType: "mail",
        title: "광고·엔터테인먼트 메일 발송",
        subtitle: "광고·엔터테인먼트 회사에 프로필을 직접 전달",
        description:
          "플랫폼을 통해 회원이 자신의 프로필과 영상을 광고 및 엔터테인먼트 회사로 직접 발송할 수 있습니다.",
      },
      {
        id: "service-about-4",
        number: "④",
        iconType: "film",
        title: "작품 오디션 기회",
        subtitle: "진행 중인 작품 오디션으로 실제 기회에 도전",
        description:
          "프로필 투어와 연계된 작품 오디션이 이벤트 형식으로 제공됩니다. 연령대, 이미지, 작품 조건에 따라 가능한 많은 배우에게 기회가 연결되도록 운영됩니다.",
      },
      {
        id: "service-about-5",
        number: "⑤",
        iconType: "users",
        title: "연기 특강",
        subtitle: "현업 배우에게 배우는 무료 실전 연기 특강",
        description:
          "현직 배우 및 아카데미 운영 배우가 직접 연기를 지도하는 무료 프로그램입니다. 오디션 합격의 가장 중요한 요소는 결국 연기력이며, 현업의 기준과 노하우를 부담 없이 경험할 수 있습니다.",
      },
    ],
  },
  cta: {
    title: "지금 바로 피플앤아트와 함께",
    subtitle: "커리어를 만들어 가세요!",
    button: {
      text: "멤버십 가입 하러가기",
      link: "/membership",
    },
  },
}

// ============================================================================
// 푸터 데이터
// [관리 필드: 회사정보, 연락처, 바로가기 링크]
// ============================================================================
export const footerData = {
  company: {
    name: "피플앤아트(PEOPLE AND ART)",
    ceo: "김슬기",
    businessNumber: "350-01-02292",
    salesNumber: "제2025-서울성북-0001호",
  },
  contact: {
    address: "서울특별시 성북구 동소문로 20길 29-11, 4층(동선동 1가, 반석빌딩)",
    email: "peopleandart25@gmail.com",
    bankAccount: "카카오뱅크 3333-3453-30161 피플앤아트(김슬기)",
  },
  links: [
    { label: "이용약관", href: "/terms", isExternal: false },
    { label: "개인정보처리방침", href: "/privacy", isExternal: false },
    { label: "고객센터", href: KAKAO_SUPPORT_URL, isExternal: true },
    { label: "제휴문의", href: "/partnership", isExternal: false },
  ],
  social: {
    kakao: "https://pf.kakao.com/peopleart",
    instagram: "https://instagram.com/peopleart",
    youtube: "https://youtube.com/@peopleart",
  },
  copyright: "© 2026 PEOPLE & ART. All rights reserved.",
}

// ============================================================================
// 네비게이션 메뉴
// [관리 필드: 라벨, 링크, 표시 여부]
// ============================================================================
export const navigation = {
  main: [
    { label: "피플앤아트", href: "/about", visible: true },
    { label: "소식", href: "/#news", visible: true },
    { label: "이벤트", href: "/#events", visible: true },
    { label: "투어리스트", href: "/#tourlist", visible: true },
    { label: "프로필 지원", href: "/support", visible: true },
    { label: "제휴업체", href: "/#partnership", visible: true },
    { label: "멤버십", href: "/membership", visible: true },
    { label: "후기", href: "/#review", visible: true },
  ],
  footer: [
    { label: "이용약관", href: "/terms", visible: true, isExternal: false },
    { label: "개인정보처리방침", href: "/privacy", visible: true, isExternal: false },
    { label: "고객센터", href: KAKAO_SUPPORT_URL, visible: true, isExternal: true },
    { label: "제휴문의", href: "/partnership", visible: true, isExternal: false },
  ],
}

// ============================================================================
// 타입 정의 (TypeScript)
// ============================================================================
export type HeroBanner = typeof heroBanners[number]
export type QuickLink = typeof quickLinks[number]
export type Event = typeof events[number]
export type TourItem = typeof tourList[number]
export type NewsItem = typeof news[number]
export type Partner = typeof partners[number]
export type Review = typeof reviews[number]
export type FAQ = typeof faqs[number]
export type Agency = typeof supportAgencies[number]
