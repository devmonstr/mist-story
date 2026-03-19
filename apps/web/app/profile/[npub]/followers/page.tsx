'use client'

import Link from 'next/link'
import { use, useEffect, useState } from 'react'
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from '@/components/ui/button'
import { fetchProfileFollowers } from '@/lib/api'
import { truncateNpub } from '@/lib/nostr-utils'
import type { ProfileConnectionsResponse } from '@mist/shared'
import { Loader2, Users } from 'lucide-react'

export default function FollowersPage({ params }: { params: Promise<{ npub: string }> }) {
  const { npub } = use(params)
  const [data, setData] = useState<ProfileConnectionsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadFollowers = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const payload = await fetchProfileFollowers(npub)
        setData(payload)
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : 'Failed to load followers'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    void loadFollowers()
  }, [npub])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
      <div className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-foreground" />
            <h1 className="font-serif text-3xl font-bold text-foreground">Followers</h1>
          </div>
          <p className="mt-2 text-muted-foreground">
            {data?.users.length ?? 0} followers
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="border border-destructive/30 bg-card p-6 text-destructive">
            {error}
          </div>
        ) : !data || data.users.length === 0 ? (
          <div className="border border-border/40 bg-card p-8 text-center text-muted-foreground">
            This profile does not have followers yet.
          </div>
        ) : (
          <div className="space-y-4">
            {data.users.map((follower) => (
              <article
                key={follower.id}
                className="flex flex-col gap-4 border border-border/40 bg-card p-6 transition-all hover:border-border/80 hover:shadow-sm sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex-1">
                  <h3 className="font-serif text-lg font-semibold text-foreground">
                    <Link href={`/profile/${follower.npub}`} className="hover:underline">
                      {follower.displayName ?? truncateNpub(follower.npub, 10)}
                    </Link>
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {follower.about ?? 'No bio yet.'}
                  </p>
                  <div className="mt-3 flex gap-6 text-sm text-muted-foreground">
                    <span>Following {follower.following.toLocaleString()}</span>
                    <span>{follower.novels.toLocaleString()} novels</span>
                  </div>
                </div>

                <div className="flex gap-2 sm:flex-col">
                  <Button variant="outline" className="flex-1" asChild>
                    <Link href={`/profile/${follower.npub}`}>View Profile</Link>
                  </Button>
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
