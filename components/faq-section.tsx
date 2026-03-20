"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { faqs } from "@/data/content"

/**
 * [관리자 안내]
 * FAQ 목록은 data/content.ts의 faqs 배열에서 관리합니다.
 * - question: 질문
 * - answer: 답변
 * - category: 카테고리 (필터링 용도)
 */

export function FaqSection() {
  return (
    <section id="faq" className="py-16 lg:py-24 bg-background">
      <div className="mx-auto max-w-3xl px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground lg:text-3xl">FAQ</h2>
          <p className="text-muted-foreground mt-1">자주 묻는 질문</p>
        </div>

        {/* FAQ Accordion */}
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-border">
              <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground whitespace-pre-line">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
