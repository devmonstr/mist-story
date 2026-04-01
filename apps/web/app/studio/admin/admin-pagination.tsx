"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

type AdminPaginationProps = {
  page: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function AdminPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: AdminPaginationProps) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const end = totalItems === 0 ? 0 : Math.min(page * pageSize, totalItems)

  return (
    <div className="mt-4 flex flex-col gap-3 border border-border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">
        Showing {start}-{end} of {totalItems}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-none"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>
        <div className="min-w-16 border border-border px-3 py-2 text-center text-sm">
          {page} / {Math.max(totalPages, 1)}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-none"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
