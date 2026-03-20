"use client"

import { useUserSafe } from "@/contexts/user-context"
import { useToast } from "@/hooks/use-toast"
import { useCallback } from "react"

/**
 * [중앙 집중식 포인트 관리 훅 - Single Source of Truth]
 * 
 * 모든 컴포넌트에서 포인트를 다룰 때 반드시 이 훅을 사용하세요.
 * 
 * [핵심 원칙]
 * 1. 포인트 데이터는 UserContext에 단 하나만 존재 (Single Source of Truth)
 * 2. 이 훅의 `points`는 Context의 `points`를 직접 참조
 * 3. `setPoints`로 값을 변경하면 헤더, 결제창, 마이페이지 등 모든 UI가 즉시 동기화
 * 4. 새로고침 없이 실시간 반영됨
 * 
 * [사용 예시]
 * const { points: userPoints, setPoints: setUserPoints, deductPoints, addPoints } = usePoints()
 * 
 * // 포인트 표시
 * <span>{userPoints.toLocaleString()}P</span>
 * 
 * // 포인트 차감 (결제 시)
 * deductPoints(10000, false) // 토스트 없이 차감
 * 
 * // 포인트 복구 (취소 시)
 * const newPoints = userPoints + refundAmount
 * setUserPoints(newPoints)
 * 
 * // 포인트 추가 (적립 시)
 * addPoints(5000, true) // 토스트 표시
 * 
 * [주의사항]
 * - useUserSafe()의 points를 직접 사용하지 마세요 (이 훅을 통해 접근)
 * - 하드코딩된 숫자 대신 항상 userPoints 변수를 사용하세요
 * - 포인트 계산: remainingPoints = userPoints - usedPoints
 */
export function usePoints() {
  // UserContext에서 points와 setPoints를 가져옴 (Single Source of Truth)
  const { points, setPoints } = useUserSafe()
  const { toast } = useToast()

  // 포인트 차감
  const deductPoints = useCallback((amount: number, showToast = true) => {
    if (amount <= 0) return false
    
    if (points < amount) {
      if (showToast) {
        toast({
          title: "포인트 부족",
          description: `보유 포인트(${points.toLocaleString()}P)가 부족합니다.`,
          variant: "destructive",
        })
      }
      return false
    }

    const newBalance = points - amount
    setPoints(newBalance)

    if (showToast) {
      toast({
        title: "포인트 사용 완료",
        description: `${amount.toLocaleString()}P가 사용되어 잔액이 ${newBalance.toLocaleString()}P가 되었습니다.`,
      })
    }

    return true
  }, [points, setPoints, toast])

  // 포인트 추가
  const addPoints = useCallback((amount: number, showToast = true) => {
    if (amount <= 0) return false

    const newBalance = points + amount
    setPoints(newBalance)

    if (showToast) {
      toast({
        title: "포인트 적립 완료",
        description: `${amount.toLocaleString()}P가 적립되어 잔액이 ${newBalance.toLocaleString()}P가 되었습니다.`,
      })
    }

    return true
  }, [points, setPoints, toast])

  // 포인트 충분 여부 확인
  const hasEnoughPoints = useCallback((amount: number) => {
    return points >= amount
  }, [points])

  // 사용 가능한 최대 포인트 (주어진 금액을 초과하지 않는 범위에서)
  const getUsablePoints = useCallback((maxAmount: number) => {
    return Math.min(points, maxAmount)
  }, [points])

  return {
    points,
    deductPoints,
    addPoints,
    hasEnoughPoints,
    getUsablePoints,
    setPoints,
  }
}
