import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { email } = await request.json()
  if (!email) {
    return NextResponse.json({ provider: null })
  }

  const serviceClient = createServiceClient()
  const { data: { users } } = await serviceClient.auth.admin.listUsers()
  const user = users?.find(u => u.email === email)

  if (!user) {
    return NextResponse.json({ provider: null })
  }

  const provider = user.app_metadata?.provider ?? user.identities?.[0]?.provider ?? null
  // email provider는 소셜이 아니므로 null 반환
  if (provider === "email") {
    return NextResponse.json({ provider: null })
  }

  return NextResponse.json({ provider })
}
