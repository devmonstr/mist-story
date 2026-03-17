'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Users } from 'lucide-react'
import { useState } from 'react'
import { use } from 'react'
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

interface Following {
  npub: string
  name: string
  bio: string
  followers: number
  novels: number
}

export default function FollowingPage({ params }: { params: Promise<{ npub: string }> }) {
  const { npub } = use(params)
  
  const [following] = useState<Following[]>([
    {
      npub: 'nprofile1qqsrxje...',
      name: 'Eleanor Chen',
      bio: 'Science fiction author exploring futures where technology meets humanity.',
      followers: 2103,
      novels: 5,
    },
    {
      npub: 'nprofile2qqstyx...',
      name: 'Marcus Williams',
      bio: 'Contemporary fiction and personal essays about identity and belonging.',
      followers: 1540,
      novels: 3,
    },
    {
      npub: 'nprofile3qqsabc...',
      name: 'Priya Patel',
      bio: 'Fantasy worldbuilder and creative writing mentor.',
      followers: 892,
      novels: 4,
    },
    {
      npub: 'nprofile4qqsdef...',
      name: 'James Turner',
      bio: 'Mystery and thriller author. New chapter every Thursday.',
      followers: 1203,
      novels: 6,
    },
    {
      npub: 'nprofile5qqsghi...',
      name: 'Sofia Russo',
      bio: 'Historical fiction enthusiast and romance writer.',
      followers: 651,
      novels: 2,
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
            <h1 className="font-serif text-3xl font-bold text-foreground">Following</h1>
          </div>
          <p className="mt-2 text-muted-foreground">{following.length} authors</p>
        </div>
      </div>

      {/* Following List */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-4">
          {following.map((author) => (
            <article
              key={author.npub}
              className="flex flex-col gap-4 border border-border/40 bg-card p-6 transition-all hover:border-border/80 hover:shadow-sm sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex-1">
                <h3 className="font-serif text-lg font-semibold text-foreground">
                  <Link href={`/profile/${author.npub}`} className="hover:underline">
                    {author.name}
                  </Link>
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{author.bio}</p>
                <div className="mt-3 flex gap-6 text-sm text-muted-foreground">
                  <span>{author.novels} novels</span>
                  <span>{author.followers.toLocaleString()} followers</span>
                </div>
              </div>

              <div className="flex gap-2 sm:flex-col">
                <Button variant="outline" className="flex-1" asChild>
                  <Link href={`/profile/${author.npub}`}>View Profile</Link>
                </Button>
                <Button variant="outline" size="sm">
                  Unfollow
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
