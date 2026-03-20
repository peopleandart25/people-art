"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Building2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/types"

type PartnerRow = Database["public"]["Tables"]["partners"]["Row"]

const ITEMS_PER_PAGE = 8

export default function PartnersPage() {
  const [partners, setPartners] = useState<PartnerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const fetchPartners = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("partners")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
      setPartners(data ?? [])
      setLoading(false)
    }
    fetchPartners()
  }, [])

  const totalPages = Math.ceil(partners.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const currentItems = partners.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const getPageNumbers = () => {
    const pages: number[] = []
    for (let i = 1; i <= totalPages; i++) pages.push(i)
    return pages
  }

  return (
    <section className="py-12 lg:py-20 bg-background">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">PARTNERSHIP</h1>
          <p className="text-primary mt-1">제휴업체</p>
          <p className="text-muted-foreground mt-2">피플앤아트와 함께하는 파트너사입니다</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <span className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <a
                    key={item.id}
                    href={item.link ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <Card className="cursor-pointer border border-border bg-card overflow-hidden h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-primary/30">
                      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                            <Building2 className="h-16 w-16 text-primary/40" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4 text-center">
                        <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                          {item.name}
                        </h3>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                      </CardContent>
                    </Card>
                  </a>
                ))
              ) : (
                <div className="col-span-full text-center py-16 text-muted-foreground">
                  등록된 제휴업체가 없습니다.
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                {getPageNumbers().map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-[40px] h-10 px-3 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted border border-border"
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
