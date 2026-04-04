import { getMembershipSettings } from "@/lib/supabase/membership-settings"
import { NextResponse } from "next/server"

export async function GET() {
  const settings = await getMembershipSettings()
  return NextResponse.json(settings)
}
