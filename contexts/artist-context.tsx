"use client"

import { createContext, useContext, useState, ReactNode, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export type StatusTag = string

export interface VideoItem {
  type: 'file' | 'link'
  url: string
  title: string
}

export interface ArtistProfile {
  id: string
  name: string
  profileImage: string | null
  subImages: string[]
  gender: string
  birthDate: string
  age: number
  height: string
  weight: string
  statusTags: StatusTag[]
  bio: string
  isPublic: boolean
  skills: string[]
  languages: string[]
  school: string | null
  careers: CareerItem[]
  videos: VideoItem[]
  videoUrl: string | null
  pdfUrl: string | null
}

export const schoolOptions = [
  "가천대학교",
  "건국대학교",
  "경기대학교",
  "경희대학교",
  "계명대학교",
  "국민대학교",
  "단국대학교",
  "동국대학교",
  "동아방송예술대학교",
  "상명대학교",
  "서경대학교",
  "서울예술대학교",
  "서일대학교",
  "성균관대학교",
  "성신여자대학교",
  "세종대학교",
  "수원대학교",
  "숭실대학교",
  "순천향대학교",
  "용인대학교",
  "인덕대학교",
  "인천대학교",
  "인하대학교",
  "전주대학교",
  "정화예술대학교",
  "중앙대학교",
  "청주대학교",
  "한국예술종합학교",
  "한양대학교",
  "홍익대학교",
]

export interface CareerItem {
  id: string
  year: string
  category: string
  title: string
  role: string
}

export const genderOptions = ["전체", "남성", "여성"]


export const AGE_MIN = 5
export const AGE_MAX = 90
export const HEIGHT_MIN = 120
export const HEIGHT_MAX = 200
export const WEIGHT_MIN = 20
export const WEIGHT_MAX = 200

interface ArtistContextType {
  artists: ArtistProfile[]
  filteredArtists: ArtistProfile[]
  loading: boolean
  getArtistById: (id: string) => ArtistProfile | undefined
  statusTagOptions: StatusTag[]
  searchQuery: string
  selectedGender: string
  selectedTags: StatusTag[]
  selectedSchools: string[]
  ageRange: [number, number]
  heightRange: [number, number]
  weightRange: [number, number]
  setSearchQuery: (query: string) => void
  setSelectedGender: (gender: string) => void
  setAgeRange: (range: [number, number]) => void
  setHeightRange: (range: [number, number]) => void
  setWeightRange: (range: [number, number]) => void
  toggleTag: (tag: StatusTag) => void
  selectAllTags: () => void
  deselectAllTags: () => void
  toggleSchool: (school: string) => void
  selectAllSchools: () => void
  deselectAllSchools: () => void
  clearAllFilters: () => void
}

function calculateAge(birthDate: string): number {
  if (!birthDate) return 0
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

const ArtistContext = createContext<ArtistContextType | undefined>(undefined)

export function ArtistProvider({ children }: { children: ReactNode }) {
  const [artists, setArtists] = useState<ArtistProfile[]>([])
  const [statusTagOptions, setStatusTagOptions] = useState<StatusTag[]>([])
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGender, setSelectedGender] = useState("전체")
  const [selectedTags, setSelectedTags] = useState<StatusTag[]>([])
  const [selectedSchools, setSelectedSchools] = useState<string[]>([])
  const [ageRange, setAgeRange] = useState<[number, number]>([AGE_MIN, AGE_MAX])
  const [heightRange, setHeightRange] = useState<[number, number]>([HEIGHT_MIN, HEIGHT_MAX])
  const [weightRange, setWeightRange] = useState<[number, number]>([WEIGHT_MIN, WEIGHT_MAX])

  useEffect(() => {
    const fetchArtists = async () => {
      setLoading(true)
      const supabase = createClient()

      const [
        { data: artistProfiles },
        { data: profiles },
        { data: mainPhotos },
        { data: statusTagJoins },
        { data: allStatusTags },
      ] = await Promise.all([
        supabase.from("artist_profiles").select("id, user_id, gender, birth_date, height, weight, bio, school, portfolio_url"),
        supabase.from("profiles").select("id, name"),
        supabase.from("artist_photos").select("user_id, url").eq("is_main", true),
        supabase.from("artist_status_tags").select("artist_id, tag_id"),
        supabase.from("status_tags").select("id, name"),
      ])

      if (!artistProfiles) { setLoading(false); return }

      const profileMap = new Map((profiles ?? []).map(p => [p.id, p.name]))
      const photoMap = new Map((mainPhotos ?? []).map(p => [p.user_id, p.url]))
      const tagMap = new Map((allStatusTags ?? []).map(t => [t.id, t.name as string]))
      setStatusTagOptions((allStatusTags ?? []).map(t => t.name as string))

      const artistTagsMap = new Map<string, string[]>()
      for (const join of (statusTagJoins ?? [])) {
        const tagName = tagMap.get(join.tag_id)
        if (tagName) {
          const existing = artistTagsMap.get(join.artist_id) ?? []
          artistTagsMap.set(join.artist_id, [...existing, tagName])
        }
      }

      const mapped: ArtistProfile[] = artistProfiles.map(ap => ({
        id: ap.id,
        name: profileMap.get(ap.user_id) ?? "",
        profileImage: photoMap.get(ap.user_id) ?? null,
        subImages: [],
        gender: ap.gender ?? "",
        birthDate: ap.birth_date ?? "",
        age: calculateAge(ap.birth_date ?? ""),
        height: ap.height != null ? String(ap.height) : "",
        weight: ap.weight != null ? String(ap.weight) : "",
        statusTags: artistTagsMap.get(ap.id) ?? [],
        bio: ap.bio ?? "",
        isPublic: true,
        skills: [],
        languages: [],
        school: ap.school ?? null,
        careers: [],
        videos: [],
        videoUrl: null,
        pdfUrl: ap.portfolio_url ?? null,
      }))

      setArtists(mapped)
      setLoading(false)
    }

    fetchArtists()
  }, [])

  const getArtistById = (id: string) => artists.find(a => a.id === id)

  const filteredArtists = artists.filter(artist => {
    if (!artist.isPublic) return false

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const nameMatch = artist.name.toLowerCase().includes(query)
      const bioMatch = artist.bio.toLowerCase().includes(query)
      const schoolMatch = artist.school?.toLowerCase().includes(query) || false
      if (!nameMatch && !bioMatch && !schoolMatch) return false
    }

    if (selectedGender !== "전체" && artist.gender !== selectedGender) return false

    const age = artist.age
    if (age > 0 && (age < ageRange[0] || age > ageRange[1])) return false

    const height = parseFloat(artist.height) || 0
    if (height > 0 && (height < heightRange[0] || height > heightRange[1])) return false

    const weight = parseFloat(artist.weight) || 0
    if (weight > 0 && (weight < weightRange[0] || weight > weightRange[1])) return false

    if (selectedTags.length > 0) {
      const hasMatchingTag = selectedTags.some(tag => artist.statusTags.includes(tag))
      if (!hasMatchingTag) return false
    }

    if (selectedSchools.length > 0) {
      if (!artist.school || !selectedSchools.includes(artist.school)) return false
    }

    return true
  })

  const toggleTag = (tag: StatusTag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const selectAllTags = () => setSelectedTags(statusTagOptions)
  const deselectAllTags = () => setSelectedTags([])

  const toggleSchool = (school: string) => {
    setSelectedSchools(prev =>
      prev.includes(school) ? prev.filter(s => s !== school) : [...prev, school]
    )
  }

  const selectAllSchools = () => setSelectedSchools([...schoolOptions])
  const deselectAllSchools = () => setSelectedSchools([])

  const clearAllFilters = () => {
    setSearchQuery("")
    setSelectedGender("전체")
    setAgeRange([AGE_MIN, AGE_MAX])
    setHeightRange([HEIGHT_MIN, HEIGHT_MAX])
    setWeightRange([WEIGHT_MIN, WEIGHT_MAX])
    setSelectedTags([])
    setSelectedSchools([])
  }

  return (
    <ArtistContext.Provider
      value={{
        artists,
        filteredArtists,
        loading,
        getArtistById,
        statusTagOptions,
        searchQuery,
        selectedGender,
        selectedTags,
        selectedSchools,
        ageRange,
        heightRange,
        weightRange,
        setSearchQuery,
        setSelectedGender,
        setAgeRange,
        setHeightRange,
        setWeightRange,
        toggleTag,
        selectAllTags,
        deselectAllTags,
        toggleSchool,
        selectAllSchools,
        deselectAllSchools,
        clearAllFilters,
      }}
    >
      {children}
    </ArtistContext.Provider>
  )
}

export function useArtists() {
  const context = useContext(ArtistContext)
  if (context === undefined) {
    throw new Error("useArtists must be used within an ArtistProvider")
  }
  return context
}

export function useArtistsSafe() {
  const context = useContext(ArtistContext)
  if (context === undefined) {
    return {
      artists: [] as ArtistProfile[],
      filteredArtists: [] as ArtistProfile[],
      loading: false,
      getArtistById: () => undefined,
      statusTagOptions: [] as StatusTag[],
      searchQuery: "",
      selectedGender: "전체",
      selectedTags: [] as StatusTag[],
      selectedSchools: [] as string[],
      ageRange: [AGE_MIN, AGE_MAX] as [number, number],
      heightRange: [HEIGHT_MIN, HEIGHT_MAX] as [number, number],
      weightRange: [WEIGHT_MIN, WEIGHT_MAX] as [number, number],
      setSearchQuery: () => {},
      setSelectedGender: () => {},
      setAgeRange: () => {},
      setHeightRange: () => {},
      setWeightRange: () => {},
      toggleTag: () => {},
      selectAllTags: () => {},
      deselectAllTags: () => {},
      toggleSchool: () => {},
      selectAllSchools: () => {},
      deselectAllSchools: () => {},
      clearAllFilters: () => {},
    }
  }
  return context
}
