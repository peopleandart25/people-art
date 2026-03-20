import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Newspaper } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

interface NewsDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: newsItem }, { data: allNews }] = await Promise.all([
    supabase.from("news").select("*").eq("id", id).eq("is_published", true).single(),
    supabase.from("news").select("id, title").eq("is_published", true).order("published_at", { ascending: false }),
  ])

  if (!newsItem) notFound()

  const currentIndex = (allNews ?? []).findIndex((n) => n.id === id)
  const prevItem = currentIndex > 0 ? allNews![currentIndex - 1] : null
  const nextItem = currentIndex < (allNews?.length ?? 0) - 1 ? allNews![currentIndex + 1] : null

  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="mx-auto max-w-4xl px-4 lg:px-8">
        <Link href="/news">
          <Button variant="ghost" className="mb-8 gap-2 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
            목록으로 돌아가기
          </Button>
        </Link>

        <div className="mb-8 border-b border-border pb-4">
          <h1 className="text-xl font-bold text-foreground lg:text-2xl">{newsItem.title}</h1>
          {newsItem.published_at && (
            <p className="text-sm text-muted-foreground mt-2">
              {new Date(newsItem.published_at).toLocaleDateString("ko-KR")}
            </p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          <div className="lg:w-1/2">
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted shadow-md">
              {newsItem.image_url ? (
                <Image
                  src={newsItem.image_url}
                  alt={newsItem.title}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                  <Newspaper className="h-24 w-24 text-primary/50" />
                </div>
              )}
            </div>
          </div>

          <div className="lg:w-1/2">
            <div className="text-foreground leading-relaxed whitespace-pre-line text-left">
              {newsItem.content || newsItem.excerpt || "상세 내용이 없습니다."}
            </div>
          </div>
        </div>

        <hr className="my-12 border-border" />

        <div className="flex flex-col sm:flex-row items-stretch gap-4">
          {prevItem ? (
            <Link href={`/news/${prevItem.id}`} className="flex-1">
              <div className="h-full p-4 rounded-lg border border-border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all">
                <span className="text-xs text-muted-foreground mb-1 block">이전 글</span>
                <span className="font-medium text-foreground line-clamp-1">{prevItem.title}</span>
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}

          {nextItem ? (
            <Link href={`/news/${nextItem.id}`} className="flex-1">
              <div className="h-full p-4 rounded-lg border border-border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all text-right">
                <span className="text-xs text-muted-foreground mb-1 block">다음 글</span>
                <span className="font-medium text-foreground line-clamp-1">{nextItem.title}</span>
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>

        <div className="text-center mt-10">
          <Link href="/news">
            <Button variant="outline" className="px-8">목록으로</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
