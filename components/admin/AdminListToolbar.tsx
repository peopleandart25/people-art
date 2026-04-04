"use client"

import { Search, ArrowUp, ArrowDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import type { SortDirection } from "@/hooks/use-admin-list"

export interface SortOption {
  value: string
  label: string
}

interface AdminListToolbarProps {
  searchTerm: string
  onSearchChange: (v: string) => void
  searchPlaceholder?: string
  sortField: string
  onSortFieldChange: (v: string) => void
  sortOptions: SortOption[]
  sortDirection: SortDirection
  onToggleSortDirection: () => void
  filteredCount: number
  totalCount: number
  itemLabel?: string
}

export function AdminListToolbar({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "검색...",
  sortField,
  onSortFieldChange,
  sortOptions,
  sortDirection,
  onToggleSortDirection,
  filteredCount,
  totalCount,
  itemLabel = "건",
}: AdminListToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <Input
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-8 h-9 text-sm"
        />
      </div>
      <Select value={sortField} onValueChange={onSortFieldChange}>
        <SelectTrigger className="w-32 h-9 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        onClick={onToggleSortDirection}
        title={sortDirection === "asc" ? "오름차순" : "내림차순"}
      >
        {sortDirection === "asc" ? (
          <ArrowUp className="h-3.5 w-3.5" />
        ) : (
          <ArrowDown className="h-3.5 w-3.5" />
        )}
      </Button>
      <span className="text-sm text-gray-500 ml-1">
        {searchTerm ? `${filteredCount} / ${totalCount}${itemLabel}` : `총 ${totalCount}${itemLabel}`}
      </span>
    </div>
  )
}
