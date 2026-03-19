'use client'

import Link from 'next/link'
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from '@/components/ui/button'
import { Bell, BookOpen, Heart, Users, MessageCircle, Trash2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useRequireAuth } from '@/hooks/use-require-auth'

export default function NotificationsPage() {
  const { isLoading, isAuthenticated } = useRequireAuth()
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'new-chapter',
      title: 'Sarah Mitchell published a new chapter',
      description: 'Chapter 24: The Final Battle in "The Forgotten Kingdom"',
      novelId: '1',
      authorName: 'Sarah Mitchell',
      timestamp: '2 hours ago',
      read: false,
      icon: BookOpen,
    },
    {
      id: '2',
      type: 'comment',
      title: 'James Chen commented on your novel',
      description: 'Great story! I loved the character development in this chapter.',
      novelId: '3',
      authorName: 'James Chen',
      timestamp: '4 hours ago',
      read: false,
      icon: MessageCircle,
    },
    {
      id: '3',
      type: 'like',
      title: 'Elena Rodriguez liked your novel',
      description: 'She liked "Between Worlds"',
      novelId: '2',
      authorName: 'Elena Rodriguez',
      timestamp: '6 hours ago',
      read: true,
      icon: Heart,
    },
    {
      id: '4',
      type: 'follow',
      title: 'Marcus Williams is now following you',
      description: 'He has 1,203 followers',
      novelId: null,
      authorName: 'Marcus Williams',
      timestamp: '1 day ago',
      read: true,
      icon: Users,
    },
    {
      id: '5',
      type: 'new-chapter',
      title: 'Eleanor Chen published a new chapter',
      description: 'Chapter 12: The Convergence in "Echoes of Tomorrow"',
      novelId: '4',
      authorName: 'Eleanor Chen',
      timestamp: '1 day ago',
      read: true,
      icon: BookOpen,
    },
    {
      id: '6',
      type: 'like',
      title: 'Priya Patel liked your novel',
      description: 'She liked "Starlight Chronicles"',
      novelId: '5',
      authorName: 'Priya Patel',
      timestamp: '2 days ago',
      read: true,
      icon: Heart,
    },
  ])

  const handleDelete = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id))
  }

  const handleMarkAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
    )
  }

  const handleClearAll = () => {
    setNotifications([])
  }

  const unreadCount = notifications.filter((n) => !n.read).length

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

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-8 w-8 text-foreground" />
              <h1 className="font-serif text-3xl font-bold text-foreground">Notifications</h1>
            </div>
            {notifications.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleClearAll}>
                Clear All
              </Button>
            )}
          </div>
          {unreadCount > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              {unreadCount} new {unreadCount === 1 ? 'notification' : 'notifications'}
            </p>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
              You're all caught up
            </h3>
            <p className="text-muted-foreground">
              No new notifications right now. Check back later!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const Icon = notification.icon
              return (
                <div
                  key={notification.id}
                  className={`flex gap-4 p-4 border rounded transition-all ${
                    notification.read
                      ? 'border-border/40 bg-card hover:border-border/80'
                      : 'border-primary/50 bg-primary/5 hover:border-primary/80'
                  }`}
                >
                  <div className="flex-shrink-0 pt-1">
                    <Icon className={`h-5 w-5 ${notification.read ? 'text-muted-foreground' : 'text-primary'}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className={`font-medium ${notification.read ? 'text-foreground' : 'text-primary'}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {notification.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {notification.description}
                    </p>

                    <div className="flex gap-2">
                      {notification.novelId && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/novel/${notification.novelId}`}>
                            View Novel
                          </Link>
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/profile/nprofile123`}>
                          {notification.authorName}
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    {!notification.read && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        Mark Read
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDelete(notification.id)}
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
