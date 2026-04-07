"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  ArrowLeft, Camera, Upload, X, Plus, Trash2, Star, FileText, Video,
  Link2, Sparkles, Check, ChevronsUpDown, ExternalLink, Crown, Shield,
  Instagram, Youtube, AlertCircle, GraduationCap, Save, Send, Briefcase,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useProfile } from "@/hooks/use-profile"
import { createClient } from "@/lib/supabase/client"

const SCHOOL_LIST = [
  "한국예술종합학교","중앙대학교","동국대학교","성균관대학교","한양대학교",
  "세종대학교","건국대학교","경희대학교","국민대학교","서경대학교",
  "성신여자대학교","홍익대학교","숭실대학교","가천대학교","경기대학교",
  "단국대학교","인천대학교","인하대학교","용인대학교","수원대학교",
  "상명대학교","순천향대학교","계명대학교","청주대학교","전주대학교",
  "서울예술대학교","동아방송예술대학교","정화예술대학교","서일대학교","인덕대학교",
]
const CAREER_CATEGORIES = ["드라마","영화","광고","단편","독립","웹드라마","OTT","숏폼","연극","뮤지컬","뮤직비디오"]
const GRADUATION_STATUS = ["졸업","재학","중퇴","휴학"]

type LocalVideo = {
  id: string
  type: "file" | "link"
  name: string
  url: string
  platform?: string
  size?: string
  file?: File
  isNew?: boolean
}

type LocalPhoto = {
  id: string
  url: string
  name: string
  isMain: boolean
  file?: File
  isNew?: boolean
}

