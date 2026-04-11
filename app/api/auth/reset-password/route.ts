import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { randomBytes } from "crypto"

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
  const bytes = randomBytes(8)
  return Array.from(bytes).map(b => chars[b % chars.length]).join("")
}

export async function POST(request: Request) {
  let body: { email?: string }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 })
  }
  const { email } = body

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "이메일을 입력해주세요." }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  // profiles 테이블에서 이메일로 사용자 조회 (listUsers 대신)
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle()

  if (!profile) {
    // 이메일 열거 방지: 존재하지 않아도 동일한 성공 응답
    return NextResponse.json({ success: true })
  }

  // 사용자 정보 조회
  const { data: userData } = await serviceClient.auth.admin.getUserById(profile.id)
  const user = userData?.user
  if (!user) {
    return NextResponse.json({ success: true })
  }

  // 소셜 로그인 계정 확인
  const identities = user.identities ?? []
  const hasEmailProvider = identities.some((id) => id.provider === "email")
  if (!hasEmailProvider) {
    // 소셜 계정이어도 동일한 성공 응답 (열거 방지)
    return NextResponse.json({ success: true })
  }

  const tempPassword = generateTempPassword()

  // 비밀번호 업데이트
  const { error: updateError } = await serviceClient.auth.admin.updateUserById(user.id, {
    password: tempPassword,
  })
  if (updateError) {
    console.error("[reset-password] 비밀번호 업데이트 실패:", updateError.message)
    return NextResponse.json({ error: "처리 중 오류가 발생했습니다." }, { status: 500 })
  }

  // 이메일 HTML 템플릿
  const htmlTemplate = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

        <!-- 헤더 -->
        <tr><td style="background:#f97316;padding:20px 32px;">
          <p style="margin:0;color:#ffffff;font-size:13px;font-weight:500;opacity:0.9;">People &amp; Art</p>
          <p style="margin:4px 0 0;color:#ffffff;font-size:20px;font-weight:700;">임시 비밀번호 안내</p>
        </td></tr>

        <!-- 본문 -->
        <tr><td style="padding:28px 32px 20px;">
          <p style="margin:0 0 16px;font-size:15px;color:#111827;line-height:1.7;">
            안녕하세요.<br>
            요청하신 임시 비밀번호를 안내드립니다.
          </p>
        </td></tr>

        <!-- 임시 비밀번호 강조 -->
        <tr><td style="padding:0 32px 24px;">
          <table style="background:#fff7ed;border:2px solid #f97316;border-radius:8px;width:100%;padding:20px;" cellpadding="0" cellspacing="0">
            <tr><td style="text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:#9a3412;font-weight:600;">임시 비밀번호</p>
              <p style="margin:0;font-size:28px;font-weight:700;color:#ea580c;letter-spacing:4px;font-family:monospace;">${tempPassword}</p>
            </td></tr>
          </table>
        </td></tr>

        <!-- 안내 메시지 -->
        <tr><td style="padding:0 32px 24px;">
          <table style="background:#fef3c7;border-radius:8px;width:100%;padding:16px;" cellpadding="0" cellspacing="0">
            <tr><td>
              <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
                ⚠️ 로그인 후 반드시 비밀번호를 변경해주세요.<br>
                임시 비밀번호는 보안을 위해 즉시 변경하시기 바랍니다.
              </p>
            </td></tr>
          </table>
        </td></tr>

        <!-- 로그인 버튼 -->
        <tr><td style="padding:0 32px 28px;">
          <a href="https://people-art.co.kr/login" style="display:inline-block;padding:12px 24px;background:#f97316;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">로그인하러 가기</a>
        </td></tr>

        <!-- 푸터 -->
        <tr><td style="padding:20px 32px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">이 메일은 <a href="https://people-art.co.kr" style="color:#f97316;text-decoration:none;">People &amp; Art</a>를 통해 발송되었습니다.<br>본인이 요청하지 않은 경우 이 메일을 무시해주세요.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  // Resend API로 이메일 발송
  const emailRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "People & Art <noreply@people-art.co.kr>",
      to: [email],
      subject: "[People & Art] 임시 비밀번호 안내",
      html: htmlTemplate,
    }),
  })

  if (!emailRes.ok) {
    console.error("[reset-password] 이메일 발송 실패:", await emailRes.text().catch(() => ""))
    return NextResponse.json({ error: "처리 중 오류가 발생했습니다." }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
