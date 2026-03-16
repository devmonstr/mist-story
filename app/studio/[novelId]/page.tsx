"use client"

import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
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
  ArrowLeft,
  Save,
  Eye,
  Settings,
  Plus,
  MoreVertical,
  Trash2,
  GripVertical,
  FileText,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Menu,
  Check,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState, useCallback, useRef } from "react"

interface Chapter {
  id: string
  title: string
  content: string
  wordCount: number
  lastEdited: string
}

// Sample novel data
const SAMPLE_NOVEL = {
  id: "1",
  title: "The Forgotten Kingdom",
  description: "A tale of magic and mystery in a world where kingdoms have fallen to darkness.",
  status: "published" as const,
  chapters: [
    {
      id: "ch1",
      title: "The Beginning",
      content: `<p>The ancient walls of the kingdom stood silent against the grey morning sky. Elena pressed her hand against the cold stone, feeling centuries of history beneath her fingertips.</p>

<p>"You shouldn't be here," a voice called from the shadows.</p>

<p>She didn't turn. She knew that voice—had known it since childhood, when they would play among these very ruins, pretending to be the knights and queens of old.</p>

<p>"Neither should you, Marcus," she replied, finally looking over her shoulder.</p>

<p>He stepped into the pale light, his dark cloak swirling around him like smoke. The years had changed him—hardened the softness from his face, replaced the easy smile with a guarded expression. But his eyes, those storm-grey eyes, remained the same.</p>

<p>"The council is looking for you," he said.</p>

<p>"Let them look."</p>

<p>Elena turned back to the wall, tracing the ancient runes carved into the stone. They had been here for a thousand years, maybe more, and still no one had deciphered their meaning. But she was close—she could feel it.</p>`,
      wordCount: 3450,
      lastEdited: "2026-03-15T10:30:00Z",
    },
    {
      id: "ch2",
      title: "Shadows and Secrets",
      content: `<p>The library of the old kingdom was said to hold every secret ever whispered in the land. Elena had spent countless hours here, poring over ancient texts and forgotten manuscripts.</p>

<p>But tonight was different. Tonight, she had found something.</p>`,
      wordCount: 4200,
      lastEdited: "2026-03-14T16:45:00Z",
    },
    {
      id: "ch3",
      title: "The Council's Decision",
      content: `<p>Dawn came too quickly. Elena had spent the entire night transcribing the runes, and her eyes burned from the strain.</p>`,
      wordCount: 3800,
      lastEdited: "2026-03-10T09:15:00Z",
    },
  ],
}

