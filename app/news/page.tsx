"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Newspaper } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/types"

type NewsRow = Database["public"]["Tables"]["news"]["Row"]

const ITEMS_PER_PAGE = 8

export default function NewsListPage() {
  const [news, setNews] = useState<NewsRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true)
      const supabase = createClient()
      const from = (currentPage - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1
      const { data, count } = await supabase
        .from("news")
        .select("*", { count: "exact" })
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .range(from, to)
      setNews(data ?? [])
      setTotalCount(count ?? 0)
      setLoading(false)
    }
    fetchNews()
  }, [currentPage])

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
  const currentItems = news

  const getPageNumbers = () => {
    const maxVisible = 10
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    const end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  if (loading) {
    return (
      <section className="py-16 lg:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 flex justify-center">
          <span className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground lg:text-4xl">NEWS</h1>
          <p className="text-muted-foreground mt-2">피플앤아트 소식</p>
        </div>

        {news.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Newspaper className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p>등록된 소식이 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {currentItems.map((item) => (
                <Link key={item.id} href={`/news/${item.id}`}>
                  <Card className="group cursor-pointer h-full border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:scale-[1.02] overflow-hidden">
                    <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                          <Newspaper className="h-16 w-16 text-primary/50" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      {item.published_at && (
                        <p className="text-sm text-muted-foreground">
                          {new Date(item.published_at).toLocaleDateString("ko-KR")}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-12">
                {getPageNumbers().map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-[36px] h-9 px-3 text-sm font-medium rounded transition-colors ${
                      currentPage === pageNum
                        ? "bg-black text-white"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
