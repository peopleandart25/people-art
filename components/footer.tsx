"use client"

import Link from "next/link"
import Image from "next/image"
import { MessageCircle, Instagram, Youtube, ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { footerData } from "@/data/content"

/**
 * [관리자 안내]
 * Footer에 표시되는 모든 정보는 data/content.ts의 footerData에서 관리합니다.
 * - 회사 정보: footerData.company (상호명, 대표자, 사업자번호)
 * - 연락처 정보: footerData.contact (주소, 이메일, 계좌)
 * - 바로가기 링크: footerData.links
 * - SNS 링크: footerData.social
 * - 저작권 문구: footerData.copyright
 */

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <footer className="bg-black text-gray-400">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* 메인 콘텐츠 영역 - 3단 Flex (동일 너비, 상단 정렬) */}
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-12">
          {/* 왼쪽: 로고 + 회사정보 */}
          <div className="flex-1 flex items-start gap-4">
            <Link href="/" className="shrink-0">
              <Image
                src="/images/logo.png"
                alt="피플앤아트 로고"
                width={120}
                height={40}
                className="object-contain brightness-0 invert"
                style={{ width: "120px", height: "auto" }}
              />
            </Link>
            <div className="text-xs leading-relaxed space-y-1 text-gray-400">
              <p>상호명: {footerData.company.name}</p>
              <p>대표자: {footerData.company.ceo}</p>
              <p>사업자등록번호: {footerData.company.businessNumber}</p>
              <p>통신판매업번호: {footerData.company.salesNumber}</p>
            </div>
          </div>

          {/* 중앙: 연락처 정보 */}
          <div className="flex-1 flex items-start">
            <div className="text-xs leading-relaxed space-y-1 text-gray-400">
              <p>주소: {footerData.contact.address}</p>
              <p>이메일: {footerData.contact.email}</p>
              <p>입금계좌: {footerData.contact.bankAccount}</p>
            </div>
          </div>

          {/* 오른쪽: 링크 + SNS */}
          <div className="flex-1 flex flex-col items-start">
            {/* 바로가기 링크 - 한 줄 */}
            <div className="flex flex-wrap items-center gap-2 text-xs mb-4">
              {footerData.links.map((item, index) => {
                const isExternal = "isExternal" in item && item.isExternal
                const linkClassName = `hover:text-primary transition-colors ${item.label === "개인정보처리방침" ? "text-primary font-medium" : "text-gray-400"}`
                
                return (
                  <span key={item.href || `footer-link-${index}`} className="flex items-center">
                    {isExternal ? (
                      <a
                        href={item.href || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkClassName}
                      >
                        {item.label || "링크"}
                      </a>
                    ) : (
                      <Link
                        href={item.href || "#"}
                        className={linkClassName}
                      >
                        {item.label || "링크"}
                      </Link>
                    )}
                    {index < footerData.links.length - 1 && (
                      <span className="ml-2 text-gray-600">|</span>
                    )}
                  </span>
                )
              })}
            </div>

            {/* SNS 아이콘 */}
            <div className="flex items-center gap-2">
              {footerData.social.kakao && (
                <a
                  href={footerData.social.kakao}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:bg-primary hover:text-white transition-colors"
                  aria-label="카카오톡"
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
              )}
              {footerData.social.instagram && (
                <a
                  href={footerData.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:bg-primary hover:text-white transition-colors"
                  aria-label="인스타그램"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {footerData.social.youtube && (
                <a
                  href={footerData.social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:bg-primary hover:text-white transition-colors"
                  aria-label="유튜브"
                >
                  <Youtube className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* 하단 구분선 + Copyright */}
        <hr className="border-gray-800 my-6" />
        <div className="text-center">
          <p className="text-xs text-gray-500">
            {footerData.copyright}
          </p>
        </div>
      </div>

      {/* Fixed Buttons */}
      <div className="fixed right-4 bottom-4 flex flex-col gap-2 z-40">
        {footerData.social.kakao && (
          <a
            href={footerData.social.kakao}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
            aria-label="카카오톡 상담"
          >
            <MessageCircle className="h-5 w-5" />
          </a>
        )}
        <Button
          variant="default"
          size="icon"
          onClick={scrollToTop}
          className="h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
        >
          <ArrowUp className="h-5 w-5" />
          <span className="sr-only">맨 위로 이동</span>
        </Button>
      </div>
    </footer>
  )
}
