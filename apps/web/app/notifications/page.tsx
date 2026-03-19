'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
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
  deleteNotification,
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/lib/api'
import type { NotificationDto } from '@mist/shared'

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
  const { isLoading, isAuthenticated } = useRequireAuth()
  const [notifications, setNotifications] = useState<NotificationDto[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    const loadNotifications = async () => {
      try {
        setIsFetching(true)
        const payload = await fetchNotifications()
        setNotifications(payload.notifications)
      } catch (error) {
        console.error("Failed to fetch notifications:", error)
      } finally {
        setIsFetching(false)
      }
    }

    void loadNotifications()
  }, [isAuthenticated])

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.readAt).length,
    [notifications]
  )

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
      setNotifications((current) =>
        current.filter((notification) => notification.id !== notificationId)
      )
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
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
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
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
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

                return (
                  <div
                    key={notification.id}
                    className={`flex gap-4 rounded border p-4 transition-all ${
                      notification.readAt
                        ? 'border-border/40 bg-card hover:border-border/80'
                        : 'border-primary/50 bg-primary/5 hover:border-primary/80'
                    }`}
                  >
                    <div className="flex-shrink-0 pt-1">
                      <Icon
                        className={`h-5 w-5 ${
                          notification.readAt ? 'text-muted-foreground' : 'text-primary'
                        }`}
                      />
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
                        {notification.targetUrl && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={notification.targetUrl}>Open</Link>
                          </Button>
                        )}
                        {notification.novelId && !notification.targetUrl && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/novel/${notification.novelId}`}>View Story</Link>
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
        </div>
      </main>
      <Footer />
    </div>
  )
}
