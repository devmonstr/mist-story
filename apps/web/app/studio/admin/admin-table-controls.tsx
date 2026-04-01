"use client"

import type { ReactNode } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type AdminTableControlsProps = {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  pageSize: number
  onPageSizeChange: (value: number) => void
  pageSizeOptions: number[]
  summary: string
  filtersSlot?: ReactNode
  actionLabel?: string
  onAction?: () => void
}

export function AdminTableControls({
  search,
  onSearchChange,
  searchPlaceholder,
  pageSize,
  onPageSizeChange,
  pageSizeOptions,
  summary,
  filtersSlot,
  actionLabel,
  onAction,
}: AdminTableControlsProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 border border-border bg-background p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
        <div className="relative w-full md:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="rounded-none pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Page size
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="w-[110px] rounded-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {filtersSlot}
      </div>

      <div className="flex flex-col gap-2 lg:items-end">
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {summary}
        </div>
        {actionLabel && onAction ? (
          <Button variant="outline" onClick={onAction} className="rounded-none">
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
