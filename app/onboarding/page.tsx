"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useUser } from "@/contexts/user-context"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  User,
  Loader2,
  X,
  Edit3,
  Wand2,
} from "lucide-react"

import { AlertCircle } from "lucide-react"

// 스켈레톤 컴포넌트
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-muted rounded ${className}`} />
  )
}

// 추출 데이터 타입 정의
interface ExtractedCareerItem {
  year: string // 년도만 또는 YYYY-MM-DD
  channel: string // 편성채널 (KBS, MBC, tvN, 디즈니+, 티빙 등)
  title: string // 작품 제목
  role: string // 배역 ('역' 키워드 포함)
  confidence: "high" | "medium" | "low" | "uncertain" // 신뢰도
}

interface ExtractedData {
  name: string | null
  nameConfidence: "high" | "medium" | "low" | "uncertain"
  birthYear: string | null // 년도만 추출 가능한 경우
  birthDate: string | null // 전체 날짜가 있는 경우
  birthDateConfidence: "high" | "medium" | "low" | "uncertain"
  height: string | null
  heightConfidence: "high" | "medium" | "low" | "uncertain"
  weight: string | null
  weightConfidence: "high" | "medium" | "low" | "uncertain"
  careerList: ExtractedCareerItem[]
  etcInfo: string | null
}

// 날짜 정제 함수 - 01.01 강제 삽입 방지
const refineDateData = (rawDate: string | null, rawYear: string | null): { value: string; isYearOnly: boolean } => {
  if (!rawDate && !rawYear) {
    console.log("[v0] 날짜 데이터 없음: date와 year 모두 null")
    return { value: "", isYearOnly: false }
  }

  // 강제 01.01 삽입 감지 및 방지
  if (rawDate && rawDate.includes("-01-01")) {
    console.log("[v0] 01.01 강제 삽입 감지됨, 년도만 사용:", rawDate.split("-")[0])
    return { value: rawDate.split("-")[0], isYearOnly: true }
  }

  // 년도만 있는 경우
  if (rawYear && !rawDate) {
    console.log("[v0] 년도만 추출됨:", rawYear)
    return { value: rawYear, isYearOnly: true }
  }

  // 전체 날짜가 있는 경우
  if (rawDate) {
    // YYYY 형식만 있는지 확인
    if (/^\d{4}$/.test(rawDate)) {
      console.log("[v0] YYYY 형식만 감지:", rawDate)
      return { value: rawDate, isYearOnly: true }
    }
    console.log("[v0] 전체 날짜 추출됨:", rawDate)
    return { value: rawDate, isYearOnly: false }
  }

  return { value: "", isYearOnly: false }
}

// Vision 기반 PDF 분석 시뮬레이션 (GPT-4o Vision API 호출 구조)
const analyzeWithVision = async (file: File): Promise<ExtractedData> => {
  // 실제 구현 시: PDF를 이미지로 변환 후 GPT-4o Vision API 호출
  // const pdfImages = await convertPDFToImages(file)
  // const response = await openai.chat.completions.create({
  //   model: "gpt-4o",
  //   messages: [{
  //     role: "user",
  //     content: [
  //       { type: "text", text: "다음 프로필 이미지에서 정보를 추출해주세요. 테이블은 [년도, 편성채널, 제목, 배역] 순서로 인식하세요. 확실하지 않은 데이터는 'uncertain'으로 표시하세요." },
  //       ...pdfImages.map(img => ({ type: "image_url", image_url: { url: img } }))
  //     ]
  //   }]
  // })

  await new Promise((resolve) => setTimeout(resolve, 3000))

  // 시뮬레이션 데이터 - Vision 기반 테이블 인식 결과
  const simulatedResult: ExtractedData = {
    name: "김민수",
    nameConfidence: "high",
    birthYear: "1998",
    birthDate: null, // 년도만 추출된 경우
    birthDateConfidence: "medium",
    height: "178",
    heightConfidence: "high",
    weight: "68",
    weightConfidence: "high",
    careerList: [
      { year: "2025", channel: "tvN", title: "사랑의 불시착 시즌2", role: "박서준 역", confidence: "high" },
      { year: "2024", channel: "CGV", title: "어느 날", role: "주인공 역", confidence: "high" },
      { year: "2023", channel: "", title: "레미제라블", role: "앙상블", confidence: "medium" },
      { year: "2022", channel: "독립", title: "첫 눈", role: "민수 역", confidence: "low" },
    ],
    etcInfo: "특기: 현대무용, 재즈댄스 / 외국어: 영어(비즈니스)",
  }

  // 디버깅: 추출된 데이터 로그
  console.log("[v0] Vision 분석 완료 - 추출 데이터:", JSON.stringify(simulatedResult, null, 2))

  return simulatedResult
}

// 경력 데이터 포맷팅 (테이블 매핑 규칙 적용)
const formatCareerData = (careerList: ExtractedCareerItem[]): {
  formatted: { year: string; channel: string; title: string; role: string; isUncertain: boolean }[]
} => {
  return {
    formatted: careerList.map((item) => {
      const isUncertain = item.confidence === "uncertain" || item.confidence === "low"
      
      if (isUncertain) {
        console.log("[v0] 불확실한 경력 데이터 감지:", item)
      }

      return {
        year: item.year || "",
        channel: item.channel || "",
        title: item.title || "",
        role: item.role || "",
        isUncertain,
      }
    })
  }
}

// AI 자기소개 생성 시뮬레이션
const simulateAIBioGeneration = async (career: { year: string; channel: string; title: string; role: string }[]): Promise<string> => {
  await new Promise((resolve) => setTimeout(resolve, 2000))
  const validCareers = career.filter(c => c.title.trim() !== "")
  const latestYear = validCareers[0]?.year || "2024"
  const workTypes = new Set(validCareers.map(c => c.channel).filter(Boolean))
  const genreText = workTypes.size > 0 ? Array.from(workTypes).join(", ") : "다양한 작품"
  
  return `진정성 있는 연기로 관객의 마음을 움직이는 배우입니다. ${latestYear}년부터 ${genreText} 등에서 활동하며 폭넓은 연기력을 쌓아왔습니다. 특히 캐릭터의 감정선을 섬세하게 표현하는 것을 강점으로, 매 작품마다 새로운 모습을 보여드리기 위해 노력하고 있습니다. 앞으로도 관객 여러분께 깊은 인상을 남기는 배우가 되겠습니다.`
}

export default function OnboardingPage() {
  const router = useRouter()
  const { updateProfile, login } = useUser()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 스텝 관리
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3

  // 추천인 코드
  const [referralCode, setReferralCode] = useState("")

  // 파일 업로드 상태
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionProgress, setExtractionProgress] = useState(0)

  // 추출된 데이터
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    birthDate: "",
    birthYear: "", // 년도만 있는 경우
    isBirthYearOnly: false, // 년도만 입력 모드
    gender: "",
    height: "",
    weight: "",
    bio: "",
    etcInfo: "",
    career: [] as { year: string; channel: string; title: string; role: string; isUncertain: boolean }[],
  })

  // 불확실 데이터 필드 추적
  const [uncertainFields, setUncertainFields] = useState<string[]>([])

  // AI 자기소개 생성 상태
  const [isGeneratingBio, setIsGeneratingBio] = useState(false)

  // 드래그 앤 드롭
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type === "application/pdf") {
      handleFileUpload(file)
    } else {
      toast({
        title: "지원하지 않는 파일 형식",
        description: "PDF 파일만 업로드 가능합니다.",
        variant: "destructive",
      })
    }
  }, [])

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file)
    setIsExtracting(true)
    setExtractionProgress(0)
    setUncertainFields([])

    // 진행률 시뮬레이션
    const progressInterval = setInterval(() => {
      setExtractionProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + 10
      })
    }, 250)

    try {
      // Vision 기반 PDF 분석 실행
      const extractedData = await analyzeWithVision(file)
      clearInterval(progressInterval)
      setExtractionProgress(100)

      // 날짜 데이터 정제 (01.01 강제 삽입 방지)
      const refinedBirthDate = refineDateData(extractedData.birthDate, extractedData.birthYear)
      console.log("[v0] 정제된 생년월일:", refinedBirthDate)

      // 불확실 필드 추적
      const newUncertainFields: string[] = []
      if (extractedData.nameConfidence === "uncertain" || extractedData.nameConfidence === "low") {
        newUncertainFields.push("name")
      }
      if (extractedData.birthDateConfidence === "uncertain" || extractedData.birthDateConfidence === "low") {
        newUncertainFields.push("birthDate")
      }
      if (extractedData.heightConfidence === "uncertain" || extractedData.heightConfidence === "low") {
        newUncertainFields.push("height")
      }
      if (extractedData.weightConfidence === "uncertain" || extractedData.weightConfidence === "low") {
        newUncertainFields.push("weight")
      }
      setUncertainFields(newUncertainFields)

      // 경력 데이터 포맷팅 (테이블 매핑 규칙 적용)
      const { formatted: formattedCareer } = formatCareerData(extractedData.careerList)

      setFormData((prev) => ({
        ...prev,
        name: extractedData.name || "",
        birthDate: refinedBirthDate.isYearOnly ? "" : refinedBirthDate.value,
        birthYear: refinedBirthDate.isYearOnly ? refinedBirthDate.value : "",
        isBirthYearOnly: refinedBirthDate.isYearOnly,
        height: extractedData.height || "",
        weight: extractedData.weight || "",
        etcInfo: extractedData.etcInfo || "",
        career: formattedCareer,
      }))

      // 불확실 데이터가 있으면 안내
      const hasUncertainData = newUncertainFields.length > 0 || formattedCareer.some(c => c.isUncertain)
      
      toast({
        title: "AI 분석 완료",
        description: hasUncertainData 
          ? "일부 데이터의 신뢰도가 낮습니다. 노란색 표시 필드를 확인해주세요."
          : "프로필 정보가 자동으로 입력되었습니다. 수정이 필요하면 직접 편집하세요.",
        variant: hasUncertainData ? "default" : "default",
      })

      setTimeout(() => {
        setIsExtracting(false)
        setCurrentStep(2)
      }, 500)
    } catch (error) {
      console.log("[v0] PDF 분석 오류:", error)
      clearInterval(progressInterval)
      setIsExtracting(false)
      toast({
        title: "분석 실패",
        description: "파일 분석 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      })
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleGenerateBio = async () => {
    const validCareers = formData.career.filter(c => c.title.trim() !== "")
    if (validCareers.length === 0) {
      toast({
        title: "경력 정보 필요",
        description: "자기소개 생성을 위해 경력 정보가 필요합니다.",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingBio(true)
    try {
      const generatedBio = await simulateAIBioGeneration(validCareers)
      setFormData((prev) => ({ ...prev, bio: generatedBio }))
      toast({
        title: "AI 자기소개 생성 완료",
        description: "생성된 자기소개를 확인하고 필요시 수정해주세요.",
      })
    } catch {
      toast({
        title: "생성 실패",
        description: "자기소개 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingBio(false)
    }
  }

  const handleAddCareer = () => {
    setFormData((prev) => ({
      ...prev,
      career: [...prev.career, { year: "", channel: "", title: "", role: "", isUncertain: false }],
    }))
  }

  const handleUpdateCareer = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      career: prev.career.map((c, i) => 
        i === index ? { ...c, [field]: value, isUncertain: false } : c
      ),
    }))
  }

  const handleRemoveCareer = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      career: prev.career.filter((_, i) => i !== index),
    }))
  }

  // 폼 리셋
  const resetFormData = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      birthDate: "",
      birthYear: "",
      isBirthYearOnly: false,
      gender: "",
      height: "",
      weight: "",
      bio: "",
      etcInfo: "",
      career: [],
    })
    setUncertainFields([])
  }

  const handleComplete = async () => {
    // 경력 데이터를 careerList 형식으로 변환
    const careerList = formData.career
      .filter(c => c.title.trim() !== "")
      .map((c, idx) => ({
        id: `onboarding-${idx}`,
        category: detectCategory(c.channel) as "드라마" | "영화" | "광고" | "OTT" | "숏폼" | "단편" | "독립" | "웹드라마" | "연극" | "뮤지컬" | "뮤직비디오",
        year: c.year,
        title: c.channel ? `${c.title} (${c.channel})` : c.title,
        role: c.role,
      }))

    // DB 저장
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          birthDate: formData.isBirthYearOnly ? `${formData.birthYear}-01-01` : formData.birthDate,
          gender: formData.gender,
          height: formData.height,
          weight: formData.weight,
          bio: formData.bio,
          etcInfo: formData.etcInfo,
          careerList,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast({ title: "저장 실패", description: err.error ?? "잠시 후 다시 시도해주세요.", variant: "destructive" })
        return
      }
    } catch {
      toast({ title: "저장 실패", description: "네트워크 오류가 발생했습니다.", variant: "destructive" })
      return
    }

    // UserContext 업데이트 (UI 즉시 반영용)
    updateProfile({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      birthDate: formData.isBirthYearOnly ? `${formData.birthYear}-01-01` : formData.birthDate,
      gender: formData.gender,
      height: formData.height,
      weight: formData.weight,
      bio: formData.bio,
      etcInfo: formData.etcInfo,
      careerList,
      portfolioFile: uploadedFile ? URL.createObjectURL(uploadedFile) : null,
      portfolioFileName: uploadedFile?.name || null,
    })
    // 추천인 코드 적용 (입력한 경우)
    if (referralCode.trim()) {
      try {
        const refRes = await fetch("/api/referral/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ referralCode: referralCode.trim() }),
        })
        const refData = await refRes.json()
        if (refRes.ok) {
          toast({
            title: "추천인 코드 적용 완료",
            description: `추천인과 함께 각각 10,000P가 지급되었습니다!`,
          })
        } else {
          toast({
            title: "추천인 코드 오류",
            description: refData.error ?? "추천인 코드를 확인해 주세요.",
            variant: "destructive",
          })
        }
      } catch {
        // 추천인 오류는 가입 완료를 막지 않음
      }
    }

    login(false)
    toast({
      title: "회원가입 완료",
      description: "피플앤아트에 오신 것을 환영합니다!",
    })
    router.push("/mypage")
  }

  // 채널명에서 카테고리 추론
  const detectCategory = (channel: string): string => {
    const ch = channel.toLowerCase()
    if (ch.includes("kbs") || ch.includes("mbc") || ch.includes("sbs") || ch.includes("tvn") || ch.includes("jtbc")) {
      return "드라마"
    }
    if (ch.includes("cgv") || ch.includes("롯데") || ch.includes("메가박스") || ch.includes("영화")) {
      return "영화"
    }
    if (ch.includes("넷플릭스") || ch.includes("티빙") || ch.includes("웨이브") || ch.includes("왓챠") || ch.includes("디즈니")) {
      return "OTT"
    }
    if (ch.includes("광고") || ch.includes("cf")) {
      return "광고"
    }
    if (ch.includes("독립")) {
      return "독립"
    }
    if (ch.includes("뮤지컬")) {
      return "뮤지컬"
    }
    if (ch.includes("연극")) {
      return "연극"
    }
    return "드라마"
  }

  const canProceedToStep2 = uploadedFile && !isExtracting
  const canProceedToStep3 = formData.name && formData.email && formData.phone
  const canComplete = canProceedToStep3 && formData.bio

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo-pa-002.png"
              alt="피플앤아트"
              width={120}
              height={40}
              className="h-10 w-auto object-contain"
            />
          </Link>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-card border-b border-border">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">AI 프로필 분석 가입</span>
            <span className="text-sm text-muted-foreground">{currentStep} / {totalSteps}</span>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
          <div className="flex justify-between mt-2">
            {["PDF 업로드", "정보 확인", "자기소개"].map((label, index) => (
              <div
                key={label}
                className={`flex items-center gap-1.5 text-xs ${
                  currentStep > index + 1
                    ? "text-primary"
                    : currentStep === index + 1
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {currentStep > index + 1 ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <div
                    className={`h-4 w-4 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                      currentStep === index + 1
                        ? "border-primary text-primary"
                        : "border-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>
                )}
                <span className="hidden sm:inline">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-4 py-8 lg:py-12">
        <div className="mx-auto max-w-2xl">
          {/* Step 1: PDF Upload */}
          {currentStep === 1 && (
            <Card className="border-border animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">AI 프로필 분석</CardTitle>
                <CardDescription className="text-base">
                  기존 프로필 PDF를 업로드하면 AI가 자동으로 정보를 추출합니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Upload Area */}
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${
                    isDragging
                      ? "border-primary bg-primary/5"
                      : uploadedFile
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {isExtracting ? (
                    <div className="text-center space-y-4">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground mb-1">AI가 프로필을 분석 중입니다</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          이름, 생년월일, 키, 몸무게, 경력 정보를 추출하고 있습니다...
                        </p>
                      </div>
                      <Progress value={extractionProgress} className="h-2 max-w-xs mx-auto" />
                      <p className="text-xs text-muted-foreground">{extractionProgress}% 완료</p>
                    </div>
                  ) : uploadedFile ? (
                    <div className="text-center space-y-4">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <CheckCircle2 className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{uploadedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setUploadedFile(null)
                          resetFormData()
                        }}
                      >
                        다른 파일 선택
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground mb-1">PDF 프로필을 드래그하거나 클릭하여 업로드</p>
                        <p className="text-sm text-muted-foreground">
                          최대 10MB, PDF 형식만 지원
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        파일 선택
                      </Button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                </div>

                {/* 추천인 코드 입력 */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <Label htmlFor="referralCode" className="text-sm font-medium">
                    추천인 ID <span className="text-muted-foreground font-normal">(선택)</span>
                  </Label>
                  <Input
                    id="referralCode"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="추천인 ID 입력 (8자리)"
                    maxLength={8}
                    className="font-mono tracking-widest"
                  />
                  <p className="text-xs text-muted-foreground">
                    추천인 ID를 입력하면 가입 완료 후 추천인과 함께 각각 10,000P가 지급됩니다.
                  </p>
                </div>

                {/* Skip Option */}
                <div className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentStep(2)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    PDF 없이 직접 입력하기
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Profile Info */}
          {currentStep === 2 && (
            <Card className="border-border animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  기본 정보 확인
                </CardTitle>
                <CardDescription>
                  AI가 추출한 정보를 확인하고 필요시 수정해주세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 불확실 데이터 경고 */}
                {uncertainFields.length > 0 && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                    <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">일부 데이터의 신뢰도가 낮습니다</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        노란색 테두리로 표시된 필드를 확인하고 수정해주세요.
                      </p>
                    </div>
                  </div>
                )}

                {/* Basic Info Grid */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      이름 <span className="text-destructive">*</span>
                      {uncertainFields.includes("name") && (
                        <Badge variant="outline" className="ml-2 text-xs border-yellow-500 text-yellow-600 bg-yellow-50">
                          확인 필요
                        </Badge>
                      )}
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                        setUncertainFields(prev => prev.filter(f => f !== "name"))
                      }}
                      placeholder="홍길동"
                      className={uncertainFields.includes("name") ? "border-yellow-500 bg-yellow-50" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">
                      생년월일
                      {formData.isBirthYearOnly && (
                        <Badge variant="outline" className="ml-2 text-xs border-blue-500 text-blue-600 bg-blue-50">
                          년도만 추출됨
                        </Badge>
                      )}
                    </Label>
                    {formData.isBirthYearOnly ? (
                      <div className="flex gap-2">
                        <Input
                          id="birthYear"
                          type="text"
                          value={formData.birthYear}
                          onChange={(e) => setFormData((prev) => ({ ...prev, birthYear: e.target.value }))}
                          placeholder="1995"
                          className="w-24"
                          maxLength={4}
                        />
                        <span className="flex items-center text-sm text-muted-foreground">년</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, isBirthYearOnly: false, birthDate: prev.birthYear ? `${prev.birthYear}-01-01` : "" }))}
                          className="text-xs"
                        >
                          전체 날짜 입력
                        </Button>
                      </div>
                    ) : (
                      <Input
                        id="birthDate"
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => setFormData((prev) => ({ ...prev, birthDate: e.target.value }))}
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      휴대폰 번호 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="010-1234-5678"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      이메일 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="example@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">성별</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, gender: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="남성">남성</SelectItem>
                        <SelectItem value="여성">여성</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">
                      키 (cm)
                      {uncertainFields.includes("height") && (
                        <Badge variant="outline" className="ml-2 text-xs border-yellow-500 text-yellow-600 bg-yellow-50">
                          확인 필요
                        </Badge>
                      )}
                    </Label>
                    <Input
                      id="height"
                      value={formData.height}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, height: e.target.value }))
                        setUncertainFields(prev => prev.filter(f => f !== "height"))
                      }}
                      placeholder="175"
                      className={uncertainFields.includes("height") ? "border-yellow-500 bg-yellow-50" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">
                      몸무게 (kg)
                      {uncertainFields.includes("weight") && (
                        <Badge variant="outline" className="ml-2 text-xs border-yellow-500 text-yellow-600 bg-yellow-50">
                          확인 필요
                        </Badge>
                      )}
                    </Label>
                    <Input
                      id="weight"
                      value={formData.weight}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, weight: e.target.value }))
                        setUncertainFields(prev => prev.filter(f => f !== "weight"))
                      }}
                      placeholder="70"
                      className={uncertainFields.includes("weight") ? "border-yellow-500 bg-yellow-50" : ""}
                    />
                  </div>
                </div>

                {/* Career Section - 테이블 형식 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>
                      주요 경력
                      <span className="text-xs text-muted-foreground ml-2">(년도 / 편성채널 / 제목 / 배역)</span>
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAddCareer}
                      className="text-primary hover:text-primary"
                    >
                      + 경력 추가
                    </Button>
                  </div>
                  {formData.career.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-border rounded-lg">
                      <p className="text-sm text-muted-foreground">등록된 경력이 없습니다</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleAddCareer}
                        className="mt-2 text-primary"
                      >
                        첫 경력 추가하기
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.career.map((career, index) => (
                        <div 
                          key={index} 
                          className={`p-3 rounded-lg border ${career.isUncertain ? "border-yellow-500 bg-yellow-50" : "border-border"}`}
                        >
                          {career.isUncertain && (
                            <div className="flex items-center gap-2 mb-2 text-xs text-yellow-600">
                              <AlertCircle className="h-3 w-3" />
                              <span>데이터 불분명 - 확인 필요</span>
                            </div>
                          )}
                          <div className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-2">
                              <Input
                                value={career.year}
                                onChange={(e) => handleUpdateCareer(index, "year", e.target.value)}
                                placeholder="년도"
                                className="text-center text-sm"
                                maxLength={4}
                              />
                            </div>
                            <div className="col-span-2">
                              <Input
                                value={career.channel}
                                onChange={(e) => handleUpdateCareer(index, "channel", e.target.value)}
                                placeholder="채널"
                                className="text-sm"
                              />
                            </div>
                            <div className="col-span-4">
                              <Input
                                value={career.title}
                                onChange={(e) => handleUpdateCareer(index, "title", e.target.value)}
                                placeholder="작품 제목"
                                className="text-sm"
                              />
                            </div>
                            <div className="col-span-3">
                              <Input
                                value={career.role}
                                onChange={(e) => handleUpdateCareer(index, "role", e.target.value)}
                                placeholder="배역"
                                className="text-sm"
                              />
                            </div>
                            <div className="col-span-1 flex justify-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveCareer(index)}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 기타 정보 */}
                <div className="space-y-2">
                  <Label htmlFor="etcInfo">기타 정보 (특기, 외국어 등)</Label>
                  <Input
                    id="etcInfo"
                    value={formData.etcInfo}
                    onChange={(e) => setFormData((prev) => ({ ...prev, etcInfo: e.target.value }))}
                    placeholder="특기: 검도, 수영 / 외국어: 영어(일상회화)"
                  />
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-4 border-t border-border">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    이전
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(3)}
                    disabled={!canProceedToStep3}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    다음
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Bio Generation */}
          {currentStep === 3 && (
            <Card className="border-border animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-primary" />
                  AI 자기소개 생성
                </CardTitle>
                <CardDescription>
                  경력을 바탕으로 AI가 전문적인 자기소개를 작성해드립니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* AI Generate Button */}
                <div className="text-center p-6 rounded-lg bg-primary/5 border border-primary/20">
                  <Sparkles className="h-10 w-10 mx-auto text-primary mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    버튼을 클릭하면 입력하신 경력을 바탕으로<br />
                    톤앤매너가 좋은 자기소개가 자동 생성됩니다
                  </p>
                  <Button
                    onClick={handleGenerateBio}
                    disabled={isGeneratingBio || formData.career.filter(c => c.title.trim() !== "").length === 0}
                    className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isGeneratingBio ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        생성 중...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        AI 자기소개 생성
                      </>
                    )}
                  </Button>
                </div>

                {/* Bio Textarea */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bio">자기소개</Label>
                    {formData.bio && (
                      <Badge variant="outline" className="text-xs">
                        <Edit3 className="h-3 w-3 mr-1" />
                        직접 수정 가능
                      </Badge>
                    )}
                  </div>
                  {isGeneratingBio ? (
                    <div className="space-y-2 p-4 rounded-lg border border-border">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-11/12" />
                      <Skeleton className="h-4 w-10/12" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-9/12" />
                    </div>
                  ) : (
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                      placeholder="자기소개를 입력하거나 AI 생성 버튼을 눌러주세요..."
                      className="min-h-[160px] resize-none"
                    />
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formData.bio.length} / 500자
                  </p>
                </div>

                {/* Career Summary */}
                {formData.career.length > 0 && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium text-foreground mb-2">참고된 경력</p>
                    <ul className="space-y-1">
                      {formData.career.filter(c => c.title.trim()).map((career, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {career.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between pt-4 border-t border-border">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    이전
                  </Button>
                  <Button
                    onClick={handleComplete}
                    disabled={!canComplete}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    가입 완료
                    <CheckCircle2 className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Toaster />
    </div>
  )
}
