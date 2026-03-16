'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Bookmark, Trash2, Share2 } from 'lucide-react'
import { useState } from 'react'

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([
    {
      id: '1',
      title: 'The Forgotten Kingdom',
      author: 'Sarah Mitchell',
      genre: 'Fantasy',
      description: 'An epic tale of kingdoms at war, lost magic, and the prophecy that could change everything.',
      chapters: 24,
      reads: 12400,
      savedDate: 'March 10, 2026',
      progress: 45,
    },
    {
      id: '2',
      title: 'Echoes of Tomorrow',
      author: 'James Chen',
      genre: 'Science Fiction',
      description: 'In a world where memories can be bought and sold, one woman discovers a truth worth dying for.',
      chapters: 18,
      reads: 8900,
      savedDate: 'March 5, 2026',
      progress: 62,
    },
    {
      id: '3',
      title: 'Between Worlds',
      author: 'Elena Rodriguez',
      genre: 'Literary Fiction',
      description: 'A haunting exploration of family, identity, and the spaces we inhabit.',
      chapters: 12,
      reads: 5320,
      savedDate: 'February 28, 2026',
      progress: 0,
    },
    {
      id: '4',
      title: 'Starlight Chronicles',
      author: 'Marcus Williams',
      genre: 'Fantasy',
      description: 'Adventure across distant galaxies and the heroes who dare to explore them.',
      chapters: 31,
      reads: 18700,
      savedDate: 'February 20, 2026',
      progress: 8,
    },
  ])

  const handleRemove = (id: string) => {
    setBookmarks(bookmarks.filter((b) => b.id !== id))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <Bookmark className="h-8 w-8 text-foreground" />
            <h1 className="font-serif text-3xl font-bold text-foreground">My Bookmarks</h1>
          </div>
          <p className="text-muted-foreground">
            {bookmarks.length} saved {bookmarks.length === 1 ? 'novel' : 'novels'}
          </p>
        </div>
      </div>

      {/* Bookmarks List */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {bookmarks.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-serif text-xl font-semibold text-foreground mb-2">No bookmarks yet</h3>
            <p className="text-muted-foreground mb-6">Start exploring and bookmark your favorite novels to read later</p>
            <Button asChild>
              <Link href="/library">Browse Library</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookmarks.map((novel) => (
              <article
                key={novel.id}
                className="flex flex-col gap-4 border border-border/40 bg-card p-6 transition-all hover:border-border/80 hover:shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-2 mb-2">
                      <h3 className="font-serif text-lg font-semibold text-foreground">
                        <Link href={`/novel/${novel.id}`} className="hover:underline">
                          {novel.title}
                        </Link>
                      </h3>
                      <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-1 rounded whitespace-nowrap">
                        {novel.genre}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">By {novel.author}</p>
                    <p className="text-sm text-foreground leading-relaxed mb-3">{novel.description}</p>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                      <span>{novel.chapters} chapters</span>
                      <span>{novel.reads.toLocaleString()} reads</span>
                      <span>Saved {novel.savedDate}</span>
                    </div>

                    {/* Reading Progress */}
                    {novel.progress > 0 && (
                      <div className="w-full">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-muted-foreground">Reading Progress</span>
                          <span className="text-xs font-medium text-foreground">{novel.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${novel.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 sm:flex-col sm:items-end">
                    <Button size="sm" asChild>
                      <Link href={`/novel/${novel.id}/read/1`}>
                        {novel.progress > 0 ? 'Continue Reading' : 'Start Reading'}
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemove(novel.id)}
                      title="Remove from bookmarks"
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
    </div>
  )
}
