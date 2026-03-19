"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Bold,
  Check,
  Eye,
  FileText,
  GripVertical,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Menu,
  MoreVertical,
  Plus,
  Rocket,
  Quote,
  Redo,
  Save,
  Settings,
  Trash2,
  Type,
  Underline,
  Undo,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useRequireAuth } from "@/hooks/use-require-auth"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  createChapter,
  deleteChapter,
  fetchNovel,
  fetchNovelChapters,
  publishChapter,
  reorderChapters,
  updateChapter,
} from "@/lib/api"
import {
  mapChapterToEditorChapter,
  type EditorNovel,
} from "@/lib/studio"
import { resolveNovelCoverSrc } from "@/lib/novel-cover"

function getPlainTextFromHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

interface ToolbarButtonProps {
  icon: LucideIcon
  label: string
  onExecute: () => void
  className?: string
}

function ToolbarButton({
  icon: Icon,
  label,
  onExecute,
  className,
}: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className ?? "h-8 w-8"}
      onMouseDown={(event) => {
        event.preventDefault()
        onExecute()
      }}
    >
      <Icon className="h-4 w-4" />
      <span className="sr-only">{label}</span>
    </Button>
  )
}

export default function NovelEditorPage() {
  const { user, isLoading, isAuthenticated } = useRequireAuth()
  const params = useParams()
  const novelId = params.novelId as string
  const editorRef = useRef<HTMLDivElement>(null)
  const [novel, setNovel] = useState<EditorNovel | null>(null)
  const [activeChapterId, setActiveChapterId] = useState("")
  const [chapterDrafts, setChapterDrafts] = useState<
    Record<
      string,
      {
        title: string
        content: string
        wordCount: number
      }
    >
  >({})
  const [draftTitle, setDraftTitle] = useState("")
  const [draftContent, setDraftContent] = useState("<p>Start writing...</p>")
  const [draftWordCount, setDraftWordCount] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isReordering, setIsReordering] = useState(false)
  const [deletingChapterId, setDeletingChapterId] = useState<string | null>(null)
  const [draggedChapterId, setDraggedChapterId] = useState<string | null>(null)
  const [dragOverChapterId, setDragOverChapterId] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [publishMessage, setPublishMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const loadEditor = async () => {
      try {
        setErrorMessage(null)
        const [novelData, chapters] = await Promise.all([
          fetchNovel(novelId),
          fetchNovelChapters(novelId),
        ])

        const mappedChapters = chapters.map(mapChapterToEditorChapter)
        setNovel({
          id: novelData.id,
          title: novelData.title,
          description: novelData.summary,
          coverImage: resolveNovelCoverSrc({
            novelId: novelData.id,
            coverUrl: novelData.coverUrl,
            coverStorageKey: novelData.coverStorageKey,
          }),
          visibility: novelData.visibility,
          workType: novelData.workType,
          status: novelData.status,
          chapters: mappedChapters,
        })
        setActiveChapterId(mappedChapters[0]?.id || "")
      } catch (error) {
        console.error("Failed to load editor:", error)
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "We could not load this novel editor right now."
        )
      } finally {
        setIsLoaded(true)
      }
    }

    void loadEditor()
  }, [novelId, user])

  const activeChapter = useMemo(
    () => novel?.chapters.find((chapter) => chapter.id === activeChapterId) ?? null,
    [activeChapterId, novel]
  )

  useEffect(() => {
    if (!activeChapter) return

    const draft = chapterDrafts[activeChapter.id]
    const nextTitle = draft?.title ?? activeChapter.title
    const nextContent =
      draft?.content ?? activeChapter.content ?? "<p>Start writing...</p>"
    const nextWordCount = draft?.wordCount ?? activeChapter.wordCount

    setDraftTitle(nextTitle)
    setDraftContent(nextContent)
    setDraftWordCount(nextWordCount)

    if (editorRef.current) {
      editorRef.current.innerHTML = nextContent
    }
  }, [activeChapterId])

  const handleContentChange = () => {
    if (!editorRef.current || !activeChapter) return

    const content = editorRef.current.innerHTML
    const wordCount = editorRef.current.innerText
      .trim()
      .split(/\s+/)
      .filter(Boolean).length

    setDraftContent(content)
    setDraftWordCount(wordCount)
    setChapterDrafts((current) => ({
      ...current,
      [activeChapter.id]: {
        title: draftTitle,
        content,
        wordCount,
      },
    }))
  }

  const handleSave = useCallback(async () => {
    if (!activeChapter) return

    try {
      setIsSaving(true)
      setErrorMessage(null)
      await updateChapter(activeChapter.id, {
        title: draftTitle,
        contentDraft: draftContent,
      })
      setLastSaved(new Date())
      setNovel((current) => {
        if (!current) return current
        return {
          ...current,
          chapters: current.chapters.map((chapter) =>
            chapter.id === activeChapter.id
              ? {
                  ...chapter,
                  title: draftTitle,
                  content: draftContent,
                  wordCount: draftWordCount,
                  lastEdited: new Date().toISOString(),
                }
              : chapter
          ),
        }
      })
      setChapterDrafts((current) => {
        const next = { ...current }
        delete next[activeChapter.id]
        return next
      })
      return true
    } catch (error) {
      console.error("Failed to save chapter:", error)
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save the current chapter."
      )
      return false
    } finally {
      setIsSaving(false)
    }
  }, [activeChapter, draftContent, draftTitle, draftWordCount])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault()
        void handleSave()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleSave])

  const addNewChapter = async () => {
    if (!novel) return

    try {
      setErrorMessage(null)
      const created = await createChapter(novel.id, {
        title: `Chapter ${novel.chapters.length + 1}`,
        note: "",
        contentDraft: "<p>Start writing...</p>",
      })

      const editorChapter = mapChapterToEditorChapter(created)
      setNovel((current) =>
        current
          ? {
              ...current,
              chapters: [...current.chapters, editorChapter],
            }
          : current
      )
      setActiveChapterId(editorChapter.id)
    } catch (error) {
      console.error("Failed to create chapter:", error)
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to create a new chapter."
      )
    }
  }

  const handleDeleteChapter = async (chapterId: string) => {
    if (!novel || novel.chapters.length <= 1) return

    try {
      setDeletingChapterId(chapterId)
      setErrorMessage(null)
      await deleteChapter(chapterId)
      setNovel((current) => {
        if (!current) return current
        const nextChapters = current.chapters.filter((chapter) => chapter.id !== chapterId)
        if (chapterId === activeChapterId) {
          setActiveChapterId(nextChapters[0]?.id || "")
        }
        return {
          ...current,
          chapters: nextChapters,
        }
      })
    } catch (error) {
      console.error("Failed to delete chapter:", error)
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete this chapter."
      )
    } finally {
      setDeletingChapterId(null)
    }
  }

  const handleReorderChapters = async (targetChapterId: string) => {
    if (!novel || !draggedChapterId || draggedChapterId === targetChapterId) {
      setDraggedChapterId(null)
      setDragOverChapterId(null)
      return
    }

    const fromIndex = novel.chapters.findIndex((chapter) => chapter.id === draggedChapterId)
    const toIndex = novel.chapters.findIndex((chapter) => chapter.id === targetChapterId)
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
      setDraggedChapterId(null)
      setDragOverChapterId(null)
      return
    }

    const reorderedChapters = [...novel.chapters]
    const [movedChapter] = reorderedChapters.splice(fromIndex, 1)
    reorderedChapters.splice(toIndex, 0, movedChapter)

    setNovel((current) =>
      current
        ? {
            ...current,
            chapters: reorderedChapters,
          }
        : current
    )
    setDraggedChapterId(null)
    setDragOverChapterId(null)

    try {
      setIsReordering(true)
      setErrorMessage(null)
      const chapters = await reorderChapters(novel.id, {
        orderedChapterIds: reorderedChapters.map((chapter) => chapter.id),
      })

      setNovel((current) =>
        current
          ? {
              ...current,
              chapters: chapters.map(mapChapterToEditorChapter),
            }
          : current
      )
    } catch (error) {
      console.error("Failed to reorder chapters:", error)
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to reorder chapters."
      )

      const freshChapters = await fetchNovelChapters(novel.id).catch(() => null)
      if (freshChapters) {
        setNovel((current) =>
          current
            ? {
                ...current,
                chapters: freshChapters.map(mapChapterToEditorChapter),
              }
            : current
        )
      }
    } finally {
      setIsReordering(false)
    }
  }

  const handlePublish = async () => {
    if (!activeChapter) return

    try {
      setIsPublishing(true)
      setErrorMessage(null)
      setPublishMessage(null)
      const didSave = await handleSave()
      if (!didSave) {
        return
      }
      const previewText = getPlainTextFromHtml(draftContent).slice(0, 280)
      await publishChapter(activeChapter.id, { previewText })
      setPublishMessage(
        "Publish job queued. The worker will update the chapter status after relay delivery succeeds."
      )
    } catch (error) {
      console.error("Failed to publish chapter:", error)
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to queue this chapter for publish."
      )
    } finally {
      setIsPublishing(false)
    }
  }

  const execCommand = (command: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    handleContentChange()
  }

  const formatBlock = (tag: "p" | "h1" | "h2" | "blockquote") => {
    execCommand("formatBlock", `<${tag}>`)
  }

  if (isLoading || !isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated || !novel) return null

  const ChaptersList = ({ onSelect }: { onSelect?: () => void }) => (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-sm font-medium text-foreground">Chapters</h2>
        <Button variant="ghost" size="icon" onClick={() => void addNewChapter()} className="h-8 w-8">
          <Plus className="h-4 w-4" />
          <span className="sr-only">Add chapter</span>
        </Button>
      </div>
      <Separator />
      <div className="flex-1 overflow-y-auto p-2">
        {novel.chapters.map((chapter, index) => (
          <div
            key={chapter.id}
            onDragOver={(event) => {
              event.preventDefault()
              if (draggedChapterId && draggedChapterId !== chapter.id) {
                setDragOverChapterId(chapter.id)
              }
            }}
            onDrop={(event) => {
              event.preventDefault()
              void handleReorderChapters(chapter.id)
            }}
            onDragEnd={() => {
              setDraggedChapterId(null)
              setDragOverChapterId(null)
            }}
            className={`group flex items-center gap-2 rounded-sm px-2 py-2 transition-colors ${
              chapter.id === activeChapterId
                ? "bg-muted"
                : dragOverChapterId === chapter.id
                  ? "bg-muted/70"
                  : "hover:bg-muted/50"
            }`}
          >
            <button
              type="button"
              draggable={!isReordering}
              onDragStart={() => {
                setDraggedChapterId(chapter.id)
                setDragOverChapterId(chapter.id)
              }}
              className="shrink-0 rounded-sm p-1 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed"
              disabled={isReordering}
              aria-label={`Reorder ${chapter.title}`}
            >
              <GripVertical className="h-4 w-4 cursor-grab" />
            </button>
            <button
              onClick={() => {
                setActiveChapterId(chapter.id)
                onSelect?.()
              }}
              className="flex flex-1 items-center gap-2 text-left"
            >
              <span className="text-xs text-muted-foreground">{index + 1}.</span>
              <span className="flex-1 truncate text-sm">{chapter.title}</span>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setActiveChapterId(chapter.id)}>
                  Open
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => void handleDeleteChapter(chapter.id)}
                  disabled={novel.chapters.length <= 1 || deletingChapterId === chapter.id}
                >
                  {deletingChapterId === chapter.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete chapter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/40 px-4">
        <div className="flex items-center gap-3">
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Chapters</SheetTitle>
              <ChaptersList onSelect={() => setIsSidebarOpen(false)} />
            </SheetContent>
          </Sheet>

          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link href="/studio">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to Studio</span>
            </Link>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex flex-col">
            <h1 className="line-clamp-1 text-sm font-medium text-foreground">{novel.title}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {isSaving ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </span>
              ) : lastSaved ? (
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Saved
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => void handleSave()} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Save</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void handlePublish()} disabled={isSaving || isPublishing}>
            {isPublishing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="mr-2 h-4 w-4" />
            )}
            <span className="hidden sm:inline">Publish</span>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/novel/${novelId}`}>
              <Eye className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Preview</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/studio/${novelId}/settings`}>
              <Settings className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-64 shrink-0 border-r border-border/40 lg:block">
          <ChaptersList />
        </aside>

        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-border/40 bg-muted/20 px-4 py-3 sm:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                {novel.coverImage ? (
                  <img
                    src={novel.coverImage}
                    alt={`${novel.title} cover`}
                    className="h-20 w-14 rounded-lg border border-border/60 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-14 items-center justify-center rounded-lg border border-dashed border-border/60 bg-background text-[10px] uppercase tracking-wide text-muted-foreground">
                    No cover
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-border/60 bg-background px-2.5 py-1 text-[11px] font-medium text-foreground">
                      {novel.workType === "TRANSLATION" ? "Translation" : "Original"}
                    </span>
                    <span className="rounded-full border border-border/60 bg-background px-2.5 py-1 text-[11px] font-medium text-foreground">
                      {novel.visibility === "PUBLISHED" ? "Visible" : "Private draft"}
                    </span>
                    <span className="rounded-full border border-border/60 bg-background px-2.5 py-1 text-[11px] font-medium text-foreground">
                      {novel.status === "Completed" ? "Completed" : "Ongoing"}
                    </span>
                  </div>
                  <p className="max-w-2xl text-sm text-muted-foreground">
                    {novel.description || "Add a synopsis in settings to give your writing desk more context."}
                  </p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                {novel.chapters.length} chapter{novel.chapters.length === 1 ? "" : "s"}
                {isReordering ? " • Reordering..." : ""}
              </div>
            </div>
            {errorMessage ? (
              <div className="mt-3 rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}
            {publishMessage ? (
              <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
                {publishMessage}
              </div>
            ) : null}
          </div>

          {activeChapter ? (
            <>
              <div className="shrink-0 border-b border-border/40 px-4 py-3 sm:px-8">
                <input
                  type="text"
                  value={draftTitle}
                  onChange={(event) => {
                    const nextTitle = event.target.value
                    setDraftTitle(nextTitle)
                    if (!activeChapter) return
                    setChapterDrafts((current) => ({
                      ...current,
                      [activeChapter.id]: {
                        title: nextTitle,
                        content: draftContent,
                        wordCount: draftWordCount,
                      },
                    }))
                  }}
                  className="w-full bg-transparent font-serif text-xl font-medium text-foreground placeholder:text-muted-foreground focus:outline-none sm:text-2xl"
                  placeholder="Chapter title..."
                />
                <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{draftWordCount.toLocaleString()} words</span>
                  <span>{activeChapter.status === "PUBLISHED" ? "Published" : "Draft"}</span>
                  {activeChapter.publishedAt ? (
                    <span>
                      Last published {new Date(activeChapter.publishedAt).toLocaleString()}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-border/40 px-4 py-2 sm:px-8">
                <ToolbarButton icon={Undo} label="Undo" onExecute={() => execCommand("undo")} />
                <ToolbarButton icon={Redo} label="Redo" onExecute={() => execCommand("redo")} />
                <Separator orientation="vertical" className="mx-1 h-6" />
                <ToolbarButton
                  icon={Type}
                  label="Default paragraph"
                  onExecute={() => formatBlock("p")}
                />
                <ToolbarButton
                  icon={Heading1}
                  label="Heading 1"
                  onExecute={() => formatBlock("h1")}
                />
                <ToolbarButton
                  icon={Heading2}
                  label="Heading 2"
                  onExecute={() => formatBlock("h2")}
                />
                <Separator orientation="vertical" className="mx-1 h-6" />
                <ToolbarButton icon={Bold} label="Bold" onExecute={() => execCommand("bold")} />
                <ToolbarButton
                  icon={Italic}
                  label="Italic"
                  onExecute={() => execCommand("italic")}
                />
                <ToolbarButton
                  icon={Underline}
                  label="Underline"
                  onExecute={() => execCommand("underline")}
                />
                <Separator orientation="vertical" className="mx-1 h-6" />
                <ToolbarButton
                  icon={List}
                  label="Bullet list"
                  onExecute={() => execCommand("insertUnorderedList")}
                />
                <ToolbarButton
                  icon={ListOrdered}
                  label="Numbered list"
                  onExecute={() => execCommand("insertOrderedList")}
                />
                <ToolbarButton
                  icon={Quote}
                  label="Block quote"
                  onExecute={() => formatBlock("blockquote")}
                />
                <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />
                <ToolbarButton
                  icon={AlignLeft}
                  label="Align left"
                  className="hidden h-8 w-8 sm:flex"
                  onExecute={() => execCommand("justifyLeft")}
                />
                <ToolbarButton
                  icon={AlignCenter}
                  label="Align center"
                  className="hidden h-8 w-8 sm:flex"
                  onExecute={() => execCommand("justifyCenter")}
                />
                <ToolbarButton
                  icon={AlignRight}
                  label="Align right"
                  className="hidden h-8 w-8 sm:flex"
                  onExecute={() => execCommand("justifyRight")}
                />
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-8">
                  <div
                    ref={editorRef}
                    contentEditable
                    dir="ltr"
                    spellCheck
                    suppressContentEditableWarning
                    onInput={handleContentChange}
                    className="prose prose-neutral min-h-[60vh] max-w-none font-serif text-base leading-relaxed focus:outline-none sm:text-lg [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_h1]:font-serif [&_h1]:text-2xl [&_h1]:font-medium [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-medium [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:my-1"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 font-serif text-lg font-medium text-foreground">
                  No chapter selected
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Select a chapter from the sidebar or create a new one
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
