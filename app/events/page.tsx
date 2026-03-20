"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Calendar, ChevronRight, Crown, LogIn, UserPlus, Ticket } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import type { Database } from "@/lib/supabase/types"

type EventRow = Database["public"]["Tables"]["events"]["Row"]

const ITEMS_PER_PAGE = 6

export default function EventsPage() {
  const router = useRouter()
  const { isLoggedIn } = useAuth()

  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    const fetchEvents = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false })
      setEvents(data ?? [])
      setLoading(false)
    }
    fetchEvents()
  }, [])

  const totalPages = Math.ceil(events.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const currentItems = events.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const handleEventClick = (e: React.MouseEvent) => {
    if (!isLoggedIn) {
      e.preventDefault()
      setShowLoginModal(true)
    }
  }

  const getPageNumbers = () => {
    const pages: number[] = []
    for (let i = 1; i <= totalPages; i++) pages.push(i)
    return pages
  }

  if (loading) {
    return (
      <section className="py-12 lg:py-20 bg-background">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 flex justify-center">
          <span className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 lg:py-20 bg-background">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">EVENT</h1>
          <p className="text-muted-foreground mt-1">오디션 및 특강 이벤트</p>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Ticket className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p>등록된 이벤트가 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {currentItems.map((item) => (
                <Card
                  key={item.id}
                  className="group flex flex-col overflow-hidden border border-border transition-all hover:shadow-lg hover:border-primary/30"
                >
                  <div className="relative aspect-[4/3] bg-black overflow-hidden">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-black">
                        <Ticket className="h-16 w-16 text-white/30" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge
                        className={
                          item.type === "오디션"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }
                      >
                        {item.type}
                      </Badge>
                      <Badge
                        className={
                          item.status === "진행중"
                            ? "bg-green-500 text-white"
                            : "bg-gray-500 text-white"
                        }
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4 flex-1">
                    <h3 className="font-semibold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    {item.deadline && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{item.deadline} 마감</span>
                      </div>
                    )}
                    {item.is_member_only && (
                      <div className="flex items-center gap-2 text-sm text-primary mt-2">
                        <Crown className="h-4 w-4" />
                        <span>멤버십 전용</span>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="p-4 pt-0">
                    <Link
                      href={`/events/${item.id}`}
                      className="w-full"
                      onClick={handleEventClick}
                    >
                      <Button
                        disabled={item.status === "마감"}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground gap-2"
                      >
                        {item.status === "마감" ? "마감됨" : "신청하기"}
                        {item.status !== "마감" && <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
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

      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              <LogIn className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl">로그인이 필요합니다</DialogTitle>
            <DialogDescription className="text-center pt-2">
              이벤트 상세 보기 및 신청은 <span className="font-semibold text-foreground">로그인 후</span> 이용 가능합니다.
              <br />
              로그인하고 다양한 오디션 기회를 만나보세요!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-4">
            <Button
              onClick={() => { setShowLoginModal(false); router.push("/login") }}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            >
              <LogIn className="h-4 w-4" />
              로그인하기
            </Button>
            <Button
              variant="outline"
              onClick={() => { setShowLoginModal(false); router.push("/login") }}
              className="w-full gap-2"
            >
              <UserPlus className="h-4 w-4" />
              회원가입
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
