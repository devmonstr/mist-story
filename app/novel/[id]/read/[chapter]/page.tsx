'use client'

import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  BookOpen,
  Home,
  List,
  Moon,
  Sun,
  Minus,
  Plus,
  Coffee
} from "lucide-react"
import Link from "next/link"
import { use, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

// Sample chapter content
const chapterContent: Record<string, {
  novelTitle: string
  chapterNumber: number
  chapterTitle: string
  content: string[]
  prevChapter: number | null
  nextChapter: number | null
}> = {
  "1-1": {
    novelTitle: "The Forgotten Kingdom",
    chapterNumber: 1,
    chapterTitle: "The Discovery",
    content: [
      "The Royal Archives smelled of aged parchment and forgotten secrets. Elara had always found comfort in this scent—a mixture of dust and possibility that seemed to whisper of adventures long past and mysteries waiting to be uncovered.",
      "She adjusted the single candle on her desk, its flame casting dancing shadows across the towering shelves that surrounded her workspace. The archives were nearly empty at this hour, most of the other archivists having retired for the evening. But Elara preferred it this way. There was something sacred about being alone with the kingdom's memories.",
      "Tonight, she was cataloging a shipment of manuscripts recently recovered from the abandoned monastery in the Northern Reaches. Most were mundane—accounting ledgers, prayer schedules, the daily minutiae of monastic life. But as she reached for the final scroll in the collection, her fingers brushed against leather instead of parchment.",
      "Hidden beneath the scrolls lay a book, its cover bound in leather so dark it seemed to absorb the candlelight. Elara's breath caught in her throat. In her three years as a junior archivist, she had never seen anything like it.",
      "The book had no title, no author's name, no indication of its contents. Only a symbol embossed in the center of the cover—a circle containing what appeared to be a tree, its branches reaching upward while its roots descended into an intricate pattern of interlocking shapes.",
      "She knew she should report it immediately. Protocol demanded that all unusual findings be brought to the Chief Archivist before examination. But something about the book called to her, a pull so strong it felt almost physical.",
      "With trembling hands, Elara opened the cover.",
      "The first page was blank, as was the second, and the third. Her initial excitement began to fade. Perhaps this was simply an unused journal, its pages waiting for words that never came.",
      "But as she turned to the fourth page, something changed. The candlelight seemed to brighten momentarily, and words began to appear on the previously empty surface, forming themselves as if written by an invisible hand.",
      "\"To the one who seeks truth in shadows,\" the words read, \"welcome to the beginning of the end—and the end of the beginning.\"",
      "Elara's heart hammered against her ribs. This was impossible. Magic had been forbidden in the kingdom for over three centuries, ever since the Great Sundering that had nearly torn the realm apart. Anyone found practicing the arcane arts faced immediate execution.",
      "Yet here, in her hands, was proof that magic had not truly died. It had merely been sleeping, waiting for someone to wake it.",
      "She should put the book back. She should pretend she never found it. She should—",
      "\"I see you've found my journal.\"",
      "Elara spun around, nearly knocking over her candle. Standing in the archive doorway was an old woman she had never seen before, dressed in the gray robes of a traveling scholar. Her eyes, however, were anything but ordinary—they gleamed silver in the dim light, like moonlight on still water.",
      "\"Who are you?\" Elara managed to ask, her voice barely above a whisper. \"How did you get in here?\"",
      "The old woman smiled, and in that smile, Elara saw both infinite kindness and terrible knowledge. \"I am the keeper of forgotten things, child. And you—\" she stepped closer, her silver eyes fixed on Elara's face, \"—you are the one we've been waiting for.\"",
      "\"Waiting for? I don't understand.\"",
      "\"No,\" the old woman agreed softly. \"Not yet. But you will.\" She reached out and gently closed the book in Elara's hands. \"Keep it safe. Guard it well. When the time comes, it will show you what you need to know.\"",
      "\"When what time comes? What do you mean?\"",
      "But when Elara looked up, the old woman was gone. The archive was empty, silent except for the distant sound of the night watch making their rounds.",
      "Elara stood frozen for a long moment, the mysterious book clutched to her chest. She knew, with a certainty that defied logic, that her life had just changed irrevocably. Whatever this book contained, whatever the old woman's cryptic words meant, there was no going back.",
      "She tucked the book inside her satchel and began the long walk back to her quarters, unaware that far to the north, in the shadow of the Elderwood Mountains, something ancient was stirring from its long slumber.",
      "The Forgotten Kingdom was beginning to remember.",
    ],
    prevChapter: null,
    nextChapter: 2,
  },
  "1-2": {
    novelTitle: "The Forgotten Kingdom",
    chapterNumber: 2,
    chapterTitle: "Whispers in the Archives",
    content: [
      "Three days had passed since Elara's strange encounter in the archives, and she had barely slept. Every night, she would light a single candle in her small chamber and open the mysterious book, watching as new words appeared on its pages.",
      "The book seemed to have a will of its own, revealing its secrets in fragments—a passage here about ancient wards and protections, a diagram there showing symbols she didn't recognize. But each morning, when she tried to read what she had seen the night before, the pages would be blank again, as if the knowledge existed only in moments of discovery.",
      "\"You look terrible,\" remarked Aldric, her fellow junior archivist, as they cataloged a new shipment of trade records. \"Are you feeling alright?\"",
      "Elara forced a smile. Aldric had been her friend since they were both assigned to the archives as apprentices five years ago. He was kind, reliable, and utterly devoted to following rules. She couldn't tell him about the book.",
      "\"Just trouble sleeping,\" she said, which was technically true. \"I'll be fine.\"",
      "But she wasn't fine, and she knew it. The book's words had begun to echo in her dreams, filling her nights with visions of a kingdom that no longer existed—or perhaps had never existed in quite the way the histories described.",
      "In her dreams, she walked through halls of crystal and light, spoke with beings made of starfire and shadow, and heard a name repeated over and over like a prayer: Valdris. The Forgotten Kingdom.",
      "\"Elara?\" Aldric's voice pulled her back to the present. \"You've been staring at that same page for ten minutes.\"",
      "She looked down at the trade record in her hands, seeing nothing but squiggles on parchment. \"Sorry. I was thinking.\"",
      "\"About what?\"",
      "For a moment, she considered telling him everything. But the old woman's words echoed in her mind: keep it safe, guard it well. Until she understood what was happening, she needed to keep her secrets close.",
      "\"Nothing important,\" she lied. \"Just daydreaming.\"",
    ],
    prevChapter: 1,
    nextChapter: 3,
  },
}

// Chapters list for navigation
const chapters = [
  { id: 1, title: "The Discovery" },
  { id: 2, title: "Whispers in the Archives" },
  { id: 3, title: "The Awakening" },
  { id: 4, title: "Shadows of the Past" },
  { id: 5, title: "The Disgraced Knight" },
  { id: 6, title: "Secrets Unveiled" },
  { id: 7, title: "The Journey Begins" },
  { id: 8, title: "Into the Elderwood" },
  { id: 9, title: "The Ancient Temple" },
  { id: 10, title: "Bonds of Trust" },
]

export default function ReadPage({
  params
}: {
  params: Promise<{ id: string; chapter: string }>
}) {
  const { id, chapter } = use(params)
  const [fontSize, setFontSize] = useState(18)
  const [readerTheme, setReaderTheme] = useState<'light' | 'dark' | 'sepia'>('light')
  const [isChapterListOpen, setIsChapterListOpen] = useState(false)

  const contentKey = `${id}-${chapter}`
  const chapterData = chapterContent[contentKey] || chapterContent["1-1"]

  const adjustFontSize = (delta: number) => {
    setFontSize((prev) => Math.min(Math.max(prev + delta, 14), 24))
  }

  // Theme styles
  const themeStyles = {
    light: {
      bg: 'bg-background text-foreground',
      header: 'border-border/40 bg-background/95',
      sheet: '',
      sheetText: '',
      mutedText: 'text-muted-foreground',
      border: 'bg-border',
      icon: 'text-muted-foreground/50',
      contentText: 'text-foreground/90',
    },
    dark: {
      bg: 'bg-[#1a1a1a] text-[#e0e0e0]',
      header: 'border-[#333] bg-[#1a1a1a]/95',
      sheet: 'bg-[#1a1a1a] text-[#e0e0e0] border-[#333]',
      sheetText: 'text-[#e0e0e0]',
      mutedText: 'text-[#888]',
      border: 'bg-[#333]',
      icon: 'text-[#555]',
      contentText: 'text-[#d0d0d0]',
    },
    sepia: {
      bg: 'bg-[#f4ecd8] text-[#5b4636]',
      header: 'border-[#d4c4a8] bg-[#f4ecd8]/95',
      sheet: 'bg-[#f4ecd8] text-[#5b4636] border-[#d4c4a8]',
      sheetText: 'text-[#5b4636]',
      mutedText: 'text-[#8b7355]',
      border: 'bg-[#d4c4a8]',
      icon: 'text-[#a89880]',
      contentText: 'text-[#433422]',
    },
  }

  const theme = themeStyles[readerTheme]

  return (
    <div className={`min-h-screen transition-colors ${theme.bg}`}>
      {/* Top Navigation */}
      <header className={`sticky top-0 z-50 border-b ${theme.header} backdrop-blur-sm`}>
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/novel/${id}`}>
                <ChevronLeft className="h-5 w-5" />
                <span className="sr-only">Back to novel</span>
              </Link>
            </Button>
            <div className="hidden sm:block">
              <p className="text-sm font-medium line-clamp-1">{chapterData.novelTitle}</p>
              <p className={`text-xs ${theme.mutedText}`}>Chapter {chapterData.chapterNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Chapter List */}
            <Sheet open={isChapterListOpen} onOpenChange={setIsChapterListOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <List className="h-5 w-5" />
                  <span className="sr-only">Chapter list</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className={theme.sheet}>
                <SheetHeader>
                  <SheetTitle className={theme.sheetText}>Chapters</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-1">
                  {chapters.map((ch) => (
                    <Link
                      key={ch.id}
                      href={`/novel/${id}/read/${ch.id}`}
                      onClick={() => setIsChapterListOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        ch.id === parseInt(chapter)
                          ? readerTheme === 'light'
                            ? 'bg-muted text-foreground'
                            : 'bg-[#333] text-white'
                          : theme.mutedText + ' hover:opacity-80'
                      }`}
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded text-xs font-medium">
                        {ch.id}
                      </span>
                      <span className="line-clamp-1">{ch.title}</span>
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>

            {/* Settings */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Reading settings</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className={theme.sheet}>
                <SheetHeader>
                  <SheetTitle className={theme.sheetText}>Reading Settings</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6 px-2">
                  {/* Font Size */}
                  <div>
                    <label className="text-sm font-medium">Font Size</label>
                    <div className="mt-3 flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => adjustFontSize(-2)}
                        disabled={fontSize <= 14}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center text-sm">{fontSize}px</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => adjustFontSize(2)}
                        disabled={fontSize >= 24}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Theme */}
                  <div>
                    <label className="text-sm font-medium">Theme</label>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        variant={readerTheme === 'light' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setReaderTheme('light')}
                      >
                        <Sun className="mr-2 h-4 w-4" />
                        Light
                      </Button>
                      <Button
                        variant={readerTheme === 'dark' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setReaderTheme('dark')}
                      >
                        <Moon className="mr-2 h-4 w-4" />
                        Dark
                      </Button>
                      <Button
                        variant={readerTheme === 'sepia' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setReaderTheme('sepia')}
                      >
                        <Coffee className="mr-2 h-4 w-4" />
                        Sepia
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Home */}
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <Home className="h-5 w-5" />
                <span className="sr-only">Home</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Chapter Content */}
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Chapter Header */}
        <header className="mb-12 text-center">
          <p className={`text-sm ${theme.mutedText}`}>
            Chapter {chapterData.chapterNumber}
          </p>
          <h1 className="mt-2 font-serif text-3xl font-light tracking-tight sm:text-4xl">
            {chapterData.chapterTitle}
          </h1>
        </header>

        {/* Content */}
        <article
          className="prose prose-neutral max-w-none"
          style={{ fontSize: `${fontSize}px` }}
        >
          {chapterData.content.map((paragraph, index) => (
            <p
              key={index}
              className={`mb-6 leading-relaxed ${theme.contentText}`}
              style={{ lineHeight: '1.8' }}
            >
              {paragraph}
            </p>
          ))}
        </article>

        {/* Chapter End Decoration */}
        <div className="mt-16 flex justify-center">
          <div className="flex items-center gap-3">
            <span className={`h-px w-12 ${theme.border}`} />
            <BookOpen className={`h-5 w-5 ${theme.icon}`} />
            <span className={`h-px w-12 ${theme.border}`} />
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <footer className={`sticky bottom-0 border-t ${theme.header} backdrop-blur-sm`}>
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          {chapterData.prevChapter ? (
            <Button variant="ghost" asChild>
              <Link href={`/novel/${id}/read/${chapterData.prevChapter}`}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Link>
            </Button>
          ) : (
            <div />
          )}

          <span className={`text-sm ${theme.mutedText}`}>
            {chapterData.chapterNumber} / {chapters.length}
          </span>

          {chapterData.nextChapter ? (
            <Button variant="ghost" asChild>
              <Link href={`/novel/${id}/read/${chapterData.nextChapter}`}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" asChild>
              <Link href={`/novel/${id}`}>
                Finish
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}
