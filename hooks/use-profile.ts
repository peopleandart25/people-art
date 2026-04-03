"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "./use-auth"
import { useToast } from "./use-toast"
import type { Database } from "@/lib/supabase/types"

type ArtistProfile = Database["public"]["Tables"]["artist_profiles"]["Row"]
type CareerItem = Database["public"]["Tables"]["career_items"]["Row"]
type ArtistPhoto = Database["public"]["Tables"]["artist_photos"]["Row"]
type VideoAsset = Database["public"]["Tables"]["video_assets"]["Row"]
type SocialLinks = Database["public"]["Tables"]["social_links"]["Row"]
type StatusTag = Database["public"]["Tables"]["status_tags"]["Row"]

export interface FullProfile {
  artistProfile: ArtistProfile | null
  careerItems: CareerItem[]
  photos: ArtistPhoto[]
  videoAssets: VideoAsset[]
  socialLinks: SocialLinks | null
  statusTagIds: number[]
}

export function useProfile() {
  const { user, profile: authProfile, refetchProfile } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  const [fullProfile, setFullProfile] = useState<FullProfile>({
    artistProfile: null,
    careerItems: [],
    photos: [],
    videoAssets: [],
    socialLinks: null,
    statusTagIds: [],
  })
  const [allTags, setAllTags] = useState<StatusTag[]>([])
  const [loading, setLoading] = useState(true)

  const userId = user?.id

  const fetchProfile = useCallback(async () => {
    if (!userId) return
    setLoading(true)

    const { data: artistProfile } = await supabase
      .from("artist_profiles").select("*").eq("user_id", userId).maybeSingle()

    const [
      { data: careerItems },
      { data: photos },
      { data: videoAssets },
      { data: socialLinks },
      { data: artistStatusTags },
      { data: tags },
    ] = await Promise.all([
      supabase.from("career_items").select("*").eq("user_id", userId).order("sort_order"),
      supabase.from("artist_photos").select("*").eq("user_id", userId).order("sort_order"),
      supabase.from("video_assets").select("*").eq("user_id", userId).order("sort_order"),
      supabase.from("social_links").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("artist_status_tags").select("tag_id").eq("artist_id", artistProfile?.id ?? ""),
      supabase.from("status_tags").select("*").order("id"),
    ])

    setFullProfile({
      artistProfile: artistProfile ?? null,
      careerItems: careerItems ?? [],
      photos: photos ?? [],
      videoAssets: videoAssets ?? [],
      socialLinks: socialLinks ?? null,
      statusTagIds: (artistStatusTags ?? []).map((t: { tag_id: number }) => t.tag_id),
    })
    setAllTags(tags ?? [])
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  useEffect(() => {
    if (userId) fetchProfile()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // 메인 사진 업로드
  const uploadMainPhoto = async (file: File): Promise<string | null> => {
    if (!user) return null
    const ext = file.name.split(".").pop()
    const path = `${user.id}/main.${ext}`
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true })
    if (error) { toast({ title: "업로드 실패", description: error.message, variant: "destructive" }); return null }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path)
    return `${data.publicUrl}?t=${Date.now()}`
  }

  // 서브 사진 업로드
  const uploadSubPhoto = async (file: File): Promise<string | null> => {
    if (!user) return null
    const ext = file.name.split(".").pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from("artist-photos").upload(path, file)
    if (error) { toast({ title: "업로드 실패", description: error.message, variant: "destructive" }); return null }
    const { data } = supabase.storage.from("artist-photos").getPublicUrl(path)
    return data.publicUrl
  }

  // 영상 파일 업로드
  const uploadVideo = async (file: File): Promise<string | null> => {
    if (!user) return null
    const ext = file.name.split(".").pop() ?? "mp4"
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from("videos").upload(path, file, { contentType: file.type || "video/mp4" })
    if (error) { toast({ title: "업로드 실패", description: error.message, variant: "destructive" }); return null }
    const { data } = supabase.storage.from("videos").getPublicUrl(path)
    return data.publicUrl
  }

  // PDF 업로드
  const uploadPortfolio = async (file: File): Promise<string | null> => {
    if (!user) return null
    const path = `${user.id}/portfolio.pdf`
    const { error } = await supabase.storage.from("portfolios").upload(path, file, { upsert: true })
    if (error) { toast({ title: "업로드 실패", description: error.message, variant: "destructive" }); return null }
    const { data } = supabase.storage.from("portfolios").getPublicUrl(path)
    return data.publicUrl
  }

  // 전체 프로필 저장
  const saveProfile = async (data: {
    // profiles
    name: string
    activityName: string
    phone: string
    // artist_profiles
    gender: string
    birthDate: string
    height: string
    weight: string
    bio: string
    etcInfo: string
    school: string
    isCustomSchool: boolean
    department: string
    graduationStatus: string
    portfolioUrl: string | null
    portfolioFileName: string | null
    mainPhotoUrl: string | null
    // social_links
    instagram: string
    youtube: string
    tiktok: string
    // 경력
    careerList: { id: string; category: string; year: string; title: string; role: string; isNew?: boolean }[]
    // 서브 사진
    newSubPhotos: { file: File; name: string }[]
    deletedPhotoIds: string[]
    // 영상
    newVideoLinks: { url: string; platform: string; name: string }[]
    newVideoFiles: { file: File; name: string }[]
    deletedVideoIds: string[]
    // 상태 태그
    statusTagIds: number[]
  }) => {
    if (!user) return false
    setLoading(true)

    try {
      // 1. profiles 업데이트
      await supabase.from("profiles").update({ name: data.name, phone: data.phone, activity_name: data.activityName || null }).eq("id", user.id)

      // 2. artist_profiles upsert
      const { data: ap } = await supabase.from("artist_profiles").upsert({
        user_id: user.id,
        gender: data.gender || null,
        birth_date: data.birthDate || null,
        height: data.height ? parseFloat(data.height) : null,
        weight: data.weight ? parseFloat(data.weight) : null,
        bio: data.bio,
        etc_info: data.etcInfo,
        school: data.school,
        is_custom_school: data.isCustomSchool,
        department: data.department,
        graduation_status: data.graduationStatus || null,
        portfolio_url: data.portfolioUrl,
        portfolio_file_name: data.portfolioFileName,
      }, { onConflict: "user_id" }).select("id").single()

      const artistId = ap?.id

      // 3. 메인 사진 → artist_photos에 is_main=true로 upsert
      if (data.mainPhotoUrl) {
        const existingMain = fullProfile.photos.find(p => p.is_main)
        if (existingMain) {
          await supabase.from("artist_photos").update({ url: data.mainPhotoUrl }).eq("id", existingMain.id)
        } else {
          await supabase.from("artist_photos").insert({ user_id: user.id, url: data.mainPhotoUrl, name: "main", is_main: true, sort_order: 0 })
        }
      }

      // 4. 서브 사진 삭제
      if (data.deletedPhotoIds.length > 0) {
        await supabase.from("artist_photos").delete().in("id", data.deletedPhotoIds)
      }

      // 5. 서브 사진 신규 업로드
      for (const photo of data.newSubPhotos) {
        const url = await uploadSubPhoto(photo.file)
        if (url) {
          const maxOrder = Math.max(0, ...fullProfile.photos.map(p => p.sort_order ?? 0))
          await supabase.from("artist_photos").insert({ user_id: user.id, url, name: photo.name, is_main: false, sort_order: maxOrder + 1 })
        }
      }

      // 6. 영상 삭제
      if (data.deletedVideoIds.length > 0) {
        await supabase.from("video_assets").delete().in("id", data.deletedVideoIds)
      }

      // 7. 영상 링크 추가
      for (const v of data.newVideoLinks) {
        await supabase.from("video_assets").insert({
          user_id: user.id, type: "link", name: v.name, url: v.url, platform: v.platform as "youtube" | "vimeo" | "other",
        })
      }

      // 8. 영상 파일 업로드
      for (const v of data.newVideoFiles) {
        const url = await uploadVideo(v.file)
        if (url) {
          await supabase.from("video_assets").insert({
            user_id: user.id, type: "file", name: v.name, url,
            file_size: `${(v.file.size / (1024 * 1024)).toFixed(1)}MB`,
          })
        }
      }

      // 9. 소셜 링크 upsert
      await supabase.from("social_links").upsert({
        user_id: user.id, instagram: data.instagram, youtube: data.youtube, tiktok: data.tiktok,
      }, { onConflict: "user_id" })

      // 10. 경력 사항 - 기존 전체 삭제 후 재삽입
      await supabase.from("career_items").delete().eq("user_id", user.id)
      if (data.careerList.length > 0) {
        await supabase.from("career_items").insert(
          data.careerList.map((c, i) => ({
            user_id: user.id,
            category: c.category,
            year: c.year,
            title: c.title,
            role: c.role,
            sort_order: i,
          }))
        )
      }

      // 11. 상태 태그 업데이트
      if (artistId) {
        await supabase.from("artist_status_tags").delete().eq("artist_id", artistId)
        if (data.statusTagIds.length > 0) {
          await supabase.from("artist_status_tags").insert(
            data.statusTagIds.map(tag_id => ({ artist_id: artistId, tag_id }))
          )
        }
      }

      await fetchProfile()
      refetchProfile()
      toast({ title: "저장 완료!", description: "프로필이 저장되었습니다." })
      return true
    } catch (err) {
      console.error(err)
      toast({ title: "저장 실패", description: "프로필 저장 중 오류가 발생했습니다.", variant: "destructive" })
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    fullProfile,
    allTags,
    loading,
    authProfile,
    fetchProfile,
    uploadMainPhoto,
    uploadPortfolio,
    saveProfile,
  }
}
