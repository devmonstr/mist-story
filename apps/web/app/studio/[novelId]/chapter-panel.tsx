"use client"

import { useEffect, useMemo, useState } from "react"
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
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Loader2,
  MoreVertical,
  Plus,
  Trash2,
} from "lucide-react"
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
import type { EditorChapter, EditorChapterList } from "@/lib/studio"

type ChapterPanelMode = "browse" | "reorder"

interface ChapterPanelProps {
  chapters: EditorChapter[]
  chapterList: EditorChapterList | null
  activeChapterId: string
  deletingChapterId: string | null
  isLoadingPage: boolean
  isPersistingOrder: boolean
  onAddChapter: () => void
  onDeleteChapter: (chapterId: string) => void
  onSelectChapter: (chapterId: string) => void
  onOpenChapterPage: (page: number) => void
  onReorderChapters: (orderedChapterIds: string[]) => void
  onSelectionComplete?: () => void
}

interface BrowseChapterRowProps {
  chapter: EditorChapter
  displayNumber: number
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

function getGroupRange(page: number, pageSize: number, totalChapters: number) {
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalChapters)
  return { start, end }
}

function ChapterStatusBadge({ status }: { status: EditorChapter["status"] }) {
  return (
    <Badge
      variant={status === "PUBLISHED" ? "outline" : "secondary"}
      className="h-5 rounded-none px-1.5 text-[10px] font-medium"
    >
      {status === "PUBLISHED" ? "Published" : "Draft"}
    </Badge>
  )
}

