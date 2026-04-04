import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    { error: "추천인 코드는 멤버십 최초 가입 시에만 적용할 수 있습니다." },
    { status: 400 }
  )
}
