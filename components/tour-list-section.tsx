"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronRight, Film, Tv, Sparkles } from "lucide-react"

interface TourItem {
  id: number
  category: "영화" | "드라마"
  title: string
  deadline: string
  isNew: boolean
}

const tourItems: TourItem[] = [
  {
    id: 1,
    category: "영화",
    title: "넷플릭스 오리지널 1996년생~2000년생 남자 배우 모집",
    deadline: "2026.02.28",
    isNew: true,
  },
  {
    id: 2,
    category: "영화",
    title: "장편영화 '새벽의 약속' 20대 초반 여자 배우 모집",
    deadline: "2026.03.05",
    isNew: true,
  },
  {
    id: 3,
    category: "드라마",
    title: "KBS 미니시리즈 30대 남자 조연 모집",
    deadline: "2026.03.10",
    isNew: true,
  },
  {
    id: 4,
    category: "드라마",
    title: "tvN 새 드라마 20대 후반 여자 배우 모집",
    deadline: "2026.03.15",
    isNew: true,
  },
  {
    id: 5,
    category: "영화",
    title: "독립영화 '첫 번째 겨울' 10대 후반 배우 모집",
    deadline: "2026.03.20",
    isNew: false,
  },
  {
    id: 6,
    category: "드라마",
    title: "SBS 주말드라마 40대 남자 조연 모집",
    deadline: "2026.03.25",
    isNew: false,
  },
]

export function TourListSection() {
  return (
    <section id="tourlist" className="py-16 lg:py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground lg:text-3xl">PROFILE TOUR LIST</h2>
            <p className="text-muted-foreground mt-1">프로필 투어 리스트</p>
          </div>
          <a
            href="/tour"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            전체보기
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>

        {/* Tour Info */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-foreground mb-2">프로필투어 진행 안내</h3>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <p><span className="font-medium text-foreground">투어 진행:</span> 매주 월-금</p>
            <p><span className="font-medium text-foreground">투어 인증:</span> 매주 금-토 회원방에서 투어 인증자료 공유드립니다.</p>
          </div>
        </div>

        {/* Tour Items Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {tourItems.map((item) => (
            <Card
              key={item.id}
              className="group cursor-pointer border border-border transition-all hover:shadow-md hover:border-primary/30"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
                    item.category === "영화" ? "bg-primary/10 text-primary" : "bg-blue-50 text-blue-600"
                  }`}>
                    {item.category === "영화" ? (
                      <Film className="h-6 w-6" />
                    ) : (
                      <Tv className="h-6 w-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="secondary"
                        className={
                          item.category === "영화"
                            ? "bg-primary/10 text-primary"
                            : "bg-blue-50 text-blue-600"
                        }
                      >
                        {item.category}
                      </Badge>
                      {item.isNew && (
                        <Badge className="bg-red-500 text-white">
                          <Sparkles className="h-3 w-3 mr-1" />
                          NEW
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{item.deadline} 마감</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
