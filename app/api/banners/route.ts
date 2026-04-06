import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const serviceClient = createServiceClient()

  const { data, error } = await serviceClient
    .from("banners")
    .select("id, title, image_url, link_url, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" },
  })
}
