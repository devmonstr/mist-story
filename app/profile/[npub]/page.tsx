'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Heart, Share2, BookOpen, Users, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { fetchProfile, npubToHex, truncateNpub } from '@/lib/nostr-utils'
import type { NostrProfile } from '@/lib/nostr-types'

export default function ProfilePage({ params }: { params: Promise<{ npub: string }> }) {
  const { npub } = use(params)
  const { user } = useAuth()
  const isOwnProfile = user?.npub === npub

  const [profile, setProfile] = useState<NostrProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const author = {
    npub,
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

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true)
      setError(null)

      const pubkey = npubToHex(npub)
      if (!pubkey) {
        setError('Invalid npub format')
        setIsLoading(false)
        return
      }

      // First check if we already have the profile from auth context
      if (isOwnProfile && user?.profile) {
        setProfile(user.profile)
        setIsLoading(false)
        return
      }

      // Fetch from relay
      const fetchedProfile = await fetchProfile(pubkey)
      if (fetchedProfile) {
        setProfile(fetchedProfile)
      } else {
        // Profile not found, use empty profile
        setProfile({})
      }
      setIsLoading(false)
    }

    loadProfile()
  }, [npub, isOwnProfile, user?.profile])

  // Display name logic
  const displayName = profile?.display_name || profile?.name || truncateNpub(npub, 10)
  const handle = profile?.nip05 || truncateNpub(npub, 16)

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
      {/* Banner */}
      {profile?.banner && (
        <div className="h-48 w-full bg-muted overflow-hidden">
          <img
            src={profile.banner}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Header Section */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              {profile?.picture ? (
                <img
                  src={profile.picture}
                  alt={displayName}
                  className="h-20 w-20 rounded-full object-cover border-2 border-background shadow-sm -mt-12 sm:-mt-16"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted border-2 border-background shadow-sm -mt-12 sm:-mt-16">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 pt-2">
                <h1 className="font-serif text-2xl font-bold text-foreground sm:text-4xl">{displayName}</h1>
                {profile?.nip05 && (
                  <p className="text-sm text-muted-foreground">@{profile.nip05}</p>
                )}
                {profile?.about && (
                  <p className="mt-3 text-base text-foreground leading-relaxed">{profile.about}</p>
                )}
                {profile?.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm text-primary hover:underline"
                  >
                    {profile.website}
                  </a>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 sm:flex-row">
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
      </main>
      <Footer />
    </div>
  )
}
