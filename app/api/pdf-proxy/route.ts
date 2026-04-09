import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

// 허용된 Supabase storage bucket 화이트리스트
const ALLOWED_BUCKETS = new Set(["portfolios", "templates"])

// URL 형식: https://<project>.supabase.co/storage/v1/object/(public|sign)/<bucket>/<path>
function parseStorageUrl(url: string): { bucket: string; path: string } | null {
  try {
    const parsed = new URL(url)
    const expectedHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname
    if (parsed.hostname !== expectedHost) return null
    const pathMatch = parsed.pathname.match(/^\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/)
    if (!pathMatch) return null
    return { bucket: pathMatch[1], path: decodeURIComponent(pathMatch[2]) }
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")
  if (!url) return new NextResponse("Missing url", { status: 400 })

  if (url.startsWith("blob:")) {
    return new NextResponse("포트폴리오를 마이페이지에서 다시 업로드해주세요.", { status: 400 })
  }

  // 1) 인증 필수
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const parsed = parseStorageUrl(url)
  if (!parsed) {
    return new NextResponse("Invalid storage URL", { status: 400 })
  }
  if (!ALLOWED_BUCKETS.has(parsed.bucket)) {
    return new NextResponse("Bucket not allowed", { status: 403 })
  }

  // 2) 권한 확인 — admin/sub_admin 또는 승인된 casting_director 또는 본인 파일
  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("role, cd_approval_status")
    .eq("id", user.id)
    .single<{ role: string; cd_approval_status: string | null }>()

  const isAdmin = profile?.role === "admin" || profile?.role === "sub_admin"
  const isApprovedCD =
    profile?.role === "casting_director" && profile?.cd_approval_status === "approved"

  // portfolios 버킷: path는 보통 `<userId>/...` 형태라 본인 파일이면 허용
  const isOwnPortfolio =
    parsed.bucket === "portfolios" && parsed.path.startsWith(`${user.id}/`)

  if (!isAdmin && !isApprovedCD && !isOwnPortfolio) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  // 3) 다운로드
  const { data, error } = await serviceClient.storage
    .from(parsed.bucket)
    .download(parsed.path)

  if (error || !data) {
    return new NextResponse("Failed to fetch PDF", { status: 500 })
  }

  const buffer = await data.arrayBuffer()
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline",
      "Cache-Control": "private, max-age=0, no-store",
    },
  })
}
