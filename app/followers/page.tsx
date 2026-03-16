'use client'

import Link from 'next/link'
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from '@/components/ui/button'
import { Users } from 'lucide-react'
import { useState } from 'react'

export default function FollowersPage() {
  const [followers] = useState([
    {
      npub: 'nprofile1qqsrxje...',
      name: 'Alex Johnson',
      bio: 'Voracious reader of all genres. Supporting independent authors.',
      following: 34,
      readingList: 12,
    },
    {
      npub: 'nprofile2qqstyx...',
      name: 'Jessica Lee',
      bio: 'Fantasy lover and aspiring author. Always looking for the next great story.',
      following: 28,
      readingList: 18,
    },
    {
      npub: 'nprofile3qqsabc...',
      name: 'David Brown',
      bio: 'Tech professional by day, fiction reader by night.',
      following: 19,
      readingList: 8,
    },
    {
      npub: 'nprofile4qqsdef...',
      name: 'Rachel Green',
      bio: 'Book club organizer and community builder.',
      following: 45,
      readingList: 24,
    },
    {
      npub: 'nprofile5qqsghi...',
      name: 'Michael Torres',
      bio: 'Literary fiction enthusiast exploring diverse voices.',
      following: 52,
      readingList: 31,
    },
  ])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-foreground" />
            <h1 className="font-serif text-3xl font-bold text-foreground">Followers</h1>
          </div>
          <p className="mt-2 text-muted-foreground">{followers.length} followers</p>
        </div>
      </div>

      {/* Followers List */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-4">
          {followers.map((follower) => (
            <article
              key={follower.npub}
              className="flex flex-col gap-4 border border-border/40 bg-card p-6 transition-all hover:border-border/80 hover:shadow-sm sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex-1">
                <h3 className="font-serif text-lg font-semibold text-foreground">
                  <Link href={`/profile/${follower.npub}`} className="hover:underline">
                    {follower.name}
                  </Link>
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{follower.bio}</p>
                <div className="mt-3 flex gap-6 text-sm text-muted-foreground">
                  <span>Following {follower.following}</span>
                  <span>{follower.readingList} in reading list</span>
                </div>
              </div>

              <div className="flex gap-2 sm:flex-col">
                <Button variant="outline" className="flex-1" asChild>
                  <Link href={`/profile/${follower.npub}`}>View Profile</Link>
                </Button>
                <Button variant="outline" size="sm">
                  Message
                </Button>
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
