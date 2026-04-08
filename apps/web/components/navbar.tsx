"use client"

import Link from "next/link"
import { Menu, Search, Bookmark, PenSquare, BookOpen, Book, Pen, Compass, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { AuthButton } from "@/components/auth-button"
import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { NavbarNotificationDropdown } from "@/components/navbar-notification-dropdown"

const navLinks = [
  { href: "/library", label: "Library", icon: Book },
  { href: "/write", label: "Write", icon: Pen },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/about", label: "About", icon: Info },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()
  const isLoggedIn = !!user

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <span className="font-serif text-xl tracking-tight text-foreground">
            Mist Story
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Right Section */}
        <div className="hidden items-center gap-2 md:flex">
          {/* Search Icon - Always visible */}
          <Button variant="ghost" size="icon" asChild>
            <Link href="/search" aria-label="Search">
              <Search className="h-5 w-5" />
            </Link>
          </Button>

          {/* Bookmarks & Notifications - Only when logged in */}
          {isLoggedIn && (
            <>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/bookmarks" aria-label="Bookmarks">
                  <Bookmark className="h-5 w-5" />
                </Link>
              </Button>
              <NavbarNotificationDropdown />
            </>
          )}

          {/* Auth Button / Profile */}
          <AuthButton variant="default" />
        </div>

        {/* Mobile Right Section */}
        <div className="flex items-center gap-1 md:hidden">
          {/* Search Icon - Always visible */}
          <Button variant="ghost" size="icon" asChild>
            <Link href="/search" aria-label="Search">
              <Search className="h-5 w-5" />
            </Link>
          </Button>

          {/* Bookmarks & Notifications - Only when logged in */}
          {isLoggedIn && (
            <>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/bookmarks" aria-label="Bookmarks">
                  <Bookmark className="h-5 w-5" />
                </Link>
              </Button>
              <NavbarNotificationDropdown />
            </>
          )}

          {/* Hamburger Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex flex-col pt-8">
                {/* Quick Actions - Only when logged in */}
                {isLoggedIn && (
                  <>
                    <div className="flex items-center gap-2 px-2 pb-4">
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href="/studio" onClick={() => setIsOpen(false)}>
                          <PenSquare className="mr-2 h-4 w-4" />
                          Studio
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href="/my-library" onClick={() => setIsOpen(false)}>
                          <BookOpen className="mr-2 h-4 w-4" />
                          My Library
                        </Link>
                      </Button>
                    </div>
                    <Separator className="my-4" />
                  </>
                )}

                {/* Main Navigation */}
                <nav className="flex flex-col gap-1">
                  {navLinks.map((link) => {
                    const Icon = link.icon
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2 px-2 py-2.5 text-sm text-muted-foreground hover:text-foreground"
                      >
                        <Icon className="h-4 w-4" />
                        {link.label}
                      </Link>
                    )
                  })}
                </nav>
                <Separator className="my-6" />
                <div className="px-2">
                  <AuthButton variant="mobile" onAction={() => setIsOpen(false)} />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}
