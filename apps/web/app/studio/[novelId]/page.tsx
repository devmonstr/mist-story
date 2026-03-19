"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
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
  Quote,
  Redo,
  Save,
  Settings,
  Trash2,
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
  fetchNovel,
  fetchNovelChapters,
  updateChapter,
} from "@/lib/api"
import { mapChapterToEditorChapter, type EditorChapter } from "@/lib/studio"

interface EditorNovel {
  id: string
  title: string
  description: string
  chapters: EditorChapter[]
}

export default function NovelEditorPage() {
  const { user, isLoading, isAuthenticated } = useRequireAuth()
  const params = useParams()
  const novelId = params.novelId as string
  const editorRef = useRef<HTMLDivElement>(null)
  const [novel, setNovel] = useState<EditorNovel | null>(null)
  const [activeChapterId, setActiveChapterId] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!user) return

    const loadEditor = async () => {
      try {
        const [novelData, chapters] = await Promise.all([
          fetchNovel(novelId),
          fetchNovelChapters(novelId),
        ])

        const mappedChapters = chapters.map(mapChapterToEditorChapter)
        setNovel({
          id: novelData.id,
          title: novelData.title,
          description: novelData.summary,
          chapters: mappedChapters,
        })
        setActiveChapterId(mappedChapters[0]?.id || "")
      } catch (error) {
        console.error("Failed to load editor:", error)
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

  const handleContentChange = () => {
    if (!editorRef.current || !activeChapter) return

    const content = editorRef.current.innerHTML
    const wordCount = editorRef.current.innerText
      .trim()
      .split(/\s+/)
      .filter(Boolean).length

    setNovel((current) => {
      if (!current) return current
      return {
        ...current,
        chapters: current.chapters.map((chapter) =>
          chapter.id === activeChapterId
            ? {
                ...chapter,
                content,
                wordCount,
                lastEdited: new Date().toISOString(),
              }
            : chapter
        ),
      }
    })
  }

  const handleSave = useCallback(async () => {
    if (!activeChapter) return

    try {
      setIsSaving(true)
      await updateChapter(activeChapter.id, {
        title: activeChapter.title,
        contentDraft: activeChapter.content,
      })
      setLastSaved(new Date())
    } catch (error) {
      console.error("Failed to save chapter:", error)
    } finally {
      setIsSaving(false)
    }
  }, [activeChapter])

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
    }
  }

  const deleteChapterLocally = (chapterId: string) => {
    setNovel((current) => {
      if (!current || current.chapters.length <= 1) return current
      const nextChapters = current.chapters.filter((chapter) => chapter.id !== chapterId)
      if (chapterId === activeChapterId) {
        setActiveChapterId(nextChapters[0]?.id || "")
      }
      return {
        ...current,
        chapters: nextChapters,
      }
    })
  }

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
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
            className={`group flex items-center gap-2 rounded-sm px-2 py-2 transition-colors ${
              chapter.id === activeChapterId ? "bg-muted" : "hover:bg-muted/50"
            }`}
          >
            <GripVertical className="h-4 w-4 shrink-0 cursor-move text-muted-foreground/50" />
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
                  onClick={() => deleteChapterLocally(chapter.id)}
                  disabled={novel.chapters.length <= 1}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove from view
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
          {activeChapter ? (
            <>
              <div className="shrink-0 border-b border-border/40 px-4 py-3 sm:px-8">
                <input
                  type="text"
                  value={activeChapter.title}
                  onChange={(event) => {
                    setNovel((current) =>
                      current
                        ? {
                            ...current,
                            chapters: current.chapters.map((chapter) =>
                              chapter.id === activeChapter.id
                                ? { ...chapter, title: event.target.value }
                                : chapter
                            ),
                          }
                        : current
                    )
                  }}
                  className="w-full bg-transparent font-serif text-xl font-medium text-foreground placeholder:text-muted-foreground focus:outline-none sm:text-2xl"
                  placeholder="Chapter title..."
                />
                <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{activeChapter.wordCount.toLocaleString()} words</span>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-border/40 px-4 py-2 sm:px-8">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand("undo")}>
                  <Undo className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand("redo")}>
                  <Redo className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="mx-1 h-6" />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand("formatBlock", "<h1>")}>
                  <Heading1 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand("formatBlock", "<h2>")}>
                  <Heading2 className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="mx-1 h-6" />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand("bold")}>
                  <Bold className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand("italic")}>
                  <Italic className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand("underline")}>
                  <Underline className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="mx-1 h-6" />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand("insertUnorderedList")}>
                  <List className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand("insertOrderedList")}>
                  <ListOrdered className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand("formatBlock", "<blockquote>")}>
                  <Quote className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />
                <Button variant="ghost" size="icon" className="hidden h-8 w-8 sm:flex" onClick={() => execCommand("justifyLeft")}>
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="hidden h-8 w-8 sm:flex" onClick={() => execCommand("justifyCenter")}>
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="hidden h-8 w-8 sm:flex" onClick={() => execCommand("justifyRight")}>
                  <AlignRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-8">
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleContentChange}
                    className="prose prose-neutral min-h-[60vh] max-w-none font-serif text-base leading-relaxed focus:outline-none sm:text-lg [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_h1]:font-serif [&_h1]:text-2xl [&_h1]:font-medium [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-medium [&_p]:my-4"
                    dangerouslySetInnerHTML={{ __html: activeChapter.content }}
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
