"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Crown } from "lucide-react"

interface MembershipRequiredDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function MembershipRequiredDialog({ open, onOpenChange, onConfirm }: MembershipRequiredDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">멤버십 회원 전용 혜택</DialogTitle>
          <DialogDescription className="text-center pt-2">
            본 이벤트 신청은 <span className="font-semibold text-primary">멤버십 회원</span>만 가능합니다.
            <br />
            멤버십에 가입하고 무제한 오디션 신청 혜택을 받아보세요!
          </DialogDescription>
        </DialogHeader>
        <div className="bg-muted rounded-lg p-4 my-4">
          <h4 className="font-semibold text-foreground mb-2">멤버십 혜택</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><span className="text-primary">•</span> 광고·엔터 프로필 지원 무제한</li>
            <li className="flex items-center gap-2"><span className="text-primary">•</span> 자동 프로필 투어</li>
            <li className="flex items-center gap-2"><span className="text-primary">•</span> 작품 오디션 및 이벤트 우선 신청</li>
            <li className="flex items-center gap-2"><span className="text-primary">•</span> 연기 특강 참여 기회</li>
            <li className="flex items-center gap-2"><span className="text-primary">•</span> 추천인 입력 시 10,000P 즉시 지급</li>
          </ul>
        </div>
        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          <Button
            onClick={onConfirm}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            멤버십 가입 안내 보기
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
