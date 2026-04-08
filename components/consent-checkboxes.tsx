"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronRight } from "lucide-react"
import { PRIVACY_CONSENT, MARKETING_CONSENT } from "@/lib/consent-text"

type ConsentDoc = typeof PRIVACY_CONSENT

interface ConsentCheckboxesProps {
  privacyAgreed: boolean
  marketingAgreed: boolean
  onPrivacyChange: (value: boolean) => void
  onMarketingChange: (value: boolean) => void
}

export function ConsentCheckboxes({
  privacyAgreed,
  marketingAgreed,
  onPrivacyChange,
  onMarketingChange,
}: ConsentCheckboxesProps) {
  const [openDoc, setOpenDoc] = useState<ConsentDoc | null>(null)
  const allAgreed = privacyAgreed && marketingAgreed

  const handleAllChange = (value: boolean) => {
    onPrivacyChange(value)
    onMarketingChange(value)
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox
          checked={allAgreed}
          onCheckedChange={(v) => handleAllChange(v === true)}
        />
        <span className="text-sm font-semibold text-foreground">전체 동의</span>
      </label>

      <div className="border-t border-border pt-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 cursor-pointer flex-1">
            <Checkbox
              checked={privacyAgreed}
              onCheckedChange={(v) => onPrivacyChange(v === true)}
            />
            <span className="text-sm text-foreground">
              <span className="text-red-500 font-semibold">[필수]</span> 개인정보 수집 및 이용 동의
            </span>
          </label>
          <button
            type="button"
            onClick={() => setOpenDoc(PRIVACY_CONSENT)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
          >
            보기 <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 cursor-pointer flex-1">
            <Checkbox
              checked={marketingAgreed}
              onCheckedChange={(v) => onMarketingChange(v === true)}
            />
            <span className="text-sm text-foreground">
              <span className="text-muted-foreground font-semibold">[선택]</span> 마케팅 정보 수신 및 활용 동의
            </span>
          </label>
          <button
            type="button"
            onClick={() => setOpenDoc(MARKETING_CONSENT)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
          >
            보기 <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      <Dialog open={openDoc !== null} onOpenChange={(v) => !v && setOpenDoc(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{openDoc?.title}</DialogTitle>
            {openDoc?.intro && (
              <DialogDescription className="text-left whitespace-pre-line">
                {openDoc.intro}
              </DialogDescription>
            )}
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4 text-sm text-foreground">
              {openDoc?.sections.map((section, i) => (
                <div key={i} className="space-y-1">
                  <p className="font-semibold">{section.heading}</p>
                  {section.body && (
                    <p className="text-muted-foreground">{section.body}</p>
                  )}
                  {section.items.length > 0 && (
                    <ul className="space-y-1 list-disc pl-5 text-muted-foreground">
                      {section.items.map((item, j) => (
                        <li key={j}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setOpenDoc(null)}>
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
