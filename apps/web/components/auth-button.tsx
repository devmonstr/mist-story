"use client"

import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { truncateNpub } from "@/lib/nostr-utils"
import { User, LogOut, PenSquare, BookOpen, Clock, Settings } from "lucide-react"
import Link from "next/link"

interface AuthButtonProps {
  variant?: "default" | "mobile"
  onAction?: () => void
}

export function AuthButton({ variant = "default", onAction }: AuthButtonProps) {
  const { user, isLoading, signOut } = useAuth()

  const handleSignOut = () => {
    signOut()
    onAction?.()
  }

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled className="animate-pulse">
        Loading...
      </Button>
    )
  }

  if (!user) {
    if (variant === "mobile") {
      return (
        <div className="flex flex-col gap-3">
          <Button variant="outline" asChild className="w-full">
            <Link href="/sign-in" onClick={onAction}>
              Sign in with Nostr
            </Link>
          </Button>
          <Button asChild className="w-full">
            <Link href="/studio" onClick={onAction}>
              Start writing
            </Link>
          </Button>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/sign-in">Sign in</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/studio">Start writing</Link>
        </Button>
      </div>
    )
  }

  // User is signed in
  const displayName =
    user.profile?.display_name ||
    user.profile?.name ||
    truncateNpub(user.npub, 6)

  if (variant === "mobile") {
    return (
      <div className="flex flex-col gap-1">
        {/* User Header - clickable to profile */}
        <Link
          href={`/profile/${user.npub}`}
          onClick={onAction}
          className="flex items-center gap-3 px-2 py-3 rounded hover:bg-muted transition-colors"
        >
          {user.profile?.picture ? (
            <img
              src={user.profile.picture}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex flex-col flex-1">
            <span className="text-sm font-medium">{displayName}</span>
            <span className="text-xs text-muted-foreground">
              View Profile
            </span>
          </div>
        </Link>
        <div className="border-t border-border my-2" />
        <Link
          href="/studio"
          onClick={onAction}
          className="flex items-center gap-2 px-2 py-2.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <PenSquare className="h-4 w-4" />
          Writer Studio
        </Link>
        <Link
          href="/my-library"
          onClick={onAction}
          className="flex items-center gap-2 px-2 py-2.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <BookOpen className="h-4 w-4" />
          My Library
        </Link>
        <Link
          href={`/profile/${user.npub}`}
          onClick={onAction}
          className="flex items-center gap-2 px-2 py-2.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <User className="h-4 w-4" />
          My Profile
        </Link>
        <div className="border-t border-border my-2" />
        <Link
          href="/settings"
          onClick={onAction}
          className="flex items-center gap-2 px-2 py-2.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <div className="border-t border-border my-2" />
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-2 py-2.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 px-2"
        >
          {user.profile?.picture ? (
            <img
              src={user.profile.picture}
              alt=""
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
              <User className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
          <span className="max-w-[120px] truncate text-sm">{displayName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{displayName}</p>
          <p className="text-xs text-muted-foreground">
            {truncateNpub(user.npub, 10)}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/studio" className="flex items-center gap-2">
            <PenSquare className="h-4 w-4" />
            Writer Studio
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/my-library" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            My Library
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/profile/${user.npub}`} className="flex items-center gap-2">
            <User className="h-4 w-4" />
            My Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Reading History
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
