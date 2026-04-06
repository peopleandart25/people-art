"use client"

import { useState, useEffect, useCallback, memo } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { Search, X, Filter, User, ChevronDown, ChevronUp, RotateCcw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  useArtistsSafe,
  genderOptions,
  schoolOptions,
  AGE_MIN,
  AGE_MAX,
  HEIGHT_MIN,
  HEIGHT_MAX,
  WEIGHT_MIN,
  WEIGHT_MAX,
  StatusTag,
} from "@/contexts/artist-context"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

// 올해 년도 (나이 ↔ 출생년도 변환용)
const CURRENT_YEAR = new Date().getFullYear()

// =============================================================================
// 외부 분리 컴포넌트 (리렌더링 시 언마운트 방지)
// =============================================================================

/**
 * 커스텀 Range Slider 컴포넌트 (SliderPrimitive 직접 사용)
 * 
 * 중요: ArtistsPage 외부에 선언하여 리렌더링 시 언마운트되지 않도록 함
 * 
 * 특징:
 * - SliderPrimitive.Track 클릭 시 가장 가까운 Thumb이 즉시 이동
 * - 선택 구간(Range): 주황색(bg-orange-500)
 * - touch-none으로 브라우저 스크롤 충돌 방지
 * - transition 제거하여 드래그 충돌 방지
 */
interface RangeSliderFilterProps {
  label: string
  value: [number, number]
  onChange: (value: [number, number]) => void
  min: number
  max: number
  unit: string
}