function BrowseChapterRow({
  chapter,
  displayNumber,
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
      className={`group flex items-center gap-3 border border-transparent px-3 py-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        isActive
          ? "border-primary/25 bg-accent/35"
          : "hover:border-border/50"
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-none border text-xs font-medium ${
          isActive
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border/70 text-muted-foreground"
        }`}
      >
        {displayNumber.toLocaleString()}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={`truncate text-sm font-medium ${
              isActive ? "text-primary" : "text-foreground"
            }`}
          >
            {chapter.title}
          </p>
          {isActive ? (
            <Badge
              variant="default"
              className="hidden h-5 rounded-none px-1.5 text-[10px] sm:inline-flex"
            >
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
      className={`touch-none border border-transparent px-3 py-2.5 transition-colors ${
        isDragging
          ? "z-10 border-border shadow-sm"
          : isActive
            ? "border-primary/25 bg-accent/35"
            : "hover:border-border/50"
      } ${isPersistingOrder ? "cursor-progress opacity-70" : "cursor-grab active:cursor-grabbing"}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-none border text-xs font-medium ${
            isActive
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border/70 text-muted-foreground"
          }`}
        >
          {(index + 1).toLocaleString()}
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-none border border-dashed border-border/80 text-muted-foreground">
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              className={`truncate text-sm font-medium ${
                isActive ? "text-primary" : "text-foreground"
              }`}
            >
              {chapter.title}
            </p>
            {isActive ? (
              <Badge
                variant="default"
                className="hidden h-5 rounded-none px-1.5 text-[10px] sm:inline-flex"
              >
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
  chapterList,
  activeChapterId,
  deletingChapterId,
  isLoadingPage,
  isPersistingOrder,
  onAddChapter,
  onDeleteChapter,
  onSelectChapter,
  onOpenChapterPage,
  onReorderChapters,
  onSelectionComplete,
}: ChapterPanelProps) {
  const [mode, setMode] = useState<ChapterPanelMode>("browse")
  const [openGroup, setOpenGroup] = useState(
    chapterList ? `group-${chapterList.currentPage}` : ""
  )

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

  useEffect(() => {
    if (!chapterList) return
    setOpenGroup(`group-${chapterList.currentPage}`)
  }, [chapterList])

  const totalChapters = chapterList?.totalChapters ?? chapters.length
  const reorderChapters = useMemo(() => chapters, [chapters])
  const chapterIds = useMemo(
    () => reorderChapters.map((chapter) => chapter.id),
    [reorderChapters]
  )
  const groups = useMemo(() => {
    if (!chapterList) {
      return []
    }

    return Array.from({ length: chapterList.totalPages }, (_, index) => {
      const page = index + 1
      return {
        page,
        key: `group-${page}`,
        ...getGroupRange(page, chapterList.pageSize, chapterList.totalChapters),
      }
    })
  }, [chapterList])

  const handleDragEnd = (event: DragEndEvent) => {
    const activeId = String(event.active.id)
    const overId = event.over ? String(event.over.id) : null

    if (!overId || activeId === overId) {
      return
    }

    const fromIndex = reorderChapters.findIndex((chapter) => chapter.id === activeId)
    const toIndex = reorderChapters.findIndex((chapter) => chapter.id === overId)
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
      return
    }

    const orderedChapterIds = arrayMove(chapterIds, fromIndex, toIndex)
    onReorderChapters(orderedChapterIds)
  }

  const handleEnterReorderMode = () => {
    setMode("reorder")
  }

  const rangeLabel = chapterList
    ? `${chapterList.visibleFrom.toLocaleString()}-${chapterList.visibleTo.toLocaleString()}`
    : "this group"

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/50 px-4 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-[0.01em] text-foreground">
              Chapters
            </h2>
            <Badge variant="outline" className="rounded-none px-2 py-0 text-[10px]">
              {totalChapters.toLocaleString()}
            </Badge>
          </div>
          <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
            {mode === "browse"
              ? "Grouped browse keeps large drafts responsive. Open any range below to focus there."
              : isPersistingOrder
                ? "Saving this chapter group..."
                : `Reordering chapters ${rangeLabel}. Only this loaded group is draggable.`}
          </p>
          {chapterList ? (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Loaded {rangeLabel} of {totalChapters.toLocaleString()} chapters
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex items-center gap-2">
          {mode === "browse" ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEnterReorderMode}
                className="h-9 flex-1 justify-center rounded-none"
                disabled={isLoadingPage || chapters.length <= 1}
              >
                <ArrowUpDown className="mr-2 h-4 w-4" />
                Reorder Group
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={onAddChapter}
                className="h-9 w-9 rounded-none"
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add chapter</span>
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-9 flex-1 rounded-none"
              onClick={() => setMode("browse")}
              disabled={isPersistingOrder}
            >
              <Check className="mr-2 h-4 w-4" />
              Done
            </Button>
          )}
        </div>
      </div>

      <Separator />

      <div className="flex-1 overflow-y-auto px-3 py-2">
        {mode === "browse" ? (
          chapterList && totalChapters > 0 ? (
            <div className="space-y-2.5">
              <p className="px-1 text-[11px] text-muted-foreground">
                {totalChapters.toLocaleString()} chapters total. Only the open group is loaded.
              </p>
              {groups.map((group) => {
                const isCurrentGroup = group.page === chapterList.currentPage
                const isOpen = openGroup === group.key

                return (
                  <div
                    key={group.key}
                    className="overflow-hidden border border-border/50"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (isCurrentGroup) {
                          setOpenGroup((previous) =>
                            previous === group.key ? "" : group.key
                          )
                          return
                        }

                        setOpenGroup(group.key)
                        onOpenChapterPage(group.page)
                      }}
                      className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Chapters {group.start.toLocaleString()}-{group.end.toLocaleString()}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Group {group.page} of {chapterList.totalPages}
                          {isCurrentGroup ? " . Current" : ""}
                        </p>
                      </div>
                      {isCurrentGroup && isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>

                    {isOpen ? (
                      <div className="border-t border-border/40">
                        {isCurrentGroup && !isLoadingPage ? (
                          <>
                            <div className="px-4 py-2.5 text-[11px] text-muted-foreground">
                              Showing loaded chapters{" "}
                              {chapterList.visibleFrom.toLocaleString()}-
                              {chapterList.visibleTo.toLocaleString()} of{" "}
                              {chapterList.totalChapters.toLocaleString()}
                            </div>
                            <div className="space-y-1 px-2 pb-2">
                              {chapters.map((chapter, index) => (
                                <BrowseChapterRow
                                  key={chapter.id}
                                  chapter={chapter}
                                  displayNumber={chapterList.visibleFrom + index}
                                  isActive={chapter.id === activeChapterId}
                                  isDeleting={
                                    totalChapters <= 1 || deletingChapterId === chapter.id
                                  }
                                  onSelect={() => {
                                    onSelectChapter(chapter.id)
                                    onSelectionComplete?.()
                                  }}
                                  onDelete={() => onDeleteChapter(chapter.id)}
                                />
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 px-4 py-5 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading this chapter group...
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ) : isLoadingPage ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading chapters...
            </div>
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
              No chapters yet. Create the first chapter to start writing.
            </div>
          )
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={chapterIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-1.5">
                {chapterList ? (
                  <div className="border border-border/50 px-3 py-2.5 text-[11px] leading-5 text-muted-foreground">
                    Reordering loaded group {rangeLabel}. Open another group to reorder that
                    range.
                  </div>
                ) : null}
                {reorderChapters.map((chapter, index) => (
                  <ReorderChapterRow
                    key={chapter.id}
                    chapter={chapter}
                    index={(chapterList?.visibleFrom ?? 1) + index - 1}
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
