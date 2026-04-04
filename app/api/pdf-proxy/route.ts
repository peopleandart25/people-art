import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// URL 형식: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
function parseStorageUrl(url: string): { supabaseUrl: string; bucket: string; path: string } | null {
  try {
    const match = url.match(/^(https:\/\/[^/]+\.supabase\.co)\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)/)
    if (!match) return null
    return { supabaseUrl: match[1], bucket: match[2], path: match[3] }
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")
  if (!url) return new NextResponse("Missing url", { status: 400 })

  const parsed = parseStorageUrl(url)
  if (!parsed) return new NextResponse("Invalid storage URL", { status: 400 })

  const supabase = createClient(
    parsed.supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase.storage
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
    },
  })
}
