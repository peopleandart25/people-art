"use client"

import React, { useState, useEffect, use } from "react"
import Image from "next/image"
import Link from "next/link"
import dynamic from "next/dynamic"
import {
  ArrowLeft,
  User,
  Download,
  FileText,
  Video,
  Shield,
  Calendar,
  Ruler,
  Weight,
  Globe,
  Sparkles,
  Briefcase,
  GraduationCap,
  ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  ExternalLink,
  Lock,
  Crown,
  Bookmark,
  BookmarkCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CareerItem, VideoItem } from "@/contexts/artist-context"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

// ReactPlayer 동적 import (SSR 비활성화) - 표준 경로 사용
const ReactPlayer = dynamic(() => import("react-player"), { 
  ssr: false,
  loading: () => (
    <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <Play className="h-12 w-12 text-gray-500 mx-auto mb-2 animate-pulse" />
        <p className="text-sm text-gray-400">영상 로딩 중...</p>
      </div>
    </div>
  )
})

/**
 * [아티스트 상세 프로필 페이지]
 * 
 * 레이아웃:
 * - 좌측: 메인 프로필 사진 + 바로 아래 서브 사진 갤러리 (썸네일 그리드)
 * - 우측: 기본 정보 + 태그 + 특기/외국어/학교
 * - 하단: 경력 테이블
 * - 영상 섹션: "연기 및 출연 영상" (react-player로 MP4/유튜브 혼합 지원)
 */

interface ArtistDetailPageProps {
  params: Promise<{ id: string }>
}

interface ArtistData {
  id: string
  userId: string
  name: string
  profileImage: string | null
  subImages: string[]
  gender: string
  birthDate: string
  age: number
  height: string
  weight: string
  statusTags: string[]
  bio: string
  skills: string[]
  languages: string[]
  school: string | null
  careers: CareerItem[]
  videos: VideoItem[]
  videoUrl: string | null
  pdfUrl: string | null
}

