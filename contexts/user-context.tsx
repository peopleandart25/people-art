"use client"

import { createContext, useContext, useState, ReactNode } from "react"

export type UserStatus = "guest" | "basic" | "premium" | "admin"

// 멤버십 구독 상태
export type MembershipState = "active" | "pending_cancellation" | "cancelled"

// 포인트 갱신 예약 정보
export interface PointRenewalReservation {
  pointsToUse: number
  finalPaymentAmount: number
  reservedAt: string
}

export interface VideoAsset {
  id: string
  type: "file" | "link"
  name: string
  url: string
  thumbnail?: string
  duration?: string
  size?: string
  platform?: "youtube" | "vimeo" | "other"
  createdAt: string
}

export interface SubPhoto {
  id: string
  url: string
  name: string
  isMain: boolean
}

export type CareerCategory = "드라마" | "영화" | "광고" | "단편" | "독립" | "웹드라마" | "OTT" | "숏폼" | "연극" | "뮤지컬" | "뮤직비디오"

export interface CareerItem {
  id: string
  category: CareerCategory
  year: string
  title: string
  role: string
}

export type GraduationStatus = "졸업" | "재학" | "중퇴" | "휴학"

export interface EducationInfo {
  school: string
  isCustomSchool: boolean
  department: string
  graduationStatus: GraduationStatus
}

export interface SocialLinks {
  instagram: string
  youtube: string
  tiktok: string
}

export type StatusTag = "아이돌 연습생 출신" | "아이돌" | "외국인" | "모델" | "인플루언서" | "유튜버" | "뮤지컬 배우" | "가수" | "성우" | "개그맨" | "아나운서" | "MC" | "나레이터"

export interface UserProfile {
  name: string
  phone: string
  email: string
  birthDate: string
  gender: string
  height: string
  weight: string
  bio: string
  careerList: CareerItem[]
  etcInfo: string
  statusTags: StatusTag[]
  educationInfo: EducationInfo
  socialLinks: SocialLinks
  profileImage: string | null
  subPhotos: SubPhoto[]
  portfolioFile: string | null
  portfolioFileName: string | null
  videoAssets: VideoAsset[]
}

interface UserContextType {
  status: UserStatus
  points: number
  profile: UserProfile
  // 멤버십 구독 관리
  membershipState: MembershipState
  membershipExpiryDate: Date | null
  pointRenewalReservation: PointRenewalReservation | null
  // 기본 함수
  setStatus: (status: UserStatus) => void
  setPoints: (points: number) => void
  updateProfile: (profile: Partial<UserProfile>) => void
  login: (asMember?: boolean) => void
  logout: () => void
  upgradeToPremium: () => void
  // 멤버십 관리 함수
  setMembershipState: (state: MembershipState) => void
  reservePointRenewal: (reservation: PointRenewalReservation) => void
  cancelPointRenewal: () => void
  cancelMembership: () => void
}

