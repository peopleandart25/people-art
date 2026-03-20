"use client"

import { useState, useEffect } from "react"
import { Film, Tv } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/types"

type TourRow = Database["public"]["Tables"]["tours"]["Row"]

const ITEMS_PER_PAGE = 10

const statusBadgeStyles: Record<string, string> = {
  new: "bg-red-500 text-white",
  ongoing: "bg-green-500 text-white",
  closed: "bg-gray-400 text-white",
}

const statusLabels: Record<string, string> = {
  new: "NEW",
  ongoing: "진행중",
  closed: "마감",
}

export default function TourListPage() {
  const [tours, setTours] = useState<TourRow[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const fetchTours = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("tours")
        .select("*")
        .order("created_at", { ascending: false })
      setTours(data ?? [])
      setLoading(false)
    }
    fetchTours()
  }, [])

  const totalPages = Math.ceil(tours.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const currentItems = tours.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const getPageNumbers = () => {
    const pages: number[] = []
    for (let i = 1; i <= totalPages; i++) pages.push(i)
    return pages
  }

  return (
    <section className="py-6 lg:py-10 bg-background">
      <div className="mx-auto max-w-6xl px-4 lg:px-8">
        <div className="mb-4">
          <h1 className="text-lg font-bold text-foreground lg:text-xl">PROFILE TOUR LIST</h1>
          <p className="text-xs text-orange-500 mt-0.5">프로필 투어 리스트</p>
        </div>

        <div className="border border-border rounded-lg p-3 mb-4">
          <div className="flex flex-col md:flex-row items-center justify-center text-center gap-1 md:gap-6">
            <span className="font-semibold text-foreground text-sm">프로필투어 진행 안내</span>
            <span className="text-xs text-muted-foreground">피플앤아트 배우 프로필 투어 리스트입니다</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <span className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <div
                    key={item.id}
                    className="border border-border rounded-lg bg-white px-5 py-4 cursor-default flex flex-col min-h-[120px]"
                  >
                    <div className="flex items-start justify-between">
                      <Badge
                        variant="outline"
                        className={`text-xs font-medium px-2.5 py-1 flex items-center gap-1.5 ${
                          item.category === "영화"
                            ? "border-gray-800 text-gray-800 bg-gray-100"
                            : "border-gray-600 text-gray-600 bg-gray-50"
                        }`}
                      >
                        {item.category === "영화" ? (
                          <Film className="w-3.5 h-3.5" />
                        ) : (
                          <Tv className="w-3.5 h-3.5" />
                        )}
                        {item.category ?? "드라마"}
                      </Badge>

                      <Badge
                        className={`text-xs font-bold px-3 py-1 ${statusBadgeStyles[item.status] ?? statusBadgeStyles.ongoing}`}
                      >
                        {statusLabels[item.status] ?? "진행중"}
                      </Badge>
                    </div>

                    <div className="flex-1 flex items-center justify-center px-2 mt-3">
                      <h3 className="text-[15px] font-medium text-foreground text-center leading-snug tracking-tight">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-12 text-muted-foreground">
                  등록된 공고가 없습니다.
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-6">
                {getPageNumbers().map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-[28px] h-7 px-2 text-sm font-medium rounded transition-colors ${
                      currentPage === pageNum
                        ? "bg-orange-500 text-white"
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
