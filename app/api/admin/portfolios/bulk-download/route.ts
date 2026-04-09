import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import JSZip from "jszip"

const SETTING_KEY = "last_bulk_pdf_download_at"
const BATCH_LIMIT = 200

type MissedEntry = { user_id: string; name: string; reason: string }
type IncludedEntry = { user_id: string; name: string; file_name: string; portfolio_updated_at: string | null }

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const serviceClient = createServiceClient()
  const { data: caller } = await serviceClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (!caller || !["admin", "sub_admin"].includes(caller.role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })
  }

  // Read last bulk download timestamp
  const { data: setting } = await serviceClient
    .from("app_settings")
    .select("value")
    .eq("key", SETTING_KEY)
    .maybeSingle()

  const lastAt = setting?.value && setting.value.length > 0 ? setting.value : null

  // Query artists with new/updated PDFs since lastAt
  // 정렬: 가장 오래된 것부터 (NULLS FIRST). lastAt이 없거나 portfolio_updated_at이 NULL인 행도 포함.
  let query = serviceClient
    .from("artist_profiles")
    .select("user_id, portfolio_url, portfolio_file_name, portfolio_updated_at")
    .not("portfolio_url", "is", null)
    .order("portfolio_updated_at", { ascending: true, nullsFirst: true })
    .limit(BATCH_LIMIT)

  if (lastAt) {
    query = query.or(`portfolio_updated_at.gt.${lastAt},portfolio_updated_at.is.null`)
  }

  const { data: artists, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!artists || artists.length === 0) {
    return NextResponse.json({ message: "새로 업데이트된 PDF가 없습니다." }, { status: 200 })
  }

  const userIds = artists.map(a => a.user_id)
  const { data: profiles } = await serviceClient
    .from("profiles")
    .select("id, name, activity_name")
    .in("id", userIds)
  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))

  const zip = new JSZip()
  const included: IncludedEntry[] = []
  const missed: MissedEntry[] = []

  for (const a of artists) {
    const p = profileMap.get(a.user_id) as { name: string | null; activity_name: string | null } | undefined
    const displayName = (p?.name ?? p?.activity_name ?? "unknown").replace(/[\\/:*?"<>|]/g, "_")
    const shortId = a.user_id.slice(0, 8)
    const fileName = `${displayName}_${shortId}.pdf`

    const path = `${a.user_id}/portfolio.pdf`
    const { data: file, error: dlErr } = await serviceClient.storage.from("portfolios").download(path)
    if (dlErr || !file) {
      missed.push({ user_id: a.user_id, name: displayName, reason: dlErr?.message ?? "다운로드 실패" })
      continue
    }

    const buf = Buffer.from(await file.arrayBuffer())
    zip.file(fileName, buf)
    included.push({
      user_id: a.user_id,
      name: displayName,
      file_name: fileName,
      portfolio_updated_at: a.portfolio_updated_at,
    })
  }

  if (included.length === 0) {
    return NextResponse.json(
      { message: "다운로드 가능한 PDF가 없습니다.", missed },
      { status: 200 }
    )
  }

  // Manifest 추가 (성공/실패 목록)
  const manifest = {
    generated_at: new Date().toISOString(),
    last_watermark: lastAt,
    included_count: included.length,
    missed_count: missed.length,
    included,
    missed,
  }
  zip.file("_manifest.json", JSON.stringify(manifest, null, 2))

  // 신규 워터마크 = 포함된 행들 중 portfolio_updated_at의 최대값
  // (NULL 값은 무시; 모두 NULL이면 fallback 으로 now())
  const validTimestamps = included
    .map((i) => i.portfolio_updated_at)
    .filter((t): t is string => !!t)
  const newWatermark =
    validTimestamps.length > 0
      ? validTimestamps.reduce((max, cur) => (cur > max ? cur : max))
      : new Date().toISOString()

  // JSZip → Web ReadableStream 변환 (스트리밍, STORE 압축)
  const nodeStream = zip.generateNodeStream({
    streamFiles: true,
    compression: "STORE",
  })

  const webStream = new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk: Buffer) => {
        controller.enqueue(new Uint8Array(chunk))
      })
      nodeStream.on("end", () => controller.close())
      nodeStream.on("error", (err) => controller.error(err))
    },
    cancel() {
      nodeStream.removeAllListeners()
    },
  })

  const yyyymmdd = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const asciiName = `portfolios_${yyyymmdd}.zip`
  const utf8Name = encodeURIComponent(`포트폴리오_${yyyymmdd}.zip`)

  return new Response(webStream, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`,
      "X-Bulk-Download-Watermark": newWatermark,
      "X-Bulk-Download-Included": String(included.length),
      "X-Bulk-Download-Missed": String(missed.length),
    },
  })
}