const defaultProfile: UserProfile = {
  name: "홍길동",
  phone: "010-1234-5678",
  email: "hong@example.com",
  birthDate: "1995-03-15",
  gender: "남성",
  height: "175",
  weight: "70",
  bio: "연기에 대한 열정으로 다양한 작품 활동을 해온 배우입니다. 영화, 드라마, 연극 등 다양한 장르에서 경험을 쌓았으며, 캐릭터에 대한 깊은 이해와 표현력을 강점으로 가지고 있습니다.",
  careerList: [
    { id: "1", category: "드라마", year: "2024", title: "빛나는 별 (KBS)", role: "조연" },
    { id: "2", category: "영화", year: "2023", title: "새벽의 약속", role: "단역" },
    { id: "3", category: "드라마", year: "2022", title: "햄릿", role: "주연" },
  ],
  etcInfo: "특기: 검도, 수영 / 외국어: 영어(일상회화)",
  statusTags: [],
  educationInfo: {
    school: "",
    isCustomSchool: false,
    department: "",
    graduationStatus: "재학",
  },
  socialLinks: {
    instagram: "",
    youtube: "",
    tiktok: "",
  },
  profileImage: null,
  subPhotos: [],
  portfolioFile: null,
  portfolioFileName: null,
  videoAssets: [],
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<UserStatus>("premium") // 데모: 멤버십 회원으로 시작
  const [points, setPoints] = useState(15000)
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)
  
  // 멤버십 구독 상태
  const [membershipState, setMembershipState] = useState<MembershipState>("active")
  const [membershipExpiryDate, setMembershipExpiryDate] = useState<Date | null>(() => {
    // 데모: 30일 후 만료
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 30)
    return expiryDate
  })
  const [pointRenewalReservation, setPointRenewalReservation] = useState<PointRenewalReservation | null>(null)

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }))
  }

  const login = (asMember = false) => {
    setStatus(asMember ? "premium" : "basic")
    setPoints(asMember ? 15000 : 0)
  }

  const logout = () => {
    setStatus("guest")
    setPoints(0)
  }

  const upgradeToPremium = () => {
    setStatus("premium")
    setPoints(15000)
    setMembershipState("active")
    // 30일 후 만료일 설정
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 30)
    setMembershipExpiryDate(expiryDate)
  }

  // 포인트 갱신 예약
  const reservePointRenewal = (reservation: PointRenewalReservation) => {
    setPointRenewalReservation(reservation)
  }

  // 포인트 갱신 예약 취소 (예약 정보만 삭제, 포인트 복구는 호출측에서 처리)
  const cancelPointRenewal = () => {
    if (pointRenewalReservation) {
      // 예약 정보만 삭제 (포인트 복구는 handleCancelPointUsage에서 lastUsedPoints로 정밀하게 처리)
      setPointRenewalReservation(null)
    }
  }

  // 멤버십 해지 예약 (즉시 해지 X, 만료일까지 유지)
  const cancelMembership = () => {
    setMembershipState("pending_cancellation")
    // 실제 구현 시: 서버에 해지 예약 요청
    // 스케줄러가 만료일에 자동으로 status를 "member"로 변경
  }

  /**
   * [스케줄러 로직 - 서버 사이드 구현 필요]
   * 
   * // 매일 자정에 실행되는 스케줄러
   * async function checkMembershipExpiry() {
   *   const today = new Date()
   *   
   *   // 1. 해지 예정 회원 중 만료일이 지난 회원 조회
   *   const expiredMembers = await db.query(`
   *     SELECT * FROM users 
   *     WHERE membership_state = 'pending_cancellation' 
   *     AND membership_expiry_date <= $1
   *   `, [today])
   *   
   *   // 2. 등급 자동 회수
   *   for (const member of expiredMembers) {
   *     await db.query(`
   *       UPDATE users 
   *       SET status = 'member', 
   *           membership_state = 'cancelled',
   *           membership_expiry_date = NULL
   *       WHERE id = $1
   *     `, [member.id])
   *     
   *     // 3. 알림 발송
   *     await sendNotification(member.id, {
   *       title: '멤버십 종료 안내',
   *       message: '멤버십 이용 기간이 종료되어 일반 회원으로 전환되었습니다.'
   *     })
   *   }
   *   
   *   // 4. 자동 갱신 회원 처리 (포인트 우선 차감)
   *   const renewalMembers = await db.query(`
   *     SELECT * FROM users 
   *     WHERE membership_state = 'active' 
   *     AND membership_expiry_date <= $1
   *     AND point_renewal_reservation IS NOT NULL
   *   `, [today])
   *   
   *   for (const member of renewalMembers) {
   *     const reservation = member.point_renewal_reservation
   *     
   *     // 포인트 차감
   *     await db.query(`
   *       UPDATE users 
   *       SET points = points - $1,
   *           membership_expiry_date = DATE_ADD(NOW(), INTERVAL 30 DAY),
   *           point_renewal_reservation = NULL
   *       WHERE id = $2
   *     `, [reservation.pointsToUse, member.id])
   *     
   *     // 카드 결제 처리 (차액)
   *     if (reservation.finalPaymentAmount > 0) {
   *       await processCardPayment(member.id, reservation.finalPaymentAmount)
   *     }
   *   }
   * }
   */

  return (
    <UserContext.Provider
      value={{
        status,
        points,
        profile,
        membershipState,
        membershipExpiryDate,
        pointRenewalReservation,
        setStatus,
        setPoints,
        updateProfile,
        login,
        logout,
        upgradeToPremium,
        setMembershipState,
        reservePointRenewal,
        cancelPointRenewal,
        cancelMembership,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}

// 안전한 useUser - Provider 외부에서 사용 시 기본값 반환
export function useUserSafe() {
  const context = useContext(UserContext)
  if (context === undefined) {
    return {
      status: "guest" as UserStatus,
      points: 0,
      profile: defaultProfile,
      membershipState: "active" as MembershipState,
      membershipExpiryDate: null,
      pointRenewalReservation: null,
      setStatus: () => {},
      setPoints: () => {},
      updateProfile: () => {},
      login: () => {},
      logout: () => {},
      upgradeToPremium: () => {},
      setMembershipState: () => {},
      reservePointRenewal: () => {},
      cancelPointRenewal: () => {},
      cancelMembership: () => {},
    }
  }
  return context
}

// 접근 권한 체크 헬퍼 함수
export function canAccessRestrictedContent(status: UserStatus): boolean {
  return status === "premium" || status === "admin"
}

export function isLoggedIn(status: UserStatus): boolean {
  return status !== "guest"
}

export function getStatusLabel(status: UserStatus): string {
  switch (status) {
    case "guest": return "비로그인"
    case "basic": return "일반 회원"
    case "premium": return "멤버십 회원"
    case "admin": return "관리자"
    default: return "알 수 없음"
  }
}
