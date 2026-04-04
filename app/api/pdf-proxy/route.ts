import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")
  if (!url) return new NextResponse("Missing url", { status: 400 })

  // Supabase Storage URL만 허용
  const allowed = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  if (!url.startsWith(allowed)) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const res = await fetch(url)
  if (!res.ok) return new NextResponse("Failed to fetch PDF", { status: res.status })

  const buffer = await res.arrayBuffer()
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline",
    },
  })
}
