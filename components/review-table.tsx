"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Review, categoryColors, maskAuthorId } from "@/contexts/review-context"

/**
 * [공통 부품: ReviewTable]
 * 
 * 후기 목록을 테이블 형태로 표시하는 공통 컴포넌트입니다.
 * - 메인 페이지: 5개 미리보기
 * - 전체 페이지: 전체 목록
 * 
 * Props:
 * - data: 표시할 후기 배열
 * - onRowClick: 행 클릭 시 콜백 (선택)
 * - showPreview: 내용 미리보기 표시 여부 (기본: true)
 */

interface ReviewTableProps {
  data: Review[]
  onRowClick?: (review: Review) => void
  showPreview?: boolean
}

export function ReviewTable({ data, onRowClick, showPreview = true }: ReviewTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[100px]">구분</TableHead>
            <TableHead className="w-[100px]">작성자</TableHead>
            <TableHead>제목</TableHead>
            {showPreview && (
              <TableHead className="hidden md:table-cell">내용</TableHead>
            )}
            <TableHead className="w-[120px] text-right">작성일자</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((review) => (
              <TableRow
                key={review.id}
                onClick={() => onRowClick?.(review)}
                className={`${onRowClick ? "cursor-pointer" : ""} hover:bg-muted/50 transition-colors`}
              >
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      categoryColors[review.category] || "bg-gray-50 text-gray-600"
                    }`}
                  >
                    {review.categoryLabel}
                  </span>
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {maskAuthorId(review.author)}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {review.title}
                </TableCell>
                {showPreview && (
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm truncate max-w-[300px]">
                    {review.content}
                  </TableCell>
                )}
                <TableCell className="text-right text-sm text-muted-foreground">
                  {review.date}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell 
                colSpan={showPreview ? 5 : 4} 
                className="h-24 text-center text-muted-foreground"
              >
                등록된 후기가 없습니다.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
