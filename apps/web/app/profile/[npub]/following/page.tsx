'use client'

import Link from 'next/link'
import { use, useEffect, useState } from 'react'
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { fetchProfileFollowing, unfollowProfile } from '@/lib/api'
import { truncateNpub } from '@/lib/nostr-utils'
import { useAuth } from '@/context/auth-context'
import type {
  ProfileConnectionsPagination,
  ProfileConnectionsResponse,
} from '@myth/shared'
import { Loader2, Users } from 'lucide-react'

const DEFAULT_PAGE_SIZE = 20

const EMPTY_PAGINATION: ProfileConnectionsPagination = {
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalItems: 0,
  totalPages: 1,
}

export default function FollowingPage({ params }: { params: Promise<{ npub: string }> }) {
  const { npub } = use(params)
  const { user } = useAuth()
  const [data, setData] = useState<ProfileConnectionsResponse | null>(null)
  const [pagination, setPagination] = useState<ProfileConnectionsPagination>(EMPTY_PAGINATION)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingNpub, setPendingNpub] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  useEffect(() => {
    const loadFollowing = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const payload = await fetchProfileFollowing(npub, { page, pageSize })
        setData(payload)
        setPagination(payload.pagination)
        if (payload.pagination.page !== page) {
          setPage(payload.pagination.page)
        }
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : 'Failed to load following'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    void loadFollowing()
  }, [npub, page, pageSize])

  const canManageFollowing = user?.npub === npub

  const handleUnfollow = async (targetNpub: string) => {
    setPendingNpub(targetNpub)

    try {
      await unfollowProfile(targetNpub)
      setData((current) =>
        current
          ? {
              ...current,
              users: current.users.filter((entry) => entry.npub !== targetNpub),
            }
          : current
      )
      setPagination((current) => ({
        ...current,
        totalItems: Math.max(0, current.totalItems - 1),
      }))
    } catch (unfollowError) {
      console.error('Failed to unfollow profile:', unfollowError)
    } finally {
      setPendingNpub(null)
    }
  }

  const visibleFrom = pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1
  const visibleTo =
    pagination.totalItems === 0
      ? 0
      : Math.min(pagination.page * pagination.pageSize, pagination.totalItems)

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
      <div className="border-b border-border">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-foreground" />
            <h1 className="font-serif text-3xl font-bold text-foreground">Following</h1>
          </div>
          <p className="mt-2 text-muted-foreground">
            {pagination.totalItems} authors
          </p>
          <div className="mt-6 flex flex-col gap-3 border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {visibleFrom}-{visibleTo} of {pagination.totalItems}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Page size
                </span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => {
                    setPageSize(Number(value))
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50].map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} / {pagination.totalPages}
              </div>
            </div>
          </div>
        </div>
      </div>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
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
            This profile is not following anyone yet.
          </div>
        ) : (
          <div className="space-y-4">
            {data.users.map((author) => (
              <article
                key={author.id}
                className="flex flex-col gap-4 border border-border/40 bg-card p-6 transition-all hover:border-border/80 hover:shadow-sm sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex-1">
                  <h3 className="font-serif text-lg font-semibold text-foreground">
                    <Link href={`/profile/${author.npub}`} className="hover:underline">
                      {author.displayName ?? truncateNpub(author.npub, 10)}
                    </Link>
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {author.about ?? 'No bio yet.'}
                  </p>
                  <div className="mt-3 flex gap-6 text-sm text-muted-foreground">
                    <span>{author.novels.toLocaleString()} novels</span>
                    <span>{author.followers.toLocaleString()} followers</span>
                  </div>
                </div>

                <div className="flex gap-2 sm:flex-col">
                  <Button variant="outline" className="flex-1" asChild>
                    <Link href={`/profile/${author.npub}`}>View Profile</Link>
                  </Button>
                  {canManageFollowing && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pendingNpub === author.npub}
                      onClick={() => void handleUnfollow(author.npub)}
                    >
                      {pendingNpub === author.npub ? 'Unfollowing...' : 'Unfollow'}
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {pagination.totalItems > 0 ? (
          <div className="mt-8 flex flex-col gap-3 border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {visibleFrom}-{visibleTo} of {pagination.totalItems}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading || pagination.page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Prev
              </Button>
              <div className="min-w-16 border border-border px-3 py-2 text-center text-sm">
                {pagination.page} / {pagination.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading || pagination.page >= pagination.totalPages}
                onClick={() =>
                  setPage((current) => Math.min(pagination.totalPages, current + 1))
                }
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </div>
      </main>
      <Footer />
    </div>
  )
}
