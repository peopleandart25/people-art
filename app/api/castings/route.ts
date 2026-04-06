import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const search = searchParams.get("search")
  const includeClosed = searchParams.get("include_closed") === "true"
  const limit = searchParams.get("limit")

  const serviceClient = createServiceClient()
  let query = serviceClient
    .from("castings")
    .select("id, title, category, role_type, gender, birth_year_start, birth_year_end, deadline, location, fee, is_closed, is_urgent, created_at")
    .order("created_at", { ascending: false })

  if (!includeClosed) {
    query = query.eq("is_closed", false)
  }
  if (category && category !== "전체") {
    query = query.eq("category", category)
  }
  if (search) {
    query = query.ilike("title", `%${search}%`)
  }
  if (limit) {
    query = query.limit(Number(limit))
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
