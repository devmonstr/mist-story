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
        </div>
      </div>

      {/* Novels Section - Placeholder for now */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="font-serif text-2xl font-bold text-foreground mb-8">Novels</h2>

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">
            No novels yet. Stories published on Nostr will appear here.
          </p>
          {isOwnProfile && (
            <Button asChild className="mt-4">
              <Link href="/studio">Start Writing</Link>
            </Button>
          )}
        </div>
      </div>
      </main>
      <Footer />
    </div>
  )
}
