'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from '@/components/ui/button'
import {
  Bell,
  BookOpen,
  Bookmark,
  Loader2,
  MessageCircle,
  Shield,
  Trash2,
} from 'lucide-react'
import { useRequireAuth } from '@/hooks/use-require-auth'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  deleteNotification,
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/lib/api'
import { resolveNovelCoverSrc } from '@/lib/novel-cover'
import type { NotificationDto, NotificationPagination } from '@mist/shared'
import { useAuth } from '@/context/auth-context'

const DEFAULT_PAGE_SIZE = 20

const EMPTY_PAGINATION: NotificationPagination = {
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalItems: 0,
  totalPages: 1,
}

function formatRelativeDate(value: string) {
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return "just now"
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function getNotificationIcon(notification: NotificationDto) {
  switch (notification.type) {
    case "CHAPTER_PUBLISHED":
      return BookOpen
    case "NOVEL_BOOKMARKED":
      return Bookmark
    case "COMMENT_REPLY":
    case "COMMENT_LIKE":
    case "MENTION":
      return MessageCircle
    default:
      return Shield
  }
}

export default function NotificationsPage() {
  const { user, isLoading, isAuthenticated } = useRequireAuth()
  const { syncUnreadNotificationCount } = useAuth()
  const [notifications, setNotifications] = useState<NotificationDto[]>([])
  const [pagination, setPagination] = useState<NotificationPagination>(EMPTY_PAGINATION)
  const [isFetching, setIsFetching] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated || !user?.npub) {
      return
    }

    try {
      setIsFetching(true)
      const payload = await fetchNotifications({ page, pageSize })
      setNotifications(payload.notifications)
      setPagination(payload.pagination)
      syncUnreadNotificationCount(payload.unreadCount)
      if (payload.pagination.page !== page) {
        setPage(payload.pagination.page)
      }
      if (payload.pagination.pageSize !== pageSize) {
        setPageSize(payload.pagination.pageSize)
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    } finally {
      setIsFetching(false)
    }
  }, [isAuthenticated, page, pageSize, syncUnreadNotificationCount, user?.npub])

  useEffect(() => {
    if (!isAuthenticated || !user?.npub) {
      setNotifications([])
      setPagination(EMPTY_PAGINATION)
      setIsFetching(false)
      syncUnreadNotificationCount(0)
      return
    }

    let cancelled = false

    const load = async () => {
      try {
        setIsFetching(true)
        const payload = await fetchNotifications({ page, pageSize })
        if (cancelled) {
          return
        }

        setNotifications(payload.notifications)
        setPagination(payload.pagination)
        syncUnreadNotificationCount(payload.unreadCount)
        if (payload.pagination.page !== page) {
          setPage(payload.pagination.page)
        }
        if (payload.pagination.pageSize !== pageSize) {
          setPageSize(payload.pagination.pageSize)
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch notifications:", error)
        }
      } finally {
        if (!cancelled) {
          setIsFetching(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, loadNotifications, page, pageSize, syncUnreadNotificationCount, user?.npub])

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.readAt).length,
    [notifications]
  )
  const visibleFrom = pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1
  const visibleTo =
    pagination.totalItems === 0
      ? 0
      : Math.min(pagination.page * pagination.pageSize, pagination.totalItems)

  useEffect(() => {
    syncUnreadNotificationCount(unreadCount)
  }, [syncUnreadNotificationCount, unreadCount])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      setIsSubmitting(true)
      const updated = await markNotificationAsRead(notificationId)
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId ? updated : notification
        )
      )
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      setIsSubmitting(true)
      await deleteNotification(notificationId)
      await loadNotifications()
    } catch (error) {
      console.error("Failed to delete notification:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      setIsSubmitting(true)
      await markAllNotificationsAsRead()
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          readAt: notification.readAt ?? new Date().toISOString(),
        }))
      )
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || isFetching) {
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

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
        <div className="border-b border-border">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Bell className="h-8 w-8 text-foreground" />
                <div>
                  <h1 className="font-serif text-3xl font-bold text-foreground">Notifications</h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {unreadCount > 0
                      ? `${unreadCount} unread ${unreadCount === 1 ? "notification" : "notifications"}`
                      : "Everything is up to date"}
                  </p>
                </div>
              </div>
              {notifications.length > 0 && unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={isSubmitting}>
                  Mark All Read
                </Button>
              )}
            </div>
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
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-serif text-xl font-semibold text-foreground">
                You're all caught up
              </h3>
              <p className="text-muted-foreground">
                No new notifications right now. Check back later.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification)
                const actorName =
                  notification.actor?.displayName?.trim() || "Someone"
                const notificationHref =
                  notification.targetUrl ||
                  (notification.novelId ? `/novel/${notification.novelId}` : null)
                const novelCoverUrl = notification.novel
                  ? resolveNovelCoverSrc({
                      novelId: notification.novel.id,
                      coverUrl: notification.novel.coverUrl,
                      coverStorageKey: notification.novel.coverStorageKey,
                    })
                  : null

                return (
                  <div
                    key={notification.id}
                    className={`flex gap-4 rounded border p-4 transition-all ${
                      notification.readAt
                        ? 'border-border/40 bg-card hover:border-border/80'
                        : 'border-primary/50 bg-primary/5 hover:border-primary/80'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {novelCoverUrl ? (
                        notificationHref ? (
                          <Link
                            href={notificationHref}
                            className="block h-20 w-14 overflow-hidden border border-border bg-muted"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={novelCoverUrl}
                              alt={notification.novel?.title || notification.title}
                              className="h-full w-full object-cover"
                            />
                          </Link>
                        ) : (
                          <div className="h-20 w-14 overflow-hidden border border-border bg-muted">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={novelCoverUrl}
                              alt={notification.novel?.title || notification.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center border border-border bg-card">
                          <Icon
                            className={`h-5 w-5 ${
                              notification.readAt ? 'text-muted-foreground' : 'text-primary'
                            }`}
                          />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <h3
                          className={`font-medium ${
                            notification.readAt ? 'text-foreground' : 'text-primary'
                          }`}
                        >
                          {notification.title}
                        </h3>
                        <span className="ml-2 whitespace-nowrap text-xs text-muted-foreground">
                          {formatRelativeDate(notification.createdAt)}
                        </span>
                      </div>
                      <p className="mb-2 text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="mb-3 text-xs text-muted-foreground">
                        {actorName}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {notificationHref && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={notificationHref}>Open</Link>
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      {!notification.readAt && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isSubmitting}
                          onClick={() => void handleMarkAsRead(notification.id)}
                        >
                          Mark Read
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={isSubmitting}
                        onClick={() => void handleDelete(notification.id)}
                        title="Delete notification"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
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
                  disabled={isFetching || pagination.page <= 1}
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
                  disabled={isFetching || pagination.page >= pagination.totalPages}
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