export default function MyPage() {
  const router = useRouter()
  const { user, profile: authProfile, isLoggedIn, loading: authLoading, isPremium } = useAuth()
  const { toast } = useToast()
  const [referralCode, setReferralCode] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/referral/me").then(r => r.json()).then(d => setReferralCode(d.referralCode ?? null))
  }, [])
  const { fullProfile, allTags, loading: profileLoading, uploadMainPhoto, uploadPortfolio, saveProfile } = useProfile()

  const initialized = useRef(false)
  const [isSaving, setIsSaving] = useState(false)
  const [schoolOpen, setSchoolOpen] = useState(false)
  const [videoLinkModal, setVideoLinkModal] = useState(false)
  const [videoLinkUrl, setVideoLinkUrl] = useState("")
  const [errorModal, setErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const [eventApplications, setEventApplications] = useState<{
    id: string
    event_id: string
    applied_at: string | null
    result: string
    events: { title: string; deadline: string | null } | null
  }[]>([])
  const [supportHistoryItems, setSupportHistoryItems] = useState<{
    id: string
    sent_at: string
    agency_name: string
    agency_category: string
  }[]>([])

  // 폼 상태
  const [formData, setFormData] = useState({
    name: "", activityName: "", phone: "", contactEmail: "", gender: "", birthDate: "",
    height: "", weight: "", bio: "", etcInfo: "",
    school: "", isCustomSchool: false, department: "", graduationStatus: "재학",
    instagram: "", youtube: "", tiktok: "",
  })
  const [careerList, setCareerList] = useState<{ id: string; category: string; year: string; title: string; role: string }[]>([])
  const [statusTagIds, setStatusTagIds] = useState<number[]>([])
  const [mainPhoto, setMainPhoto] = useState<LocalPhoto | null>(null)
  const [mainPhotoFile, setMainPhotoFile] = useState<File | null>(null)
  const [subPhotos, setSubPhotos] = useState<LocalPhoto[]>([])
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<string[]>([])
  const [videos, setVideos] = useState<LocalVideo[]>([])
  const [deletedVideoIds, setDeletedVideoIds] = useState<string[]>([])
  const [portfolioFile, setPortfolioFile] = useState<{ name: string; url: string; file?: File } | null>(null)
  const [appTemplate, setAppTemplate] = useState({
    message: "",
    include_pdf: true,
    include_profile_link: true,
    include_videos: false,
  })

  const mainPhotoRef = useRef<HTMLInputElement>(null)
  const subPhotoRef = useRef<HTMLInputElement>(null)
  const portfolioRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  // DB 데이터 → 폼 상태 동기화 (최초 1회만)
  useEffect(() => {
    if (profileLoading || authLoading || !authProfile) return
    if (initialized.current) return
    initialized.current = true
    const { artistProfile, careerItems, photos, videoAssets, socialLinks, statusTagIds: tagIds } = fullProfile

    setFormData({
      name: authProfile?.name ?? "",
      activityName: authProfile?.activity_name ?? "",
      phone: authProfile?.phone ?? "",
      contactEmail: authProfile?.email ?? "",
      gender: artistProfile?.gender ?? "",
      birthDate: artistProfile?.birth_date ?? "",
      height: artistProfile?.height?.toString() ?? "",
      weight: artistProfile?.weight?.toString() ?? "",
      bio: artistProfile?.bio ?? "",
      etcInfo: artistProfile?.etc_info ?? "",
      school: artistProfile?.school ?? "",
      isCustomSchool: artistProfile?.is_custom_school ?? false,
      department: artistProfile?.department ?? "",
      graduationStatus: artistProfile?.graduation_status ?? "재학",
      instagram: socialLinks?.instagram ?? "",
      youtube: socialLinks?.youtube ?? "",
      tiktok: socialLinks?.tiktok ?? "",
    })

    setCareerList(careerItems.map(c => ({
      id: c.id, category: c.category, year: c.year ?? "", title: c.title, role: c.role ?? "",
    })))

    const mainPh = photos.find(p => p.is_main)
    const subPhs = photos.filter(p => !p.is_main)
    setMainPhoto(mainPh ? { id: mainPh.id, url: mainPh.url, name: mainPh.name ?? "", isMain: true } : null)
    setSubPhotos(subPhs.map(p => ({ id: p.id, url: p.url, name: p.name ?? "", isMain: false })))

    setVideos(videoAssets.map(v => ({
      id: v.id, type: v.type as "file"|"link", name: v.name, url: v.url,
      platform: v.platform ?? undefined, size: v.file_size ?? undefined,
    })))

    setStatusTagIds(tagIds)

    if (artistProfile?.portfolio_url) {
      setPortfolioFile({ name: artistProfile.portfolio_file_name ?? "portfolio.pdf", url: artistProfile.portfolio_url })
    }

    // 지원 템플릿 로드
    const supabase = createClient()
    supabase.from("application_templates").select("*").eq("user_id", authProfile.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setAppTemplate({
            message: data.message ?? "",
            include_pdf: data.include_pdf,
            include_profile_link: data.include_profile_link,
            include_videos: data.include_videos,
          })
        }
      })
  }, [fullProfile, authProfile, profileLoading])

  // 로그인 체크
  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.push("/login?redirectTo=/mypage")
  }, [authLoading, isLoggedIn])

  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    supabase
      .from("event_applications")
      .select("id, event_id, applied_at, result, events(title, deadline)")
      .eq("user_id", user.id)
      .order("applied_at", { ascending: false })
      .then(({ data }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setEventApplications((data as any[]) ?? [])
      })
    supabase
      .from("support_history")
      .select("id, sent_at, support_agencies(name, category)")
      .eq("user_id", user.id)
      .order("sent_at", { ascending: false })
      .then(({ data }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items = ((data as any[]) ?? []).map((r: any) => ({
          id: r.id,
          sent_at: r.sent_at,
          agency_name: r.support_agencies?.name ?? "-",
          agency_category: r.support_agencies?.category ?? "-",
        }))
        setSupportHistoryItems(items)
      })
  }, [user])

  const handleMainPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setMainPhotoFile(file)
    setMainPhoto({ id: "new-main", url: URL.createObjectURL(file), name: file.name, isMain: true })
  }

  const handleSubPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    if (subPhotos.filter(p => !deletedPhotoIds.includes(p.id)).length + files.length > 9) {
      setErrorMessage("서브 사진은 최대 9장까지 등록 가능합니다.")
      setErrorModal(true)
      return
    }
    Array.from(files).forEach(file => {
      setSubPhotos(prev => [...prev, {
        id: `new-${Date.now()}-${Math.random()}`, url: URL.createObjectURL(file),
        name: file.name, isMain: false, file, isNew: true,
      }])
    })
  }

  const setAsMainPhoto = (photoId: string) => {
    const photo = subPhotos.find(p => p.id === photoId)
    if (!photo) return
    if (mainPhoto && mainPhoto.id !== "new-main") {
      setSubPhotos(prev => [...prev.filter(p => p.id !== photoId), { ...mainPhoto, isMain: false }])
    } else {
      setSubPhotos(prev => prev.filter(p => p.id !== photoId))
    }
    setMainPhoto({ ...photo, isMain: true })
    if (photo.file) setMainPhotoFile(photo.file)
  }

  const deleteSubPhoto = (photoId: string) => {
    if (!photoId.startsWith("new-")) setDeletedPhotoIds(prev => [...prev, photoId])
    setSubPhotos(prev => prev.filter(p => p.id !== photoId))
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 100 * 1024 * 1024) {
      setErrorMessage("영상 파일은 100MB 이하만 업로드 가능합니다.")
      setErrorModal(true)
      return
    }
    setVideos(prev => [...prev, {
      id: `new-${Date.now()}`, type: "file", name: file.name,
      url: URL.createObjectURL(file), size: `${(file.size / (1024 * 1024)).toFixed(1)}MB`,
      file, isNew: true,
    }])
  }

  const handleAddVideoLink = () => {
    if (!videoLinkUrl.trim()) return
    let platform = "other"
    if (videoLinkUrl.includes("youtube.com") || videoLinkUrl.includes("youtu.be")) platform = "youtube"
    else if (videoLinkUrl.includes("vimeo.com")) platform = "vimeo"
    setVideos(prev => [...prev, {
      id: `new-${Date.now()}`, type: "link",
      name: platform === "youtube" ? "YouTube 영상" : platform === "vimeo" ? "Vimeo 영상" : "외부 영상",
      url: videoLinkUrl, platform, isNew: true,
    }])
    setVideoLinkUrl("")
    setVideoLinkModal(false)
  }

  const deleteVideo = (videoId: string) => {
    if (!videoId.startsWith("new-")) setDeletedVideoIds(prev => [...prev, videoId])
    setVideos(prev => prev.filter(v => v.id !== videoId))
  }

  const handlePortfolioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setPortfolioFile({ name: file.name, url: URL.createObjectURL(file), file })
  }

  const getEmbedUrl = (url: string, platform?: string) => {
    if (platform === "youtube") {
      const id = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1]
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (platform === "vimeo") {
      const id = url.match(/vimeo\.com\/(\d+)/)?.[1]
      return id ? `https://player.vimeo.com/video/${id}` : null
    }
    return null
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // 메인 사진 업로드
      let mainPhotoUrl = mainPhoto?.url ?? null
      if (mainPhotoFile) {
        const uploaded = await uploadMainPhoto(mainPhotoFile)
        if (uploaded) mainPhotoUrl = uploaded
      }

      // 포트폴리오 업로드
      let portfolioUrl = portfolioFile?.url ?? null
      let portfolioFileName = portfolioFile?.name ?? null
      if (portfolioFile?.file) {
        const uploaded = await uploadPortfolio(portfolioFile.file)
        if (uploaded) portfolioUrl = uploaded
      }

      await saveProfile({
        name: formData.name,
        activityName: formData.activityName,
        phone: formData.phone,
        contactEmail: formData.contactEmail,
        gender: formData.gender,
        birthDate: formData.birthDate,
        height: formData.height,
        weight: formData.weight,
        bio: formData.bio,
        etcInfo: formData.etcInfo,
        school: formData.school,
        isCustomSchool: formData.isCustomSchool,
        department: formData.department,
        graduationStatus: formData.graduationStatus,
        portfolioUrl,
        portfolioFileName,
        mainPhotoUrl,
        instagram: formData.instagram,
        youtube: formData.youtube,
        tiktok: formData.tiktok,
        careerList,
        newSubPhotos: subPhotos.filter(p => p.isNew && p.file).map(p => ({ file: p.file!, name: p.name })),
        deletedPhotoIds,
        newVideoLinks: videos.filter(v => v.isNew && v.type === "link").map(v => ({ url: v.url, platform: v.platform ?? "other", name: v.name })),
        newVideoFiles: videos.filter(v => v.isNew && v.type === "file" && v.file).map(v => ({ file: v.file!, name: v.name })),
        deletedVideoIds,
        statusTagIds,
      })

      // 지원 템플릿 저장
      const supabase = createClient()
      await supabase.from("application_templates").upsert({
        user_id: user!.id,
        message: appTemplate.message,
        include_pdf: appTemplate.include_pdf,
        include_profile_link: appTemplate.include_profile_link,
        include_videos: appTemplate.include_videos,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" })

      // 저장 후 상태 초기화
      setMainPhotoFile(null)
      setDeletedPhotoIds([])
      setDeletedVideoIds([])
      setSubPhotos(prev => prev.map(p => ({ ...p, isNew: false, file: undefined })))
      setVideos(prev => prev.map(v => ({ ...v, isNew: false, file: undefined })))
    } catch (err) {
      const msg = err instanceof Error ? err.message : "저장 중 오류가 발생했습니다."
      toast({ title: "저장 실패", description: msg, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const isLoading = authLoading || profileLoading

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-8 w-48" />
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1"><Skeleton className="h-[400px] rounded-lg" /></div>
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-[200px] rounded-lg" />
              <Skeleton className="h-[300px] rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <div className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />홈으로
                </Button>
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-foreground">마이페이지</h1>
                {authProfile?.role === "admin" ? (
                  <Badge className="bg-red-500 text-white gap-1 border-0 hover:bg-red-500"><Shield className="h-3 w-3" />관리자</Badge>
                ) : authProfile?.role === "sub_admin" ? (
                  <Badge className="bg-amber-500 text-white gap-1 border-0 hover:bg-amber-500"><Shield className="h-3 w-3" />서브관리자</Badge>
                ) : authProfile?.role === "casting_director" ? (
                  <Badge className="bg-blue-500 text-white gap-1 border-0 hover:bg-blue-500"><Briefcase className="h-3 w-3" />캐스팅 디렉터</Badge>
                ) : isPremium ? (
                  <Badge className="gold-badge gap-1"><Crown className="h-3 w-3" />멤버십</Badge>
                ) : (
                  <Badge variant="secondary">일반회원</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(authProfile?.role === "admin" || authProfile?.role === "sub_admin") && (
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Shield className="h-4 w-4" />관리자 패널
                  </Button>
                </Link>
              )}
              <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Save className="h-4 w-4" />
                {isSaving ? "저장 중..." : "저장하기"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 온보딩 미완료 안내 배너 */}
      {!profileLoading && !fullProfile.artistProfile && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p className="text-sm font-medium">프로필 정보가 등록되지 않았습니다. 서비스를 이용하려면 프로필을 먼저 등록해주세요.</p>
            </div>
            <Link href="/onboarding">
              <Button size="sm" className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white border-0">
                프로필 등록하기
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* 이벤트 지원 결과 + 프로필 지원 내역 — 상단 고정 */}
      <div className="container mx-auto px-4 pt-8 pb-2">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />이벤트 지원 결과
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventApplications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">지원한 이벤트가 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {eventApplications.map((app) => (
                    <div key={app.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{app.events?.title ?? "이벤트"}</p>
                        <p className="text-xs text-muted-foreground">
                          {app.applied_at ? new Date(app.applied_at).toLocaleDateString("ko-KR") : "-"}
                        </p>
                      </div>
                      <Badge
                        className={
                          app.result === "합격"
                            ? "bg-green-100 text-green-700 border-green-200 shrink-0 ml-2"
                            : app.result === "다음기회에"
                            ? "bg-gray-100 text-gray-600 border-gray-200 shrink-0 ml-2"
                            : "bg-yellow-100 text-yellow-700 border-yellow-200 shrink-0 ml-2"
                        }
                        variant="outline"
                      >
                        {app.result}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" />프로필 지원 내역
              </CardTitle>
            </CardHeader>
            <CardContent>
              {supportHistoryItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">프로필 지원 내역이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {supportHistoryItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.agency_name}</p>
                        <p className="text-xs text-muted-foreground">{item.agency_category}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {new Date(item.sent_at).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 왼쪽: 사진 관리 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 계정 정보 */}
            <Card className="border border-border">
              <CardContent className="pt-5 pb-4 space-y-2">
                <p className="text-xs text-muted-foreground">이름</p>
                <p className="text-sm font-medium text-foreground">{authProfile?.name ?? "-"}</p>
                <div className="h-px bg-border my-1" />
                <p className="text-xs text-muted-foreground">멤버십</p>
                <p className="text-sm font-medium text-foreground">
                  {authProfile?.role === "admin" ? "관리자" : authProfile?.role === "sub_admin" ? "서브 관리자" : authProfile?.role === "casting_director" ? "캐스팅 디렉터" : isPremium ? "멤버십 회원" : "일반 회원"}
                </p>
                {isPremium && (
                  <>
                    <div className="h-px bg-border my-1" />
                    <p className="text-xs text-muted-foreground">내 추천인 코드</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground tracking-widest">{referralCode ?? "-"}</p>
                      {referralCode && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(referralCode)
                            toast({ title: "복사 완료", description: "추천인 코드가 복사되었습니다." })
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          복사
                        </button>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* 메인 프로필 사진 */}
            <Card className="border border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="h-5 w-5 text-primary" />프로필 사진
                </CardTitle>
                <CardDescription>메인 프로필 사진 1장을 등록해주세요</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  onClick={() => mainPhotoRef.current?.click()}
                  className="relative w-full max-w-[160px] mx-auto aspect-[3/4] rounded-lg border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer overflow-hidden group"
                >
                  {mainPhoto ? (
                    <>
                      <img src={mainPhoto.url} alt="메인 프로필" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="h-8 w-8 text-white" />
                      </div>
                      <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
                        <Star className="h-3 w-3 mr-1" />메인
                      </Badge>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                      <Camera className="h-12 w-12 mb-2" />
                      <span className="text-sm">클릭하여 업로드</span>
                    </div>
                  )}
                </div>
                <input ref={mainPhotoRef} type="file" accept="image/*" className="hidden" onChange={handleMainPhotoChange} />
              </CardContent>
            </Card>

            {/* 서브 프로필 사진 */}
            <Card className="border border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">서브 사진</CardTitle>
                <CardDescription>추가 프로필 사진을 등록할 수 있습니다 (최대 9장)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {subPhotos.map(photo => (
                    <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden group">
                      <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        <button onClick={() => setAsMainPhoto(photo.id)} className="p-1.5 bg-white/90 rounded-full hover:bg-white" title="메인으로 설정">
                          <Star className="h-3 w-3 text-primary" />
                        </button>
                        <button onClick={() => deleteSubPhoto(photo.id)} className="p-1.5 bg-white/90 rounded-full hover:bg-white" title="삭제">
                          <X className="h-3 w-3 text-destructive" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {subPhotos.length < 9 && (
                    <button
                      onClick={() => subPhotoRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center text-muted-foreground"
                    >
                      <Plus className="h-6 w-6" />
                    </button>
                  )}
                </div>
                <input ref={subPhotoRef} type="file" accept="image/*" multiple className="hidden" onChange={handleSubPhotoUpload} />
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽: 정보 입력 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 영상 업로드 */}
            <Card className="border border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />영상 업로드
                </CardTitle>
                <CardDescription>MP4 파일 또는 유튜브/비메오 링크를 등록해주세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button variant="outline" className="gap-2" onClick={() => videoRef.current?.click()}>
                    <Upload className="h-4 w-4" />MP4 업로드
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => setVideoLinkModal(true)}>
                    <Link2 className="h-4 w-4" />링크 추가
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">* MP4 파일은 100MB 이하만 업로드 가능합니다.</p>
                <input ref={videoRef} type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" onChange={handleVideoUpload} />
                {videos.length > 0 && (
                  <div className="space-y-2 mt-1">
                    {videos.map(video => (
                      <div key={video.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-muted/20">
                        {video.type === "file"
                          ? <Video className="h-4 w-4 text-primary shrink-0" />
                          : <Link2 className="h-4 w-4 text-primary shrink-0" />}
                        <div className="min-w-0 flex-1">
                          <span className="text-sm truncate block">{video.name}</span>
                          {video.size && <span className="text-xs text-muted-foreground">({video.size})</span>}
                        </div>
                        {video.type === "link" && (
                          <a href={video.url} target="_blank" rel="noopener noreferrer"
                            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-primary transition-colors">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <button onClick={() => deleteVideo(video.id)} className="p-1 hover:bg-muted rounded">
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 프로필 정보 */}
            <Card className="border border-border">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />프로필 정보
                    </CardTitle>
                    <CardDescription>기본 정보를 입력해주세요</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => portfolioRef.current?.click()}>
                    <Upload className="h-4 w-4" />PDF 업로드
                  </Button>
                </div>
                <input ref={portfolioRef} type="file" accept=".pdf" className="hidden" onChange={handlePortfolioChange} />
                {portfolioFile && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-muted/50 rounded-lg">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm">{portfolioFile.name}</span>
                    <button onClick={() => setPortfolioFile(null)} className="ml-auto p-1 hover:bg-muted rounded">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="name">성함 (본명)</Label>
                    <Input id="name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="본명을 입력하세요" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="activityName">활동명</Label>
                    <Input id="activityName" value={formData.activityName} onChange={e => setFormData(p => ({ ...p, activityName: e.target.value }))} placeholder="본명과 동일한 경우 본명으로 기입" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">생년월일</Label>
                    <Input id="birthDate" type="date" value={formData.birthDate} onChange={e => setFormData(p => ({ ...p, birthDate: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>성별</Label>
                    <RadioGroup value={formData.gender} onValueChange={v => setFormData(p => ({ ...p, gender: v }))} className="flex gap-4 pt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="남성" id="male" />
                        <Label htmlFor="male" className="font-normal cursor-pointer">남성</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="여성" id="female" />
                        <Label htmlFor="female" className="font-normal cursor-pointer">여성</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">키 (cm)</Label>
                    <Input id="height" type="number" value={formData.height} onChange={e => setFormData(p => ({ ...p, height: e.target.value }))} placeholder="170" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">몸무게 (kg)</Label>
                    <Input id="weight" type="number" value={formData.weight} onChange={e => setFormData(p => ({ ...p, weight: e.target.value }))} placeholder="60" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">연락처</Label>
                    <div className="relative">
                      <Input
                        id="phone"
                        value={formData.phone}
                        readOnly
                        className="bg-muted/30 pr-24"
                        placeholder="온보딩에서 인증 후 등록됩니다"
                      />
                      {formData.phone && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-green-600 font-medium">
                          <Check className="h-3.5 w-3.5" />인증완료
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>계정 이메일</Label>
                    <Input value={user?.email ?? ""} readOnly className="bg-muted/30" placeholder="계정 이메일" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">지원 이메일</Label>
                    <Input
                      id="contactEmail"
                      value={formData.contactEmail}
                      onChange={e => setFormData(p => ({ ...p, contactEmail: e.target.value }))}
                      type="email"
                      placeholder="에이전시 지원 시 사용할 이메일"
                    />
                  </div>
                </div>

                {/* 활동 분야 */}
                <div className="space-y-3">
                  <Label>활동 분야 (해당 항목 모두 선택)</Label>
                  <div className="flex flex-wrap gap-x-4 gap-y-3">
                    {allTags.map(tag => (
                      <div key={tag.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tag-${tag.id}`}
                          checked={statusTagIds.includes(tag.id)}
                          onCheckedChange={() =>
                            setStatusTagIds(prev => prev.includes(tag.id) ? prev.filter(id => id !== tag.id) : [...prev, tag.id])
                          }
                        />
                        <Label htmlFor={`tag-${tag.id}`} className="font-normal cursor-pointer text-sm">{tag.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SNS 연동 */}
                <div className="space-y-3">
                  <Label>SNS 연동</Label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shrink-0">
                        <Instagram className="h-4 w-4 text-white" />
                      </div>
                      <Input placeholder="인스타그램 URL" value={formData.instagram}
                        onChange={e => setFormData(p => ({ ...p, instagram: e.target.value }))} />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-red-500 shrink-0">
                        <Youtube className="h-4 w-4 text-white" />
                      </div>
                      <Input placeholder="유튜브 URL" value={formData.youtube}
                        onChange={e => setFormData(p => ({ ...p, youtube: e.target.value }))} />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-foreground shrink-0">
                        <svg className="h-4 w-4 text-background" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                        </svg>
                      </div>
                      <Input placeholder="틱톡 URL" value={formData.tiktok}
                        onChange={e => setFormData(p => ({ ...p, tiktok: e.target.value }))} />
                    </div>
                  </div>
                </div>

                {/* 자기소개 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bio">자기소개</Label>
                    <Button variant="ghost" size="sm" className="gap-1 text-primary" onClick={() =>
                      setFormData(p => ({ ...p, bio: `안녕하세요, ${p.name || "배우"}입니다. 다양한 장르의 작품에서 경험을 쌓으며 캐릭터의 감정선을 섬세하게 표현하는 것을 강점으로 삼고 있습니다.` }))}>
                      <Sparkles className="h-3 w-3" />AI 생성
                    </Button>
                  </div>
                  <Textarea id="bio" value={formData.bio} onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))}
                    placeholder="자기소개를 입력하세요" rows={4} />
                </div>

                {/* 기타 정보 */}
                <div className="space-y-2">
                  <Label htmlFor="etcInfo">기타 정보 (특기, 외국어 등)</Label>
                  <Input id="etcInfo" value={formData.etcInfo} onChange={e => setFormData(p => ({ ...p, etcInfo: e.target.value }))}
                    placeholder="특기: 수영, 검도 / 외국어: 영어(일상회화)" />
                </div>
              </CardContent>
            </Card>

            {/* 학력 정보 */}
            <Card className="border border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />학력 정보
                </CardTitle>
                <CardDescription>최종 학력 정보를 입력해주세요</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>학교</Label>
                    {formData.isCustomSchool ? (
                      <div className="flex gap-2">
                        <Input placeholder="학교명을 입력하세요" value={formData.school}
                          onChange={e => setFormData(p => ({ ...p, school: e.target.value }))} />
                        <Button variant="outline" size="icon"
                          onClick={() => setFormData(p => ({ ...p, school: "", isCustomSchool: false }))}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Popover open={schoolOpen} onOpenChange={setSchoolOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                            {formData.school || "학교를 선택하세요"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="학교 검색..." />
                            <CommandList>
                              <CommandEmpty>검색 결과가 없습니다</CommandEmpty>
                              <CommandGroup>
                                {SCHOOL_LIST.map(school => (
                                  <CommandItem key={school} value={school} onSelect={() => {
                                    setFormData(p => ({ ...p, school, isCustomSchool: false }))
                                    setSchoolOpen(false)
                                  }}>
                                    <Check className={`mr-2 h-4 w-4 ${formData.school === school ? "opacity-100" : "opacity-0"}`} />
                                    {school}
                                  </CommandItem>
                                ))}
                                <CommandItem value="기타" onSelect={() => {
                                  setFormData(p => ({ ...p, school: "", isCustomSchool: true }))
                                  setSchoolOpen(false)
                                }}>
                                  <Plus className="mr-2 h-4 w-4" />기타 (직접 입력)
                                </CommandItem>
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">학과</Label>
                    <Input id="department" placeholder="연극영화과" value={formData.department}
                      onChange={e => setFormData(p => ({ ...p, department: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>졸업 여부</Label>
                    <Select value={formData.graduationStatus} onValueChange={v => setFormData(p => ({ ...p, graduationStatus: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {GRADUATION_STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 경력 사항 */}
            <Card className="border border-border">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">경력 사항</CardTitle>
                    <CardDescription>출연 작품 및 경력을 입력해주세요</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() =>
                    setCareerList(prev => [...prev, { id: `new-${Date.now()}`, category: "드라마", year: new Date().getFullYear().toString(), title: "", role: "" }])}>
                    <Plus className="h-4 w-4" />추가
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {careerList.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>등록된 경력이 없습니다</p>
                    <Button variant="link" className="text-primary" onClick={() =>
                      setCareerList(prev => [...prev, { id: `new-${Date.now()}`, category: "드라마", year: new Date().getFullYear().toString(), title: "", role: "" }])}>
                      경력 추가하기
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {careerList.map(career => (
                      <div key={career.id} className="grid gap-2 p-3 rounded-lg bg-muted/30 border border-border sm:grid-cols-12 items-start">
                        <div className="sm:col-span-2">
                          <Label className="text-xs text-muted-foreground mb-1 block">카테고리</Label>
                          <Select value={career.category} onValueChange={v => setCareerList(prev => prev.map(c => c.id === career.id ? { ...c, category: v } : c))}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {CAREER_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="sm:col-span-2">
                          <Label className="text-xs text-muted-foreground mb-1 block">연도</Label>
                          <Input className="h-9" value={career.year}
                            onChange={e => setCareerList(prev => prev.map(c => c.id === career.id ? { ...c, year: e.target.value } : c))}
                            placeholder="2024" />
                        </div>
                        <div className="sm:col-span-4">
                          <Label className="text-xs text-muted-foreground mb-1 block">제목</Label>
                          <Input className="h-9" value={career.title}
                            onChange={e => setCareerList(prev => prev.map(c => c.id === career.id ? { ...c, title: e.target.value } : c))}
                            placeholder="작품명" />
                        </div>
                        <div className="sm:col-span-3">
                          <Label className="text-xs text-muted-foreground mb-1 block">배역</Label>
                          <Input className="h-9" value={career.role}
                            onChange={e => setCareerList(prev => prev.map(c => c.id === career.id ? { ...c, role: e.target.value } : c))}
                            placeholder="주연/조연/단역" />
                        </div>
                        <div className="sm:col-span-1 flex items-end justify-end h-full">
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive"
                            onClick={() => setCareerList(prev => prev.filter(c => c.id !== career.id))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 지원 템플릿 */}
            <Card className="border border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />지원 템플릿
                </CardTitle>
                <CardDescription>프로필 지원 시 발송될 메시지와 포함할 자료를 설정해주세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="appTemplateMessage">지원 메시지</Label>
                  <Textarea
                    id="appTemplateMessage"
                    value={appTemplate.message}
                    onChange={e => setAppTemplate(p => ({ ...p, message: e.target.value }))}
                    placeholder={`안녕하세요.\n\n피플앤아트를 통해 프로필을 지원드립니다.\n\n이름: 홍길동\n연락처: 010-0000-0000\n\n검토 부탁드립니다. 감사합니다.`}
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground">비워두면 기본 메시지가 자동으로 사용됩니다 ({appTemplate.message.length}자)</p>
                </div>
                <div className="space-y-3">
                  <Label>포함할 자료</Label>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Checkbox id="includePdf" checked={appTemplate.include_pdf}
                        onCheckedChange={v => setAppTemplate(p => ({ ...p, include_pdf: !!v }))} />
                      <Label htmlFor="includePdf" className="font-normal cursor-pointer text-sm">PDF 포트폴리오 링크</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="includeProfileLink" checked={appTemplate.include_profile_link}
                        onCheckedChange={v => setAppTemplate(p => ({ ...p, include_profile_link: !!v }))} />
                      <Label htmlFor="includeProfileLink" className="font-normal cursor-pointer text-sm">프로필 페이지 링크</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="includeVideos" checked={appTemplate.include_videos}
                        onCheckedChange={v => setAppTemplate(p => ({ ...p, include_videos: !!v }))} />
                      <Label htmlFor="includeVideos" className="font-normal cursor-pointer text-sm">영상 링크</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>


      {/* 영상 링크 모달 */}
      <Dialog open={videoLinkModal} onOpenChange={setVideoLinkModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>영상 링크 추가</DialogTitle>
            <DialogDescription>유튜브, 비메오 등 외부 영상 링크를 입력해주세요</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="videoUrl">영상 URL</Label>
              <Input id="videoUrl" value={videoLinkUrl} onChange={e => setVideoLinkUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..." />
            </div>
            <p className="text-xs text-muted-foreground">* 유튜브, 비메오 링크는 자동으로 임베드 재생됩니다</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVideoLinkModal(false)}>취소</Button>
            <Button onClick={handleAddVideoLink} className="bg-primary text-primary-foreground">추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 에러 모달 */}
      <Dialog open={errorModal} onOpenChange={setErrorModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />업로드 오류
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          <DialogFooter><Button onClick={() => setErrorModal(false)}>확인</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