export default function ArtistDetailPage({ params }: ArtistDetailPageProps) {
  const { id } = use(params)
  const { isPremium, isAdmin, profile } = useAuth()
  const { toast } = useToast()

  const canViewRestricted = isPremium || isAdmin
  const isCastingDirector = profile?.role === "casting_director"

  const [artist, setArtist] = useState<ArtistData | null>(null)
  const [loadingArtist, setLoadingArtist] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [showProposalModal, setShowProposalModal] = useState(false)
  const [proposalMessage, setProposalMessage] = useState("")
  const [sendingProposal, setSendingProposal] = useState(false)

  const handleSendProposal = async () => {
    if (!artist) return
    setSendingProposal(true)
    try {
      const res = await fetch("/api/director/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artist_user_ids: [artist.userId], message: proposalMessage }),
      })
      if (res.ok) {
        setShowProposalModal(false)
        setProposalMessage("")
        toast({ title: "캐스팅 제안 전송 완료", description: "아티스트에게 제안이 전달되었습니다." })
      }
    } finally {
      setSendingProposal(false)
    }
  }

  useEffect(() => {
    const fetchArtist = async () => {
      setLoadingArtist(true)
      const supabase = createClient()

      const { data: ap } = await supabase
        .from("artist_profiles")
        .select("*")
        .eq("id", id)
        .single()

      if (!ap) { setLoadingArtist(false); return }

      const [
        { data: profile },
        { data: photos },
        { data: careers },
        { data: videoAssets },
        { data: statusTagJoins },
      ] = await Promise.all([
        supabase.from("profiles").select("name").eq("id", ap.user_id).single(),
        supabase.from("artist_photos").select("url, is_main, sort_order").eq("user_id", ap.user_id).order("sort_order"),
        supabase.from("career_items").select("id, category, year, title, role, sort_order").eq("user_id", ap.user_id).order("sort_order"),
        supabase.from("video_assets").select("id, type, name, url, platform, sort_order").eq("user_id", ap.user_id).order("sort_order"),
        supabase.from("artist_status_tags").select("tag_id, status_tags(name)").eq("artist_id", ap.id),
      ])

      const tags = (statusTagJoins ?? []).map(j => (j.status_tags as { name: string } | null)?.name).filter(Boolean) as string[]

      const mainPhoto = (photos ?? []).find(p => p.is_main)
      const subPhotos = (photos ?? []).filter(p => !p.is_main).map(p => p.url)

      const today = new Date()
      const birth = ap.birth_date ? new Date(ap.birth_date) : null
      let age = 0
      if (birth) {
        age = today.getFullYear() - birth.getFullYear()
        const m = today.getMonth() - birth.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
      }

      setArtist({
        id: ap.id,
        userId: ap.user_id,
        name: profile?.name ?? "",
        profileImage: mainPhoto?.url ?? null,
        subImages: subPhotos,
        gender: ap.gender ?? "",
        birthDate: ap.birth_date ?? "",
        age,
        height: ap.height != null ? String(ap.height) : "",
        weight: ap.weight != null ? String(ap.weight) : "",
        statusTags: tags,
        bio: ap.bio ?? "",
        skills: [],
        languages: [],
        school: ap.school ?? null,
        careers: (careers ?? []).map(c => ({
          id: c.id,
          year: c.year ?? "",
          category: c.category ?? "",
          title: c.title ?? "",
          role: c.role ?? "",
        })),
        videos: (videoAssets ?? []).map(v => ({
          type: v.type as "file" | "link",
          url: v.url ?? "",
          title: v.name ?? "",
        })),
        videoUrl: null,
        pdfUrl: ap.portfolio_url ?? null,
      })
      setLoadingArtist(false)
    }

    fetchArtist()
  }, [id])

  useEffect(() => {
    if (!isCastingDirector || !id) return
    fetch(`/api/director/bookmarks?artist_profile_id=${id}`)
      .then(r => r.json())
      .then(d => setIsBookmarked(!!d.bookmarked))
      .catch(() => {})
  }, [id, isCastingDirector])

  async function toggleBookmark() {
    if (!isCastingDirector || !artist) return
    setBookmarkLoading(true)
    const method = isBookmarked ? "DELETE" : "POST"
    const res = await fetch("/api/director/bookmarks", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artist_profile_id: id }),
    })
    if (res.ok) setIsBookmarked(!isBookmarked)
    setBookmarkLoading(false)
  }

  if (loadingArtist) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground">아티스트를 찾을 수 없습니다</h2>
          <p className="text-muted-foreground mt-2">요청하신 아티스트 정보가 존재하지 않습니다.</p>
          <Link href="/artists">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록으로 돌아가기
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // 경력 데이터를 카테고리별로 그룹화
  const groupedCareers = artist.careers.reduce((acc, career) => {
    if (!acc[career.category]) {
      acc[career.category] = []
    }
    acc[career.category].push(career)
    return acc
  }, {} as Record<string, CareerItem[]>)

  // 일반 회원에게 보여줄 경력 (최대 3개)
  const limitedCareers = artist.careers.slice(0, 3)

  // 년생 계산
  const birthYear = artist.birthDate 
    ? new Date(artist.birthDate).getFullYear()
    : null

  // 전체 이미지 배열 (메인 + 서브)
  const allImages = [
    ...(artist.profileImage ? [artist.profileImage] : []),
    ...artist.subImages,
  ]

  // 갤러리 이전/다음 이미지
  const handlePrevImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1)
    }
  }

  const handleNextImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex < allImages.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 네비게이션 */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link href="/artists" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            아티스트 목록
          </Link>
          {isCastingDirector && (
            <div className="flex items-center gap-2">
              <button
                onClick={toggleBookmark}
                disabled={bookmarkLoading}
                aria-label={isBookmarked ? "보관함에서 제거" : "보관함에 저장"}
                className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                  isBookmarked
                    ? "bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100"
                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {isBookmarked
                  ? <><BookmarkCheck className="h-4 w-4" />보관함에 저장됨</>
                  : <><Bookmark className="h-4 w-4" />보관함에 저장</>
                }
              </button>
              <button
                onClick={() => setShowProposalModal(true)}
                className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border bg-orange-500 text-white border-orange-500 hover:bg-orange-600 transition-colors"
              >
                캐스팅 제안하기
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* 프로필 헤더 섹션 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="flex flex-col lg:flex-row">
            {/* 좌측: 프로필 이미지 + 서브 사진 갤러리 */}
            <div className="lg:w-96 shrink-0">
              {/* 메인 프로필 이미지 */}
              <div 
                className="aspect-[3/4] relative bg-gray-100 cursor-pointer"
                onClick={() => allImages.length > 0 && setSelectedImageIndex(0)}
              >
                {artist.profileImage ? (
                  <Image
                    src={artist.profileImage}
                    alt={artist.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-50">
                    <User className="h-32 w-32 text-gray-300" />
                  </div>
                )}
              </div>
              
              {/* 서브 사진 갤러리 (메인 이미지 바로 아래 - 항상 표시) */}
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <ImageIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">사진 갤러리</span>
                  <span className="text-xs text-gray-400">
                    ({allImages.length > 0 ? `${allImages.length}장` : '마이페이지에서 추가'})
                  </span>
                </div>
                {allImages.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {allImages.map((img, idx) => (
                      <div 
                        key={idx}
                        className={`aspect-square relative bg-gray-200 rounded-md overflow-hidden cursor-pointer group ${
                          idx === 0 ? 'ring-2 ring-orange-500' : ''
                        }`}
                        onClick={() => setSelectedImageIndex(idx)}
                      >
                        <Image
                          src={img}
                          alt={`${artist.name} 사진 ${idx + 1}`}
                          fill
                          className="object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {/* 빈 서브 이미지 플레이스홀더 */}
                    {[1, 2, 3, 4].map((i) => (
                      <div 
                        key={i}
                        className="aspect-square relative bg-gray-100 rounded-md overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center"
                      >
                        <ImageIcon className="h-6 w-6 text-gray-300" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 우측: 기본 정보 */}
            <div className="flex-1 p-6 lg:p-8">
              {/* 이름 & 태그 */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">{artist.name}</h1>
                {artist.statusTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {artist.statusTags.map((tag) => (
                      <Badge 
                        key={tag} 
                        className="bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* 신체 정보 그리드 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Calendar className="h-5 w-5 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 mb-1">나이</p>
                  <p className="font-semibold text-gray-900">{artist.age}세</p>
                  {birthYear && (
                    <p className="text-xs text-gray-400">{birthYear}년생</p>
                  )}
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Ruler className="h-5 w-5 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 mb-1">키</p>
                  <p className="font-semibold text-gray-900">{artist.height}cm</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Weight className="h-5 w-5 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 mb-1">몸무게</p>
                  <p className="font-semibold text-gray-900">{artist.weight}kg</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <User className="h-5 w-5 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 mb-1">성별</p>
                  <p className="font-semibold text-gray-900">{artist.gender}</p>
                </div>
              </div>

              {/* 자기소개 */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">소개</h3>
                <p className="text-gray-600 leading-relaxed">{artist.bio}</p>
              </div>

              {/* 특기 & 외국어 & 학교 (basic 회원은 일부만 표시) */}
              <div className="space-y-3 relative">
                {artist.skills.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">특기: </span>
                      <span className={`text-sm text-gray-600 ${!canViewRestricted ? 'blur-sm select-none' : ''}`}>
                        {canViewRestricted ? artist.skills.join(", ") : artist.skills.slice(0, 2).join(", ") + " ..."}
                      </span>
                    </div>
                  </div>
                )}
                {artist.languages.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Globe className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">외국어: </span>
                      <span className={`text-sm text-gray-600 ${!canViewRestricted ? 'blur-sm select-none' : ''}`}>
                        {canViewRestricted ? artist.languages.join(", ") : artist.languages.slice(0, 1).join(", ") + " ..."}
                      </span>
                    </div>
                  </div>
                )}
                {artist.school && (
                  <div className="flex items-start gap-3">
                    <GraduationCap className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">학교: </span>
                      <span className={`text-sm text-gray-600 ${!canViewRestricted ? 'blur-sm select-none' : ''}`}>
                        {artist.school}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 관리자 전용: 다운로드 버튼 */}
              {isAdmin && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-semibold text-gray-700">관리자 전용</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {artist.pdfUrl && (
                      <Button variant="outline" size="sm" asChild className="border-orange-200 text-orange-600 hover:bg-orange-50">
                        <a href={artist.pdfUrl} download>
                          <FileText className="h-4 w-4 mr-2" />
                          PDF 프로필
                        </a>
                      </Button>
                    )}
                    {artist.videoUrl && (
                      <Button variant="outline" size="sm" asChild className="border-orange-200 text-orange-600 hover:bg-orange-50">
                        <a href={artist.videoUrl} download>
                          <Download className="h-4 w-4 mr-2" />
                          영상 다운로드
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 경력 섹션 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">경력</h2>
              {!canViewRestricted && artist.careers.length > 3 && (
                <p className="text-xs text-gray-500">일부만 공개됩니다</p>
              )}
            </div>
          </div>

          {artist.careers.length > 0 ? (
            <>
              {canViewRestricted ? (
                // 관리자: 카테고리별 전체 경력 표시
                <div className="space-y-6">
                  {Object.entries(groupedCareers).map(([category, careers]) => (
                    <div key={category}>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        {category}
                      </h3>
                      <div className="bg-gray-50 rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-gray-200">
                              <TableHead className="w-20 text-gray-600">연도</TableHead>
                              <TableHead className="text-gray-600">작품명</TableHead>
                              <TableHead className="text-gray-600">역할</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {careers.map((career) => (
                              <TableRow key={career.id} className="border-gray-200">
                                <TableCell className="font-medium text-gray-900">{career.year}</TableCell>
                                <TableCell className="text-gray-700">{career.title}</TableCell>
                                <TableCell className="text-gray-500">{career.role}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // 일반 회원: 제한된 경력만 표시
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200">
                        <TableHead className="w-20 text-gray-600">연도</TableHead>
                        <TableHead className="w-24 text-gray-600">분야</TableHead>
                        <TableHead className="text-gray-600">작품명</TableHead>
                        <TableHead className="text-gray-600">역할</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {limitedCareers.map((career) => (
                        <TableRow key={career.id} className="border-gray-200">
                          <TableCell className="font-medium text-gray-900">{career.year}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs bg-white">
                              {career.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-700">{career.title}</TableCell>
                          <TableCell className="text-gray-500">{career.role}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {artist.careers.length > 3 && (
                    <div className="relative py-6 bg-gradient-to-t from-gray-100 to-gray-50 rounded-b-lg">
                      <div className="text-center">
                        <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          전체 경력({artist.careers.length}건) 열람 제한
                        </p>
                        <p className="text-xs text-gray-500 mb-3">
                          프리미엄 멤버십 회원 또는 캐스팅 담당자만 열람할 수 있습니다.
                        </p>
                        <Link href="/membership">
                          <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                            <Crown className="h-4 w-4 mr-1" />
                            멤버십 업그레이드
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              등록된 경력이 없습니다
            </div>
          )}
        </div>

        {/* 연기 및 출연 영상 섹션 (react-player로 MP4/유튜브 혼합 지원) */}
        {(artist.videos?.length > 0 || artist.videoUrl) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Video className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">연기 및 출연 영상</h2>
                  <p className="text-xs text-gray-500">
                    {canViewRestricted ? "페이지 내에서 바로 재생됩니다" : "멤버십 회원 전용 콘텐츠입니다"}
                  </p>
                </div>
              </div>
              {isAdmin && (
                <Badge className="bg-orange-100 text-orange-600">관리자 다운로드 가능</Badge>
              )}
            </div>
            
            {/* 영상 그리드 (1열 또는 2열) - basic 회원은 블러 처리 */}
            {canViewRestricted ? (
              <div className={`grid gap-6 ${
                (artist.videos?.length || 0) + (artist.videoUrl && !artist.videos?.length ? 1 : 0) > 1 
                  ? 'lg:grid-cols-2' 
                  : 'grid-cols-1'
              }`}>
                {/* videos 배열 렌더링 */}
                {artist.videos?.map((video, idx) => (
                  <VideoCard 
                    key={`video-${idx}`}
                    video={video}
                    isAdmin={isAdmin}
                  />
                ))}
                
                {/* 레거시 videoUrl (videos 배열이 비어있을 때만) */}
                {artist.videoUrl && (!artist.videos || artist.videos.length === 0) && (
                  <VideoCard 
                    video={{ type: 'file', url: artist.videoUrl, title: '프로필 영상' }}
                    isAdmin={isAdmin}
                  />
                )}
              </div>
            ) : (
              // Basic 회원: 블러 처리 + 업그레이드 안내
              <div className="relative">
                <div className="blur-md pointer-events-none select-none">
                  <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                    <Play className="h-16 w-16 text-gray-400" />
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg">
                  <div className="bg-white rounded-xl p-6 shadow-lg text-center max-w-sm mx-4">
                    <Lock className="h-10 w-10 text-orange-500 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">영상 열람 제한</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      프리미엄 멤버십 회원 또는 캐스팅 담당자만 연기 및 출연 영상을 열람할 수 있습니다.
                    </p>
                    <Link href="/membership">
                      <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                        <Crown className="h-4 w-4 mr-1" />
                        멤버십 업그레이드
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 하단 네비게이션 */}
        <div className="flex justify-center">
          <Link href="/artists">
            <Button variant="outline" size="lg" className="border-gray-300 hover:bg-gray-50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              아티스트 목록으로 돌아가기
            </Button>
          </Link>
        </div>
      </div>

      {/* 이미지 갤러리 모달 (Lightbox) */}
      {selectedImageIndex !== null && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setSelectedImageIndex(null)}
        >
          {/* 닫기 버튼 - 우측 상단 */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setSelectedImageIndex(null)
            }}
            className="absolute top-6 right-6 z-10 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          
          {/* 이전 버튼 - 좌측 */}
          {selectedImageIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handlePrevImage()
              }}
              className="absolute left-6 top-1/2 -translate-y-1/2 z-10 w-14 h-14 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="h-8 w-8 text-white" />
            </button>
          )}
          
          {/* 다음 버튼 - 우측 */}
          {selectedImageIndex < allImages.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleNextImage()
              }}
              className="absolute right-6 top-1/2 -translate-y-1/2 z-10 w-14 h-14 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              <ChevronRight className="h-8 w-8 text-white" />
            </button>
          )}
          
          {/* 메인 이미지 (클릭해도 모달 닫히지 않음) */}
          <div 
            className="relative w-full h-full max-w-5xl max-h-[90vh] mx-auto flex items-center justify-center p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {allImages[selectedImageIndex] && (
              <Image
                src={allImages[selectedImageIndex]}
                alt={`${artist.name} 사진 ${selectedImageIndex + 1}`}
                fill
                className="object-contain"
                priority
              />
            )}
          </div>
          
          {/* 이미지 카운터 - 하단 중앙 */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/60 px-6 py-3 rounded-full">
            <span className="text-white text-sm font-medium">
              {selectedImageIndex + 1} / {allImages.length}
            </span>
          </div>
          
          {/* 썸네일 미리보기 - 하단 */}
          {allImages.length > 1 && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedImageIndex(idx)
                  }}
                  className={`w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${
                    idx === selectedImageIndex 
                      ? 'border-white opacity-100' 
                      : 'border-transparent opacity-50 hover:opacity-80'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`썸네일 ${idx + 1}`}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 캐스팅 제안 모달 */}
      {showProposalModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">캐스팅 제안하기</h3>
              <button onClick={() => setShowProposalModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              <span className="font-semibold text-gray-900">{artist?.name}</span> 님께 캐스팅 제안을 보냅니다.
            </p>
            <textarea
              value={proposalMessage}
              onChange={(e) => setProposalMessage(e.target.value)}
              placeholder="제안 메시지를 입력하세요 (선택사항)"
              rows={4}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowProposalModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSendProposal}
                disabled={sendingProposal}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
              >
                {sendingProposal ? "전송 중..." : "제안 보내기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * 영상 카드 컴포넌트
 * react-player를 사용하여 MP4 파일과 외부 링크(유튜브 등)를 모두 재생
 */
interface VideoCardProps {
  video: VideoItem
  isAdmin: boolean
}

function VideoCard({ video, isAdmin }: VideoCardProps) {
  return (
    <div className="bg-gray-50 rounded-xl overflow-hidden">
      {/* 영상 제목 */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {video.type === 'link' ? (
            <ExternalLink className="h-4 w-4 text-gray-500" />
          ) : (
            <Video className="h-4 w-4 text-gray-500" />
          )}
          <span className="text-sm font-medium text-gray-700">{video.title}</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {video.type === 'link' ? '외부 링크' : 'MP4'}
        </Badge>
      </div>
      
      {/* ReactPlayer */}
      <div className="aspect-video bg-gray-900">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {React.createElement(ReactPlayer as any, {
          url: video.url,
          width: "100%",
          height: "100%",
          controls: true,
          playing: false,
          config: { file: { attributes: { controlsList: isAdmin ? undefined : "nodownload" } } },
        })}
      </div>
      
      {/* 관리자 다운로드 버튼 (MP4 파일인 경우에만) */}
      {isAdmin && video.type === 'file' && (
        <div className="px-4 py-3 border-t border-gray-200">
          <Button variant="outline" size="sm" asChild className="w-full border-orange-200 text-orange-600 hover:bg-orange-50">
            <a href={video.url} download>
              <Download className="h-4 w-4 mr-2" />
              영상 다운로드
            </a>
          </Button>
        </div>
      )}
    </div>
  )
}
