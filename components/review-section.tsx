"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { ChevronRight } from "lucide-react"
import { ReviewTable } from "@/components/review-table"
import { Review, toReview, maskAuthorId, categoryColors } from "@/contexts/review-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export function ReviewSection() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)

  useEffect(() => {
    const fetchReviews = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("is_hidden", false)
        .order("created_at", { ascending: false })
        .limit(5)
      setReviews((data ?? []).map(toReview))
    }
    fetchReviews()
  }, [])

  return (
    <section id="review" className="py-16 lg:py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground lg:text-3xl">REVIEW</h2>
            <p className="text-muted-foreground mt-1">이용자 후기</p>
          </div>
          <Link
            href="/reviews"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            전체보기
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <ReviewTable
          data={reviews}
          onRowClick={(review) => setSelectedReview(review)}
        />

        <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
          <DialogContent className="sm:max-w-lg">
            {selectedReview && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        categoryColors[selectedReview.category] || "bg-gray-50 text-gray-600"
                      }`}
                    >
                      {selectedReview.categoryLabel}
                    </span>
                  </div>
                  <DialogTitle className="text-xl">{selectedReview.title}</DialogTitle>
                  <DialogDescription className="flex items-center gap-4 pt-2">
                    <span>작성자: {maskAuthorId(selectedReview.author)}</span>
                    <span>{selectedReview.date}</span>
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                    {selectedReview.content}
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedReview(null)}>
                    닫기
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}
