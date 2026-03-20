"use client"

import { useState } from "react"
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
  useReviewsSafe, 
  Review, 
  reviewCategories, 
  categoryColors,
  maskAuthorId 
} from "@/contexts/review-context"

/**
 * [관리자 안내]
 * 후기 게시판 전체 페이지
 * - ReviewContext에서 데이터를 가져와 표시
 * - ReviewTable 공통 컴포넌트 사용
 * - 카테고리: 전체, 매거진, 후기, 공지사항
 */

export default function ReviewsPage() {
  const { toast } = useToast()
  const { reviews, addReview } = useReviewsSafe()
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [isWriteDialogOpen, setIsWriteDialogOpen] = useState(false)
  
  // 작성 폼 상태
  const [newCategory, setNewCategory] = useState("")
  const [newTitle, setNewTitle] = useState("")
  const [newContent, setNewContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const itemsPerPage = 10

  // 카테고리 필터링
  const filteredReviews = selectedCategory === "all"
    ? reviews
    : reviews.filter((review) => review.category === selectedCategory)

  // 페이지네이션
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentItems = filteredReviews.slice(startIndex, startIndex + itemsPerPage)

  // 페이지 번호 배열 생성
  const getPageNumbers = () => {
    const maxVisible = 10
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    const end = Math.min(totalPages, start + maxVisible - 1)
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  // 카테고리 변경 시 첫 페이지로 이동
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setCurrentPage(1)
  }

  // 후기 등록
  const handleSubmitReview = async () => {
    if (!newCategory || !newTitle.trim() || !newContent.trim()) {
      toast({
        title: "입력 오류",
        description: "카테고리, 제목, 내용을 모두 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    
    // 서버 요청 시뮬레이션
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const categoryLabel = reviewCategories.find(c => c.value === newCategory)?.label || newCategory

    addReview({
      category: newCategory,
      categoryLabel: categoryLabel,
      title: newTitle.trim(),
      content: newContent.trim(),
      author: "user_demo123", // 실제로는 로그인된 사용자 아이디
      date: new Date().toISOString().split('T')[0],
    })

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

  // 폼 초기화
  const resetForm = () => {
    setNewCategory("")
    setNewTitle("")
    setNewContent("")
  }

  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground lg:text-4xl">
                후기 게시판
              </h1>
              <p className="text-muted-foreground mt-2">
                피플앤아트 서비스를 이용한 회원들의 생생한 후기를 확인해보세요.
              </p>
            </div>
            <Button
              onClick={() => setIsWriteDialogOpen(true)}
              className="hidden sm:flex items-center gap-2"
            >
              <PenLine className="h-4 w-4" />
              후기 작성하기
            </Button>
          </div>

          {/* Category Tabs - 전체 / 매거진 / 후기 / 공지사항 */}
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

          {/* Mobile Write Button */}
          <Button
            onClick={() => setIsWriteDialogOpen(true)}
            className="sm:hidden w-full flex items-center justify-center gap-2"
          >
            <PenLine className="h-4 w-4" />
            후기 작성하기
          </Button>
        </div>

        {/* Review Table - 공통 컴포넌트 사용 */}
        {currentItems.length > 0 ? (
          <ReviewTable 
            data={currentItems} 
            onRowClick={(review) => setSelectedReview(review)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-border bg-card">
            <MessageSquare className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              등록된 후기가 없습니다.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              첫 번째 후기를 작성해보세요!
            </p>
          </div>
        )}

        {/* Pagination */}
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

        {/* Review Detail Dialog */}
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

        {/* Write Review Dialog */}
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
              {/* 카테고리 선택 */}
              <div className="space-y-2">
                <Label htmlFor="category">카테고리</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {reviewCategories.filter((cat) => cat.value !== "all").map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 제목 입력 */}
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

              {/* 내용 입력 */}
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