const RangeSliderFilter = memo(function RangeSliderFilter({
  label,
  value,
  onChange,
  min,
  max,
  unit,
}: RangeSliderFilterProps) {
  return (
    <div className="space-y-3">
      {/* 라벨 + 현재 선택 범위 실시간 표시 */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-foreground">{label}</Label>
        <span className="text-sm font-medium text-orange-500">
          {value[0]}{unit} - {value[1]}{unit}
        </span>
      </div>
      
      {/* 커스텀 Radix Slider */}
      <SliderPrimitive.Root
        value={value}
        onValueChange={(v) => onChange(v as [number, number])}
        min={min}
        max={max}
        step={1}
        className="relative flex w-full items-center select-none touch-none py-2"
      >
        {/* Track: 클릭 시 가장 가까운 Thumb 이동 */}
        <SliderPrimitive.Track className="bg-gray-200 relative grow overflow-hidden rounded-full cursor-pointer h-2 w-full">
          {/* Range: 선택된 구간 (주황색) */}
          <SliderPrimitive.Range className="bg-orange-500 absolute h-full" />
        </SliderPrimitive.Track>
        
        {/* Thumb 1: 시작값 (transition 제거) */}
        <SliderPrimitive.Thumb className="block size-5 rounded-full border-2 border-orange-500 bg-white shadow-md cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2" />
        
        {/* Thumb 2: 종료값 (transition 제거) */}
        <SliderPrimitive.Thumb className="block size-5 rounded-full border-2 border-orange-500 bg-white shadow-md cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2" />
      </SliderPrimitive.Root>
      
      {/* 최소/최대 범위 표시 */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )
})

/**
 * 나이 슬라이더 (양방향 출생년도 동기화)
 * 
 * 중요: ArtistsPage 외부에 선언하여 리렌더링 시 언마운트되지 않도록 함
 * 내부에서 useArtistsSafe() 직접 호출
 * 
 * 특징:
 * - 나이(세) ↔ 출생년도 양방향 실시간 동기화
 * - 슬라이더 조작 → 년도 입력칸 자동 업데이트
 * - 년도 입력칸 수정 → 슬라이더 자동 이동
 */
const AgeRangeSliderWithYearSync = memo(function AgeRangeSliderWithYearSync() {
  const { ageRange, setAgeRange } = useArtistsSafe()

  // 나이 → 출생년도 변환 (예: 20세 → 2006년)
  const ageToYear = useCallback((age: number) => CURRENT_YEAR - age, [])
  // 출생년도 → 나이 변환 (예: 2006년 → 20세)
  const yearToAge = useCallback((year: number) => CURRENT_YEAR - year, [])

  // 년도 입력칸 로컬 상태 (ageRange와 양방향 동기화)
  const [startYear, setStartYear] = useState<string>(String(ageToYear(ageRange[1])))
  const [endYear, setEndYear] = useState<string>(String(ageToYear(ageRange[0])))

  // ageRange 변경 시 → 년도 입력칸 업데이트
  useEffect(() => {
    setStartYear(String(ageToYear(ageRange[1]))) // 최대 나이 = 최소 년도
    setEndYear(String(ageToYear(ageRange[0])))   // 최소 나이 = 최대 년도
  }, [ageRange, ageToYear])

  // 시작 년도 입력 핸들러
  const handleStartYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setStartYear(value)
    
    const year = parseInt(value)
    if (!isNaN(year) && year >= 1900 && year <= CURRENT_YEAR) {
      const newMaxAge = yearToAge(year)
      const clampedMaxAge = Math.min(AGE_MAX, Math.max(ageRange[0], newMaxAge))
      setAgeRange([ageRange[0], clampedMaxAge])
    }
  }

  // 종료 년도 입력 핸들러
  const handleEndYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEndYear(value)
    
    const year = parseInt(value)
    if (!isNaN(year) && year >= 1900 && year <= CURRENT_YEAR) {
      const newMinAge = yearToAge(year)
      const clampedMinAge = Math.max(AGE_MIN, Math.min(ageRange[1], newMinAge))
      setAgeRange([clampedMinAge, ageRange[1]])
    }
  }

  return (
    <div className="space-y-3">
      {/* 라벨 + 현재 선택 범위 (나이 + 출생년도) 실시간 표시 */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-foreground">나이</Label>
        <span className="text-sm font-medium text-orange-500">
          {ageRange[0]}세 - {ageRange[1]}세
        </span>
      </div>
      
      {/* 출생년도 범위 표시 */}
      <div className="text-center">
        <span className="text-xs text-muted-foreground">
          ({ageToYear(ageRange[1])}년생 - {ageToYear(ageRange[0])}년생)
        </span>
      </div>
      
      {/* 커스텀 Radix Slider (touch-none, transition 제거) */}
      <SliderPrimitive.Root
        value={ageRange}
        onValueChange={(v) => setAgeRange(v as [number, number])}
        min={AGE_MIN}
        max={AGE_MAX}
        step={1}
        className="relative flex w-full items-center select-none touch-none py-2"
      >
        <SliderPrimitive.Track className="bg-gray-200 relative grow overflow-hidden rounded-full cursor-pointer h-2 w-full">
          <SliderPrimitive.Range className="bg-orange-500 absolute h-full" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block size-5 rounded-full border-2 border-orange-500 bg-white shadow-md cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2" />
        <SliderPrimitive.Thumb className="block size-5 rounded-full border-2 border-orange-500 bg-white shadow-md cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2" />
      </SliderPrimitive.Root>
      
      {/* 년도 입력칸 (양방향 동기화) */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            type="number"
            value={startYear}
            onChange={handleStartYearChange}
            placeholder="시작 년도"
            className="h-9 text-center text-sm"
            min={CURRENT_YEAR - AGE_MAX}
            max={CURRENT_YEAR - AGE_MIN}
          />
        </div>
        <span className="text-muted-foreground text-sm font-medium">~</span>
        <div className="flex-1">
          <Input
            type="number"
            value={endYear}
            onChange={handleEndYearChange}
            placeholder="종료 년도"
            className="h-9 text-center text-sm"
            min={CURRENT_YEAR - AGE_MAX}
            max={CURRENT_YEAR - AGE_MIN}
          />
        </div>
        <span className="text-xs text-muted-foreground w-8">년생</span>
      </div>
      
      {/* 최소/최대 범위 표시 */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{AGE_MIN}세</span>
        <span>{AGE_MAX}세</span>
      </div>
    </div>
  )
})

/**
 * 필터 사이드바 컴포넌트
 * 
 * 중요: ArtistsPage 외부에 선언하여 리렌더링 시 언마운트되지 않도록 함
 * 내부에서 useArtistsSafe() 직접 호출
 */
interface FilterSidebarProps {
  isMobile?: boolean
}

const FilterSidebar = memo(function FilterSidebar({ isMobile = false }: FilterSidebarProps) {
  const {
    selectedGender,
    selectedTags,
    heightRange,
    weightRange,
    setSelectedGender,
    setHeightRange,
    setWeightRange,
    toggleTag,
    clearAllFilters,
    selectAllTags,
    deselectAllTags,
    ageRange,
    statusTagOptions,
  } = useArtistsSafe()

  const [isFilterExpanded, setIsFilterExpanded] = useState(true)

  // 활성화된 필터 개수
  const activeFilterCount = [
    selectedGender !== "전체",
    ageRange[0] !== AGE_MIN || ageRange[1] !== AGE_MAX,
    heightRange[0] !== HEIGHT_MIN || heightRange[1] !== HEIGHT_MAX,
    weightRange[0] !== WEIGHT_MIN || weightRange[1] !== WEIGHT_MAX,
    selectedTags.length > 0,
  ].filter(Boolean).length

  return (
    <div className={`space-y-6 ${isMobile ? "" : "sticky top-24"}`}>
      {/* 필터 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Filter className="h-5 w-5" />
          필터
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFilterCount}
            </Badge>
          )}
        </h3>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-muted-foreground hover:text-destructive"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            초기화
          </Button>
        )}
      </div>

      {/* 성별 */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">성별</Label>
        <Select value={selectedGender} onValueChange={setSelectedGender}>
          <SelectTrigger>
            <SelectValue placeholder="성별 선택" />
          </SelectTrigger>
          <SelectContent>
            {genderOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 나이 Range Slider (양방향 출생년도 동기화) */}
      <AgeRangeSliderWithYearSync />

      {/* 키 Range Slider */}
      <RangeSliderFilter
        label="키"
        value={heightRange}
        onChange={setHeightRange}
        min={HEIGHT_MIN}
        max={HEIGHT_MAX}
        unit="cm"
      />

      {/* 몸무게 Range Slider */}
      <RangeSliderFilter
        label="몸무게"
        value={weightRange}
        onChange={setWeightRange}
        min={WEIGHT_MIN}
        max={WEIGHT_MAX}
        unit="kg"
      />

      {/* 활동 분야 태그 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Label className="text-sm font-semibold">활동 분야</Label>
            <div className="flex items-center gap-1.5">
              <Checkbox
                id="tag-select-all"
                checked={selectedTags.length === statusTagOptions.length}
                onCheckedChange={(checked) => {
                  if (checked) {
                    selectAllTags()
                  } else {
                    deselectAllTags()
                  }
                }}
                className="h-4 w-4"
              />
              <Label
                htmlFor="tag-select-all"
                className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              >
                {selectedTags.length === statusTagOptions.length ? "전체해제" : "전체선택"}
              </Label>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedTags.length > 0 && (
              <span className="text-xs text-orange-500 font-medium">
                {selectedTags.length}개
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className="h-6 w-6 p-0"
            >
              {isFilterExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        {isFilterExpanded && (
          <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1">
            {statusTagOptions.map((tag) => (
              <div 
                key={tag} 
                className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => toggleTag(tag)}
              >
                <Checkbox
                  id={`tag-${tag}`}
                  checked={selectedTags.includes(tag)}
                  onCheckedChange={() => toggleTag(tag)}
                  className="h-5 w-5"
                />
                <Label
                  htmlFor={`tag-${tag}`}
                  className="text-sm cursor-pointer flex-1"
                >
                  {tag}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
})

// =============================================================================
// 메인 페이지 컴포넌트
// =============================================================================

/**
 * [아티스트 검색 페이지]
 * 
 * 레이아웃:
 * - 상단: 검색창(좌) + 학교 드롭다운(우)
 * - 좌측 사이드바: 성별, 나이/키/몸무게 슬라이더, 활동 분야
 * - 우측 메인: 3D 스타일 아티스트 카드 그리드
 */
export default function ArtistsPage() {
  const router = useRouter()
  const {
    filteredArtists,
    searchQuery,
    selectedTags,
    setSearchQuery,
    selectedSchools,
    toggleSchool,
    toggleTag,
    deselectAllSchools,
    statusTagOptions,
  } = useArtistsSafe()
  const { isLoggedIn } = useAuth()
  const { toast } = useToast()

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [inputValue, setInputValue] = useState(searchQuery)

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(inputValue), 300)
    return () => clearTimeout(t)
  }, [inputValue, setSearchQuery])

  // Guest 상태에서 아티스트 상세 페이지 접근 차단
  const handleArtistClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isLoggedIn) {
      e.preventDefault()
      toast({
        title: "로그인이 필요합니다",
        description: "아티스트 상세 프로필은 로그인 후 확인할 수 있습니다.",
        variant: "destructive",
      })
      router.push("/login")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 상단 영역: 검색창 + 학교 필터 */}
      <div className="bg-gradient-to-b from-primary/5 to-background border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <h1 className="text-3xl font-bold text-foreground lg:text-4xl">아티스트</h1>
          <p className="text-muted-foreground mt-2">
            피플앤아트에 등록된 다양한 아티스트를 만나보세요
          </p>

          {/* 검색바 + 학교 필터 (한 줄 배치) */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            {/* 검색창 (좌측) */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="이름, 특기, 외국어로 검색..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="pl-10 h-12 text-base"
              />
              {inputValue && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => { setInputValue(""); setSearchQuery("") }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* 학교 필터 드롭다운 (우측) */}
            <div className="w-full sm:w-72">
              <Select
                value={selectedSchools.length === 1 ? selectedSchools[0] : selectedSchools.length > 1 ? "multiple" : "all"}
                onValueChange={(value) => {
                  if (value === "all") {
                    deselectAllSchools()
                  } else if (value === "multiple") {
                    // 다중 선택 상태 유지
                  } else {
                    // 단일 학교 선택
                    deselectAllSchools()
                    toggleSchool(value)
                  }
                }}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="출신 학교 선택">
                    {selectedSchools.length === 0 
                      ? "전체 학교" 
                      : selectedSchools.length === 1 
                        ? selectedSchools[0] 
                        : `${selectedSchools.length}개 학교 선택됨`}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 학교</SelectItem>
                  {schoolOptions.map((school) => (
                    <div
                      key={school}
                      className="flex items-center gap-2 px-2 py-2 cursor-pointer hover:bg-muted rounded-sm"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleSchool(school)
                      }}
                    >
                      <Checkbox
                        checked={selectedSchools.includes(school)}
                        onCheckedChange={() => toggleSchool(school)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">{school}</span>
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 모바일 필터 버튼 */}
            <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden h-12">
                  <Filter className="h-4 w-4 mr-2" />
                  필터
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>필터</SheetTitle>
                  <SheetDescription className="sr-only">
                    모바일 필터 설정 창입니다.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                  <FilterSidebar isMobile />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* 선택된 필터 태그 표시 */}
          {(selectedTags.length > 0 || selectedSchools.length > 0) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedSchools.map((school) => (
                <Badge
                  key={school}
                  variant="outline"
                  className="cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => toggleSchool(school)}
                >
                  {school}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
              {selectedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="flex gap-8">
          {/* 데스크탑 사이드바 */}
          <aside className="hidden lg:block w-64 shrink-0">
            <FilterSidebar />
          </aside>

          {/* 아티스트 그리드 */}
          <div className="flex-1">
            {/* 결과 수 */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                총 <span className="font-semibold text-foreground">{filteredArtists.length}</span>명의 아티스트
              </p>
            </div>

            {/* 아티스트 카드 그리드 - 3D 스타일 */}
            {filteredArtists.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-5">
                {filteredArtists.map((artist) => {
                  const birthYear = artist.birthDate 
                    ? new Date(artist.birthDate).getFullYear().toString().slice(-2) + "년생"
                    : ""
                  
                  return (
                    <Link 
                      key={artist.id} 
                      href={`/artists/${artist.id}`}
                      onClick={handleArtistClick}
                    >
                      <div className="group cursor-pointer">
                        {/* 카드 컨테이너 - 3D 효과 */}
                        <div className="relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-card border border-border">
                          {/* 이미지 영역 */}
                          <div className="aspect-[3/4] relative bg-muted">
                            {artist.profileImage ? (
                              <Image
                                src={artist.profileImage}
                                alt={artist.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-50">
                                <User className="h-16 w-16 text-gray-300" />
                              </div>
                            )}
                          </div>

                          {/* 카드 정보 */}
                          <div className="p-3 bg-card">
                            <h3 className="font-bold text-foreground text-sm truncate">
                              {artist.name}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              <span className={artist.gender === "여성" ? "text-pink-500" : "text-blue-500"}>
                                {artist.age}세
                              </span>
                              <span className="text-muted-foreground/60 mx-1">
                                ({birthYear})
                              </span>
                              <span>{artist.height}cm</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <User className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  검색 결과가 없습니다
                </h3>
                <p className="text-muted-foreground mb-4">
                  다른 검색어나 필터 조건을 시도해보세요
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
