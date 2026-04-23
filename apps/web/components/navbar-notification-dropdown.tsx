"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import type { NotificationDto } from "@myth/shared"
import {
  Bell,
  BookOpen,
  Bookmark,
  Loader2,
  MessageCircle,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { fetchNotifications } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { resolveNovelCoverSrc } from "@/lib/novel-cover"

const PREVIEW_PAGE_SIZE = 5

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

export function NavbarNotificationDropdown() {
  const { user, unreadNotificationCount } = useAuth()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationDto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const requestIdRef = useRef(0)

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([])
      return
    }

    const requestId = ++requestIdRef.current
    setIsLoading(true)

    try {
      const payload = await fetchNotifications({ page: 1, pageSize: PREVIEW_PAGE_SIZE })
      if (requestIdRef.current !== requestId) {
        return
      }

      setNotifications(payload.notifications)
    } catch (error) {
      if (requestIdRef.current !== requestId) {
        return
      }

      console.error("Failed to fetch notification preview:", error)
      setNotifications([])
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoading(false)
      }
    }
  }, [user])

  useEffect(() => {
    setNotifications([])
    setOpen(false)
  }, [user?.npub])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)

    if (nextOpen) {
      void loadNotifications()
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <span className="relative block">
            <Bell className="h-5 w-5" />
            {unreadNotificationCount > 0 ? (
              <span className="absolute -right-2 -top-2 min-w-[1rem] border border-background bg-foreground px-1 text-center text-[10px] leading-4 text-background">
                {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
              </span>
            ) : null}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[22rem] p-0">
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-foreground">Notifications</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {unreadNotificationCount > 0
                  ? `${unreadNotificationCount} unread updates`
                  : "Everything is up to date"}
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-xs">
              <Link href="/notifications">View all</Link>
            </Button>
          </div>
        </div>

        <div className="max-h-[26rem] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center px-4 py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium text-foreground">
                No notifications yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                New follows, chapter updates, and replies will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification)
                const href =
                  notification.targetUrl ||
                  (notification.novelId ? `/novel/${notification.novelId}` : "/notifications")
                const novelCoverUrl = notification.novel
                  ? resolveNovelCoverSrc({
                      novelId: notification.novel.id,
                      coverUrl: notification.novel.coverUrl,
                      coverStorageKey: notification.novel.coverStorageKey,
                    })
                  : null

                return (
                  <Link
                    key={notification.id}
                    href={href}
                    className="flex gap-3 px-4 py-3 transition hover:bg-accent/40"
                  >
                    {novelCoverUrl ? (
                      <div className="relative mt-0.5 h-14 w-10 shrink-0 overflow-hidden rounded-sm border border-border bg-muted">
                        <Image
                          src={novelCoverUrl}
                          alt={notification.novel?.title || notification.title}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                        {!notification.readAt ? (
                          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary" />
                        ) : null}
                      </div>
                    ) : (
                      <div className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted/40">
                        <Icon className="h-4 w-4 text-foreground" />
                        {!notification.readAt ? (
                          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary" />
                        ) : null}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p
                          className={`line-clamp-1 text-sm font-medium ${
                            notification.readAt ? "text-foreground" : "text-primary"
                          }`}
                        >
                          {notification.title}
                        </p>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatRelativeDate(notification.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {notification.message}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