export default function NovelEditorPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const novelId = params.novelId as string

  const [novel, setNovel] = useState(SAMPLE_NOVEL)
  const [activeChapterId, setActiveChapterId] = useState<string>(
    SAMPLE_NOVEL.chapters[0]?.id || ""
  )
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(new Date())
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  const activeChapter = novel.chapters.find((ch) => ch.id === activeChapterId)

  // Redirect if not signed in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/sign-in")
    }
  }, [user, isLoading, router])

  // Auto-save simulation
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    // Simulate save delay
    await new Promise((resolve) => setTimeout(resolve, 800))
    setLastSaved(new Date())
    setIsSaving(false)
  }, [])

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        handleSave()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleSave])

  const handleContentChange = () => {
    if (!editorRef.current || !activeChapter) return

    const content = editorRef.current.innerHTML
    const wordCount = editorRef.current.innerText
      .trim()
      .split(/\s+/)
      .filter(Boolean).length

    setNovel((prev) => ({
      ...prev,
      chapters: prev.chapters.map((ch) =>
        ch.id === activeChapterId
          ? { ...ch, content, wordCount, lastEdited: new Date().toISOString() }
          : ch
      ),
    }))
  }

  const addChapter = () => {
    const newChapter: Chapter = {
      id: `ch${Date.now()}`,
      title: `Chapter ${novel.chapters.length + 1}`,
      content: "<p>Start writing...</p>",
      wordCount: 0,
      lastEdited: new Date().toISOString(),
    }

    setNovel((prev) => ({
      ...prev,
      chapters: [...prev.chapters, newChapter],
    }))
    setActiveChapterId(newChapter.id)
  }

  const deleteChapter = (chapterId: string) => {
    if (novel.chapters.length <= 1) return

    const chapterIndex = novel.chapters.findIndex((ch) => ch.id === chapterId)
    const newChapters = novel.chapters.filter((ch) => ch.id !== chapterId)

    setNovel((prev) => ({
      ...prev,
      chapters: newChapters,
    }))

    // Select adjacent chapter
    if (activeChapterId === chapterId) {
      const newIndex = Math.min(chapterIndex, newChapters.length - 1)
      setActiveChapterId(newChapters[newIndex]?.id || "")
    }
  }

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const ChaptersList = ({ onSelect }: { onSelect?: () => void }) => (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-sm font-medium text-foreground">Chapters</h2>
        <Button variant="ghost" size="icon" onClick={addChapter} className="h-8 w-8">
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
              chapter.id === activeChapterId
                ? "bg-muted"
                : "hover:bg-muted/50"
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Rename</DropdownMenuItem>
                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => deleteChapter(chapter.id)}
                  disabled={novel.chapters.length <= 1}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
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
      {/* Top Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/40 px-4">
        <div className="flex items-center gap-3">
          {/* Mobile sidebar trigger */}
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
            <h1 className="text-sm font-medium text-foreground line-clamp-1">
              {novel.title}
            </h1>
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
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Save</span>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/novel/${novelId}`}>
              <Eye className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Preview</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Desktop */}
        <aside className="hidden w-64 shrink-0 border-r border-border/40 lg:block">
          <ChaptersList />
        </aside>

        {/* Editor */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {activeChapter ? (
            <>
              {/* Chapter Title */}
              <div className="shrink-0 border-b border-border/40 px-4 py-3 sm:px-8">
                <input
                  type="text"
                  value={activeChapter.title}
                  onChange={(e) => {
                    setNovel((prev) => ({
                      ...prev,
                      chapters: prev.chapters.map((ch) =>
                        ch.id === activeChapterId
                          ? { ...ch, title: e.target.value }
                          : ch
                      ),
                    }))
                  }}
                  className="w-full bg-transparent font-serif text-xl font-medium text-foreground placeholder:text-muted-foreground focus:outline-none sm:text-2xl"
                  placeholder="Chapter title..."
                />
                <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{activeChapter.wordCount.toLocaleString()} words</span>
                </div>
              </div>

              {/* Formatting Toolbar */}
              <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-border/40 px-4 py-2 sm:px-8">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => execCommand("undo")}
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => execCommand("redo")}
                >
                  <Redo className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="mx-1 h-6" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => execCommand("formatBlock", "<h1>")}
                >
                  <Heading1 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => execCommand("formatBlock", "<h2>")}
                >
                  <Heading2 className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="mx-1 h-6" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => execCommand("bold")}
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => execCommand("italic")}
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => execCommand("underline")}
                >
                  <Underline className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="mx-1 h-6" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => execCommand("insertUnorderedList")}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => execCommand("insertOrderedList")}
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => execCommand("formatBlock", "<blockquote>")}
                >
                  <Quote className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="mx-1 h-6 hidden sm:block" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hidden sm:flex"
                  onClick={() => execCommand("justifyLeft")}
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hidden sm:flex"
                  onClick={() => execCommand("justifyCenter")}
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hidden sm:flex"
                  onClick={() => execCommand("justifyRight")}
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Content Editor */}
              <div className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-8">
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleContentChange}
                    className="prose prose-neutral min-h-[60vh] max-w-none font-serif text-base leading-relaxed focus:outline-none sm:text-lg [&_p]:my-4 [&_h1]:font-serif [&_h1]:text-2xl [&_h1]:font-medium [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-medium [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground"
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
                <Button onClick={addChapter} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Chapter
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
