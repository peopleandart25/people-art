import { useState, useMemo } from "react"

export type SortDirection = "asc" | "desc"

interface UseAdminListOptions<T> {
  searchFields: (keyof T)[]
  defaultSortField: keyof T
  defaultSortDirection?: SortDirection
  pageSize?: number
}

export interface UseAdminListReturn<T> {
  paginatedItems: T[]
  filteredCount: number
  searchTerm: string
  setSearchTerm: (v: string) => void
  sortField: keyof T
  setSortField: (v: keyof T) => void
  sortDirection: SortDirection
  setSortDirection: (v: SortDirection) => void
  toggleSortDirection: () => void
  currentPage: number
  setCurrentPage: (v: number) => void
  totalPages: number
}

export function useAdminList<T extends Record<string, unknown>>(
  items: T[],
  options: UseAdminListOptions<T>
): UseAdminListReturn<T> {
  const {
    searchFields,
    defaultSortField,
    defaultSortDirection = "desc",
    pageSize = 20,
  } = options

  const [searchTerm, setSearchTermRaw] = useState("")
  const [sortField, setSortFieldRaw] = useState<keyof T>(defaultSortField)
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection)
  const [currentPage, setCurrentPage] = useState(1)

  const setSearchTerm = (v: string) => { setSearchTermRaw(v); setCurrentPage(1) }
  const setSortField = (v: keyof T) => { setSortFieldRaw(v); setCurrentPage(1) }
  const toggleSortDirection = () => setSortDirection((d) => (d === "asc" ? "desc" : "asc"))

  const filtered = useMemo(() => {
    let result = [...items]
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter((item) =>
        searchFields.some((field) => {
          const val = item[field]
          return typeof val === "string" && val.toLowerCase().includes(term)
        })
      )
    }
    result.sort((a, b) => {
      const av = a[sortField]
      const bv = b[sortField]
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      let cmp: number
      if (typeof av === "number" && typeof bv === "number") {
        cmp = av - bv
      } else {
        const as = String(av)
        const bs = String(bv)
        cmp = as < bs ? -1 : as > bs ? 1 : 0
      }
      return sortDirection === "asc" ? cmp : -cmp
    })
    return result
  }, [items, searchTerm, sortField, sortDirection, searchFields])

  const filteredCount = filtered.length
  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  return {
    paginatedItems,
    filteredCount,
    searchTerm,
    setSearchTerm,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    toggleSortDirection,
    currentPage: safePage,
    setCurrentPage,
    totalPages,
  }
}
