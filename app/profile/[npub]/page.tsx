'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Heart, Share2, BookOpen, Users } from 'lucide-react'
import { useAuth } from '@/context/auth-context'

export default function ProfilePage({ params }: { params: { npub: string } }) {
  const { user } = useAuth()
  const isOwnProfile = user?.npub === params.npub

  // Sample author data
  const author = {
    npub: params.npub,
    name: 'Sarah Mitchell',
    bio: 'Storyteller exploring themes of identity, love, and transformation. Coffee enthusiast and night owl.',
    location: 'Portland, Oregon',
    joinedDate: 'January 2024',
    stats: {
      novels: 4,
      followers: 1243,
      following: 187,
      reads: 45320,
    },
    novels: [
      {
        id: '1',
        title: 'The Forgotten Kingdom',
        genre: 'Fantasy',
        chapters: 24,
        status: 'published',
        reads: 12400,
        likes: 1203,
      },
      {
        id: '2',
        title: 'Echoes of Tomorrow',
        genre: 'Science Fiction',
        chapters: 18,
        status: 'publishing',
        reads: 8900,
        likes: 892,
      },
      {
        id: '3',
        title: 'Between Worlds',
        genre: 'Literary Fiction',
        chapters: 12,
        status: 'published',
        reads: 5320,
        likes: 621,
      },
      {
        id: '4',
        title: 'Untitled Project',
        genre: 'Fantasy',
        chapters: 3,
        status: 'draft',
        reads: 0,
        likes: 0,
      },
    ],
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <h1 className="font-serif text-4xl font-bold text-foreground">{author.name}</h1>
              <p className="mt-2 text-muted-foreground">{author.location}</p>
              <p className="mt-4 text-base text-foreground leading-relaxed">{author.bio}</p>
              <p className="mt-3 text-sm text-muted-foreground">Joined {author.joinedDate}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              {isOwnProfile ? (
                <>
                  <Button asChild>
                    <Link href="/settings">Edit Profile</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/studio">My Studio</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button>Follow</Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div>
              <div className="text-2xl font-semibold text-foreground">{author.stats.novels}</div>
              <div className="text-sm text-muted-foreground">Novels</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-foreground">
                <Link href={`/profile/${author.npub}/followers`} className="hover:underline">
                  {author.stats.followers.toLocaleString()}
                </Link>
              </div>
              <div className="text-sm text-muted-foreground">Followers</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-foreground">
                <Link href="/following" className="hover:underline">
                  {author.stats.following}
                </Link>
              </div>
              <div className="text-sm text-muted-foreground">Following</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-foreground">{author.stats.reads.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Reads</div>
            </div>
          </div>
        </div>
      </div>

      {/* Novels Section */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="font-serif text-2xl font-bold text-foreground mb-8">Novels</h2>

        <div className="space-y-4">
          {author.novels.map((novel) => (
            <article
              key={novel.id}
              className="flex flex-col gap-4 border border-border/40 bg-card p-6 transition-all hover:border-border/80 hover:shadow-sm sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex-1">
                <div className="flex items-start gap-3">
                  <h3 className="font-serif text-lg font-semibold text-foreground">
                    <Link href={`/novel/${novel.id}`} className="hover:underline">
                      {novel.title}
                    </Link>
                  </h3>
                  <span
                    className={`mt-1 whitespace-nowrap rounded px-2 py-1 text-xs font-medium ${
                      novel.status === 'published'
                        ? 'bg-primary/10 text-primary'
                        : novel.status === 'publishing'
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-border text-foreground/60'
                    }`}
                  >
                    {novel.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{novel.genre}</p>
                <p className="mt-1 text-sm text-muted-foreground">{novel.chapters} chapters</p>
              </div>

              <div className="flex flex-col gap-2 text-right sm:items-end">
                <div className="flex items-center justify-end gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {novel.reads.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {novel.likes.toLocaleString()}
                  </span>
                </div>
                {novel.status !== 'draft' && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/novel/${novel.id}`}>Read</Link>
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
