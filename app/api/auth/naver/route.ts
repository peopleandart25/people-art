import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const redirectTo = searchParams.get("redirectTo") ?? "/"

  const naverAuthUrl = new URL("https://nid.naver.com/oauth2.0/authorize")
  naverAuthUrl.searchParams.set("response_type", "code")
  naverAuthUrl.searchParams.set("client_id", process.env.NAVER_CLIENT_ID!)
  naverAuthUrl.searchParams.set("redirect_uri", `${origin}/api/auth/naver/callback`)
  naverAuthUrl.searchParams.set("state", JSON.stringify({ redirectTo }))

  return NextResponse.redirect(naverAuthUrl.toString())
}
