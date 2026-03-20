"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PenLine, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ReviewTable } from "@/components/review-table"
import {
  Review,
  reviewCategories,
  categoryColors,
  maskAuthorId,
  toReview,
} from "@/contexts/review-context"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

export default function ReviewsPage() {
  const { toast } = useToast()
  const { isLoggedIn, user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [isWriteDialogOpen, setIsWriteDialogOpen] = useState(false)

  const [newCategory, setNewCategory] = useState("")
  const [newTitle, setNewTitle] = useState("")
  const [newContent, setNewContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const itemsPerPage = 10

  const fetchReviews = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
    setReviews((data ?? []).map(toReview))
    setLoading(false)
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  const filteredReviews =
    selectedCategory === "all"
      ? reviews
      : reviews.filter((r) => r.category === selectedCategory)

  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentItems = filteredReviews.slice(startIndex, startIndex + itemsPerPage)

  const getPageNumbers = () => {
    const maxVisible = 10
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    const end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setCurrentPage(1)
  }

  const handleWriteClick = () => {
    if (!isLoggedIn) {
      toast({
        title: "로그인 필요",
        description: "후기 작성은 로그인 후 이용할 수 있습니다.",
        variant: "destructive",
      })
      return
    }
    setIsWriteDialogOpen(true)
  }

  const handleSubmitReview = async () => {
    if (!newCategory || !newTitle.trim() || !newContent.trim()) {
      toast({
        title: "입력 오류",
        description: "카테고리, 제목, 내용을 모두 입력해주세요.",
        variant: "destructive",
      })
      return
    }
    if (!user) return

    setIsSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.from("reviews").insert({
      category: newCategory,
      title: newTitle.trim(),
      content: newContent.trim(),
      user_id: user.id,
      is_hidden: false,
    })

    if (error) {
      toast({
        title: "등록 실패",
        description: "후기 등록 중 오류가 발생했습니다.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    await fetchReviews()
    setIsWriteDialogOpen(false)
    setNewCategory("")
    setNewTitle("")
    setNewContent("")
    setIsSubmitting(false)
    setSelectedCategory("all")
    setCurrentPage(1)

    toast({
      title: "후기 등록 완료",
      description: "소중한 후기가 등록되었습니다.",
    })
  }

  const resetForm = () => {
    setNewCategory("")
    setNewTitle("")
    setNewContent("")
  }

  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground lg:text-4xl">후기 게시판</h1>
              <p className="text-muted-foreground mt-2">
                피플앤아트 서비스를 이용한 회원들의 생생한 후기를 확인해보세요.
              </p>
            </div>
            <Button
              onClick={handleWriteClick}
              className="hidden sm:flex items-center gap-2"
            >
              <PenLine className="h-4 w-4" />
              후기 작성하기
            </Button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <Tabs value={selectedCategory} onValueChange={handleCategoryChange} className="w-full">
              <TabsList className="h-auto p-1 flex-wrap">
                {reviewCategories.map((category) => (
                  <TabsTrigger
                    key={category.value}
                    value={category.value}
                    className="px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {category.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <Button
            onClick={handleWriteClick}
            className="sm:hidden w-full flex items-center justify-center gap-2"
          >
            <PenLine className="h-4 w-4" />
            후기 작성하기
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <span className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : currentItems.length > 0 ? (
          <ReviewTable
            data={currentItems}
            onRowClick={(review) => setSelectedReview(review)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-border bg-card">
            <MessageSquare className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">등록된 후기가 없습니다.</p>
            <p className="text-sm text-muted-foreground mt-1">첫 번째 후기를 작성해보세요!</p>
          </div>
        )}

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

        {/* 후기 상세 다이얼로그 */}
        <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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

        {/* 후기 작성 다이얼로그 */}
        <Dialog
          open={isWriteDialogOpen}
          onOpenChange={(open) => {
            setIsWriteDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PenLine className="h-5 w-5" />
                후기 작성하기
              </DialogTitle>
              <DialogDescription>
                피플앤아트 서비스 이용 후기를 남겨주세요.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category">카테고리</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {reviewCategories
                      .filter((cat) => cat.value !== "all")
                      .map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">제목</Label>
                <Input
                  id="title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="후기 제목을 입력하세요"
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">내용</Label>
                <Textarea
                  id="content"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="후기 내용을 자세히 작성해주세요"
                  rows={5}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsWriteDialogOpen(false)
                  resetForm()
                }}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button onClick={handleSubmitReview} disabled={isSubmitting}>
                {isSubmitting ? "등록 중..." : "등록하기"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}
