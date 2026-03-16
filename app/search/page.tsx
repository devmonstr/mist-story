'use client'

import Link from 'next/link'
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from '@/components/ui/button'
import { Search, Filter } from 'lucide-react'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface NovelResult {
  id: string
  type: 'novel'
  title: string
  author: string
  genre: string
  description: string
  reads: number
  chapters: number
}

interface AuthorResult {
  id: string
  type: 'author'
  name: string
  bio: string
  followers: number
  novels: number
}

type SearchResult = NovelResult | AuthorResult

function SearchContent() {
  const searchParams = useSearchParams()
  const queryParam = searchParams.get('q') || ''
  const [query, setQuery] = useState(queryParam)
  const [results, setResults] = useState<any[]>([])
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('relevance')

  // Sample data
  const allResults: SearchResult[] = [
    {
      id: '1',
      type: 'novel',
      title: 'The Forgotten Kingdom',
      author: 'Sarah Mitchell',
      genre: 'Fantasy',
      description: 'An epic tale of kingdoms at war, lost magic, and the prophecy that could change everything.',
      reads: 12400,
      chapters: 24,
    },
    {
      id: '2',
      type: 'novel',
      title: 'Echoes of Tomorrow',
      author: 'James Chen',
      genre: 'Science Fiction',
      description: 'In a world where memories can be bought and sold, one woman discovers a truth worth dying for.',
      reads: 8900,
      chapters: 18,
    },
    {
      id: '3',
      type: 'novel',
      title: 'Between Worlds',
      author: 'Elena Rodriguez',
      genre: 'Literary Fiction',
      description: 'A haunting exploration of family, identity, and the spaces we inhabit.',
      reads: 5320,
      chapters: 12,
    },
    {
      id: '4',
      type: 'author',
      name: 'Sarah Mitchell',
      bio: 'Storyteller exploring themes of identity, love, and transformation.',
      followers: 1243,
      novels: 4,
    },
    {
      id: '5',
      type: 'author',
      name: 'James Chen',
      bio: 'Science fiction author exploring futures where technology meets humanity.',
      followers: 892,
      novels: 3,
    },
    {
      id: '6',
      type: 'novel',
      title: 'Starlight Chronicles',
      author: 'Marcus Williams',
      genre: 'Fantasy',
      description: 'Adventure across distant galaxies and the heroes who dare to explore them.',
      reads: 18700,
      chapters: 31,
    },
  ]

  useEffect(() => {
    if (!query) {
      setResults([])
      return
    }

    const filtered = allResults.filter((item) => {
      const searchLower = query.toLowerCase()
      if (item.type === 'novel') {
        return (
          item.title.toLowerCase().includes(searchLower) ||
          item.author.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower)
        )
      } else {
        return (
          item.name.toLowerCase().includes(searchLower) ||
          item.bio.toLowerCase().includes(searchLower)
        )
      }
    })

    const typeFiltered =
      filterType === 'all'
        ? filtered
        : filtered.filter((r) => r.type === filterType)

    const sorted = typeFiltered.sort((a, b) => {
      if (sortBy === 'relevance') return 0
      if (sortBy === 'popular') {
        const aReads = a.type === 'novel' ? a.reads : a.followers
        const bReads = b.type === 'novel' ? b.reads : b.followers
        return bReads - aReads
      }
      return 0
    })

    setResults(sorted)
  }, [query, filterType, sortBy])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
      {/* Search Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <Search className="h-6 w-6 text-foreground" />
            <h1 className="font-serif text-2xl font-bold text-foreground">Search Results</h1>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search novels, authors, genres..."
                className="w-full px-4 py-3 border border-border rounded bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </div>
      </div>

      {/* Filters and Results */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {query && results.length > 0 && (
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
            </p>

            <div className="flex gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-border rounded bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Results</option>
                  <option value="novel">Novels</option>
                  <option value="author">Authors</option>
                </select>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-border rounded bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="relevance">Relevance</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="space-y-4">
          {query && results.length === 0 ? (
            <div className="text-center py-12">
              <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                No results found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or browse our library
              </p>
            </div>
          ) : !query ? (
            <div className="text-center py-12">
              <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                Start searching
              </h3>
              <p className="text-muted-foreground mb-6">
                Search for novels, authors, or genres to get started
              </p>
              <Button asChild>
                <Link href="/library">Browse Library</Link>
              </Button>
            </div>
          ) : (
            results.map((result) => (
              <article
                key={result.id}
                className="flex flex-col gap-4 border border-border/40 bg-card p-6 transition-all hover:border-border/80 hover:shadow-sm sm:flex-row sm:items-start sm:justify-between"
              >
                {result.type === 'novel' ? (
                  <>
                    <div className="flex-1">
                      <h3 className="font-serif text-lg font-semibold text-foreground mb-1">
                        <Link href={`/novel/${result.id}`} className="hover:underline">
                          {result.title}
                        </Link>
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        by{' '}
                        <Link
                          href={`/profile/author-${result.author}`}
                          className="hover:underline"
                        >
                          {result.author}
                        </Link>
                      </p>
                      <p className="text-sm text-foreground leading-relaxed mb-3">
                        {result.description}
                      </p>
                      <div className="flex gap-6 text-sm text-muted-foreground">
                        <span>{result.genre}</span>
                        <span>{result.chapters} chapters</span>
                        <span>{result.reads.toLocaleString()} reads</span>
                      </div>
                    </div>
                    <div className="flex gap-2 sm:flex-col">
                      <Button asChild className="flex-1">
                        <Link href={`/novel/${result.id}`}>Read</Link>
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-1">
                      <h3 className="font-serif text-lg font-semibold text-foreground mb-2">
                        <Link href={`/profile/author-${result.name}`} className="hover:underline">
                          {result.name}
                        </Link>
                      </h3>
                      <p className="text-sm text-foreground leading-relaxed mb-3">
                        {result.bio}
                      </p>
                      <div className="flex gap-6 text-sm text-muted-foreground">
                        <span>{result.followers.toLocaleString()} followers</span>
                        <span>{result.novels} novels</span>
                      </div>
                    </div>
                    <div className="flex gap-2 sm:flex-col">
                      <Button variant="outline" asChild className="flex-1">
                        <Link href={`/profile/author-${result.name}`}>
                          View Profile
                        </Link>
                      </Button>
                    </div>
                  </>
                )}
              </article>
            ))
          )}
        </div>
      </div>
      </main>
      <Footer />
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchContent />
    </Suspense>
  )
}

function SearchLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background flex items-center justify-center">
        <div className="text-center">
          <Search className="mx-auto h-8 w-8 text-muted-foreground animate-pulse" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
