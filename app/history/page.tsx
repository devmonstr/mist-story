'use client'

import Link from 'next/link'
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from '@/components/ui/button'
import { Clock, Trash2 } from 'lucide-react'
import { useState } from 'react'

export default function HistoryPage() {
  const [history, setHistory] = useState([
    {
      id: '1',
      title: 'The Forgotten Kingdom',
      author: 'Sarah Mitchell',
      currentChapter: 12,
      totalChapters: 24,
      chapterTitle: 'The Fall of the Eastern Gate',
      lastRead: 'Today, 2:30 PM',
      lastReadDate: 'March 15, 2026',
      progress: 50,
    },
    {
      id: '2',
      title: 'Echoes of Tomorrow',
      author: 'James Chen',
      currentChapter: 8,
      totalChapters: 18,
      chapterTitle: 'Memories for Sale',
      lastRead: 'Yesterday, 10:15 PM',
      lastReadDate: 'March 14, 2026',
      progress: 44,
    },
    {
      id: '3',
      title: 'Between Worlds',
      author: 'Elena Rodriguez',
      currentChapter: 1,
      totalChapters: 12,
      chapterTitle: 'Prologue: The Last Letter',
      lastRead: 'March 12, 2026',
      lastReadDate: 'March 12, 2026',
      progress: 8,
    },
    {
      id: '4',
      title: 'Starlight Chronicles',
      author: 'Marcus Williams',
      currentChapter: 3,
      totalChapters: 31,
      chapterTitle: 'First Contact',
      lastRead: 'March 10, 2026',
      lastReadDate: 'March 10, 2026',
      progress: 10,
    },
    {
      id: '5',
      title: 'The Lost Archive',
      author: 'Priya Patel',
      currentChapter: 15,
      totalChapters: 20,
      chapterTitle: 'Secrets in the Dust',
      lastRead: 'March 8, 2026',
      lastReadDate: 'March 8, 2026',
      progress: 75,
    },
  ])

  const handleRemove = (id: string) => {
    setHistory(history.filter((h) => h.id !== id))
  }

  const handleClearAll = () => {
    setHistory([])
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-foreground" />
              <h1 className="font-serif text-3xl font-bold text-foreground">Reading History</h1>
            </div>
            {history.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleClearAll}>
                Clear All
              </Button>
            )}
          </div>
          <p className="text-muted-foreground">
            {history.length} {history.length === 1 ? 'novel' : 'novels'} in progress
          </p>
        </div>
      </div>

      {/* History List */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {history.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-serif text-xl font-semibold text-foreground mb-2">No reading history</h3>
            <p className="text-muted-foreground mb-6">Start reading novels to build your reading history</p>
            <Button asChild>
              <Link href="/library">Browse Library</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <article
                key={item.id}
                className="flex flex-col gap-4 border border-border/40 bg-card p-6 transition-all hover:border-border/80 hover:shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="mb-2">
                      <h3 className="font-serif text-lg font-semibold text-foreground">
                        <Link href={`/novel/${item.id}`} className="hover:underline">
                          {item.title}
                        </Link>
                      </h3>
                      <p className="text-sm text-muted-foreground">By {item.author}</p>
                    </div>

                    <div className="my-3 border-l-2 border-muted-foreground/30 pl-3">
                      <p className="text-sm font-medium text-foreground">
                        Chapter {item.currentChapter}: {item.chapterTitle}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Last read {item.lastRead}
                      </p>
                    </div>

                    {/* Reading Progress */}
                    <div className="w-full">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-muted-foreground">
                          Chapter {item.currentChapter} of {item.totalChapters}
                        </span>
                        <span className="text-xs font-medium text-foreground">{item.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 sm:flex-col sm:items-end">
                    <Button size="sm" asChild>
                      <Link href={`/novel/${item.id}/read/${item.currentChapter}`}>
                        Continue
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemove(item.id)}
                      title="Remove from history"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      </main>
      <Footer />
    </div>
  )
}
