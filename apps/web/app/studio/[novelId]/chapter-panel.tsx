"use client"

import { useMemo, useState } from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Check, GripVertical, Loader2, MoreVertical, Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { EditorChapter } from "@/lib/studio"

type ChapterPanelMode = "browse" | "reorder"

interface ChapterPanelProps {
  chapters: EditorChapter[]
  activeChapterId: string
  deletingChapterId: string | null
  isPersistingOrder: boolean
  onAddChapter: () => void
  onDeleteChapter: (chapterId: string) => void
  onSelectChapter: (chapterId: string) => void
  onReorderChapters: (orderedChapterIds: string[]) => void
  onSelectionComplete?: () => void
}

interface BrowseChapterRowProps {
  chapter: EditorChapter
  index: number
  isActive: boolean
  isDeleting: boolean
  onDelete: () => void
  onSelect: () => void
}

interface ReorderChapterRowProps {
  chapter: EditorChapter
  index: number
  isActive: boolean
  isPersistingOrder: boolean
}

function ChapterStatusBadge({ status }: { status: EditorChapter["status"] }) {
  return (
    <Badge variant={status === "PUBLISHED" ? "outline" : "secondary"} className="text-[10px]">
      {status === "PUBLISHED" ? "Published" : "Draft"}
    </Badge>
  )
}

function BrowseChapterRow({
  chapter,
  index,
  isActive,
  isDeleting,
  onDelete,
  onSelect,
}: BrowseChapterRowProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onSelect()
        }
      }}
      className={`group flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        isActive
          ? "border-foreground/15 bg-muted shadow-sm"
          : "border-transparent hover:border-border/70 hover:bg-muted/50"
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-xs font-medium ${
          isActive
            ? "border-foreground/15 bg-background text-foreground"
            : "border-border/70 bg-background text-muted-foreground"
        }`}
      >
        {index + 1}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">{chapter.title}</p>
          {isActive ? (
            <Badge variant="outline" className="hidden text-[10px] sm:inline-flex">
              Current
            </Badge>
          ) : null}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <ChapterStatusBadge status={chapter.status} />
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
            onClick={(event) => event.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onSelect}>Open</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={(event) => {
              event.stopPropagation()
              onDelete()
            }}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete chapter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function ReorderChapterRow({
  chapter,
  index,
  isActive,
  isPersistingOrder,
}: ReorderChapterRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: chapter.id,
      disabled: isPersistingOrder,
    })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
      className={`touch-none rounded-xl border px-3 py-3 transition-shadow ${
        isDragging
          ? "z-10 border-foreground/15 bg-card shadow-xl ring-1 ring-border"
          : isActive
            ? "border-foreground/15 bg-muted"
            : "border-border/60 bg-background hover:border-border hover:bg-muted/35"
      } ${isPersistingOrder ? "cursor-progress opacity-70" : "cursor-grab active:cursor-grabbing"}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-background text-xs font-medium text-muted-foreground">
          {index + 1}
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-dashed border-border/80 bg-background text-muted-foreground">
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-foreground">{chapter.title}</p>
            {isActive ? (
              <Badge variant="outline" className="hidden text-[10px] sm:inline-flex">
                Current
              </Badge>
            ) : null}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <ChapterStatusBadge status={chapter.status} />
            <span className="text-[11px] text-muted-foreground">Drag to move</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ChapterPanel({
  chapters,
  activeChapterId,
  deletingChapterId,
  isPersistingOrder,
  onAddChapter,
  onDeleteChapter,
  onSelectChapter,
  onReorderChapters,
  onSelectionComplete,
}: ChapterPanelProps) {
  const [mode, setMode] = useState<ChapterPanelMode>("browse")

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const chapterIds = useMemo(() => chapters.map((chapter) => chapter.id), [chapters])

  const handleDragEnd = (event: DragEndEvent) => {
    const activeId = String(event.active.id)
    const overId = event.over ? String(event.over.id) : null

    if (!overId || activeId === overId) {
      return
    }

    const fromIndex = chapters.findIndex((chapter) => chapter.id === activeId)
    const toIndex = chapters.findIndex((chapter) => chapter.id === overId)
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
      return
    }

    const orderedChapterIds = arrayMove(chapterIds, fromIndex, toIndex)
    onReorderChapters(orderedChapterIds)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="space-y-1">
          <h2 className="text-sm font-medium text-foreground">Chapters</h2>
          <p className="text-xs text-muted-foreground">
            {mode === "browse"
              ? "Open a chapter to edit it, or switch to reorder mode."
              : isPersistingOrder
                ? "Saving chapter order..."
                : "Drag rows to reorder. Changes save when you drop."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {mode === "browse" ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMode("reorder")}
                className="h-8"
              >
                Reorder
              </Button>
              <Button variant="ghost" size="icon" onClick={onAddChapter} className="h-8 w-8">
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add chapter</span>
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="h-8"
              onClick={() => setMode("browse")}
            >
              <Check className="mr-2 h-4 w-4" />
              Done
            </Button>
          )}
        </div>
      </div>

      <Separator />

      <div className="flex-1 overflow-y-auto p-2">
        {mode === "browse" ? (
          <div className="space-y-2">
            {chapters.map((chapter, index) => (
              <BrowseChapterRow
                key={chapter.id}
                chapter={chapter}
                index={index}
                isActive={chapter.id === activeChapterId}
                isDeleting={chapters.length <= 1 || deletingChapterId === chapter.id}
                onSelect={() => {
                  onSelectChapter(chapter.id)
                  onSelectionComplete?.()
                }}
                onDelete={() => onDeleteChapter(chapter.id)}
              />
            ))}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={chapterIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {chapters.map((chapter, index) => (
                  <ReorderChapterRow
                    key={chapter.id}
                    chapter={chapter}
                    index={index}
                    isActive={chapter.id === activeChapterId}
                    isPersistingOrder={isPersistingOrder}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}
