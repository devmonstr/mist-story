'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// ============================================
// BASE VARIANT COMPONENTS
// ============================================

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  )
}

export function SkeletonAvatar({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-20 w-20',
  }
  return <Skeleton className={cn('rounded-full', sizeClasses[size], className)} />
}

export function SkeletonImage({
  width = 'w-full',
  height = 'h-48',
  className
}: {
  width?: string
  height?: string
  className?: string
}) {
  return <Skeleton className={cn(width, height, className)} />
}

// ============================================
// CARD SKELETONS
// ============================================

export function NovelCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex gap-4 rounded-lg border border-border/40 bg-card p-4', className)}>
      {/* Cover */}
      <Skeleton className="h-32 w-20 flex-shrink-0 rounded" />

      <div className="flex-1 space-y-2">
        {/* Title */}
        <Skeleton className="h-5 w-3/4" />
        {/* Author */}
        <Skeleton className="h-4 w-1/2" />
        {/* Description */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        {/* Stats */}
        <div className="flex gap-4 pt-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  )
}

export function NovelCardGridSkeleton({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid gap-6 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <NovelCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function CategoryCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border border-border/40 bg-card p-6 space-y-4', className)}>
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  )
}

export function CollectionCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border border-border/40 bg-card overflow-hidden', className)}>
      <Skeleton className="h-32 w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <div className="flex items-center gap-2 pt-2">
          <SkeletonAvatar size="sm" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  )
}

export function StudioNovelCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 rounded-lg border border-border/40 bg-card p-4', className)}>
      <Skeleton className="h-12 w-12 rounded" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-16 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </div>
  )
}

// ============================================
// PAGE-LEVEL SKELETONS
// ============================================

export function ProfileSkeleton() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Banner */}
      <Skeleton className="h-48 w-full" />

      {/* Header Section */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <SkeletonAvatar size="lg" className="-mt-12 sm:-mt-16 border-2 border-background" />
              <div className="flex-1 pt-2 space-y-3">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
                <SkeletonText lines={2} className="max-w-md" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24 rounded" />
              <Skeleton className="h-10 w-24 rounded" />
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-7 w-16 mx-auto" />
                <Skeleton className="h-4 w-12 mx-auto mt-1" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Novels Section */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-24 mb-8" />
        <NovelCardGridSkeleton count={4} />
      </div>
    </div>
  )
}

export function NovelDetailSkeleton() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Banner */}
      <Skeleton className="h-64 w-full" />

      {/* Content */}
      <div className="mx-auto max-w-4xl -mt-32 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <Skeleton className="aspect-[2/3] w-full rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-10 w-full rounded" />
                <Skeleton className="h-10 w-full rounded" />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-10 w-3/4" />
              <div className="flex items-center gap-2">
                <SkeletonAvatar size="sm" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-20" />
              ))}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Chapters List */}
            <div className="space-y-2">
              <Skeleton className="h-6 w-24 mb-4" />
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-border/40">
                  <Skeleton className="h-6 w-8" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ReaderSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Skeleton className="h-8 w-8 rounded" />
          <div className="space-y-1 text-center">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-12 text-center space-y-2">
          <Skeleton className="h-4 w-16 mx-auto" />
          <Skeleton className="h-8 w-48 mx-auto" />
        </div>

        <div className="space-y-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="sticky bottom-0 border-t border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Skeleton className="h-8 w-20 rounded" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-8 w-16 rounded" />
        </div>
      </footer>
    </div>
  )
}

export function StudioSkeleton() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-10 w-32 rounded" />
        </div>
      </header>

      {/* Stats */}
      <div className="border-b border-border bg-muted/30 px-6 py-8">
        <div className="mx-auto max-w-6xl grid grid-cols-2 gap-6 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-8 w-16 mx-auto" />
              <Skeleton className="h-4 w-12 mx-auto mt-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Novels List */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StudioNovelCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function StudioEditorSkeleton() {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-muted/30 p-4 space-y-4">
        <Skeleton className="h-6 w-24" />
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 py-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
        <Skeleton className="h-8 w-full rounded mt-4" />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="border-b border-border bg-background p-2 flex items-center gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-8 rounded" />
          ))}
        </div>

        {/* Editor */}
        <div className="flex-1 p-8 space-y-4">
          <Skeleton className="h-8 w-1/2" />
          {Array.from({ length: 15 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </main>
    </div>
  )
}

export function SettingsSkeleton() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-32 mb-8" />

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar */}
          <nav className="lg:col-span-1">
            <div className="space-y-1 border border-border/40 rounded bg-card p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded" />
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="lg:col-span-3 space-y-6">
            <Skeleton className="h-8 w-48 mb-4" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded" />
              </div>
            ))}
            <Skeleton className="h-10 w-24 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function BookmarkListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4 rounded-lg border border-border/40 bg-card p-4">
          <Skeleton className="h-24 w-16 flex-shrink-0 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="space-y-1 pt-2">
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      ))}
    </div>
  )
}

export function NotificationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 rounded-lg border border-border/40 bg-card p-4">
          <SkeletonAvatar size="sm" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-6 rounded" />
        </div>
      ))}
    </div>
  )
}

export function ChapterListSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3 border-b border-border/40">
          <Skeleton className="h-6 w-8" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

export function ListSkeleton({
  count = 5,
  showAvatar = true
}: {
  count?: number
  showAvatar?: boolean
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-border/40 bg-card p-4">
          {showAvatar && <SkeletonAvatar size="md" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <Skeleton className="h-8 w-20 rounded" />
        </div>
      ))}
    </div>
  )
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded" />
        </div>
      ))}
      <Skeleton className="h-10 w-24 rounded" />
    </div>
  )
}

export function PricingCardsSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border/40 bg-card p-6 space-y-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-10 w-20" />
          <SkeletonText lines={2} />
          <div className="space-y-2 pt-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-4 w-full" />
            ))}
          </div>
          <Skeleton className="h-10 w-full rounded" />
        </div>
      ))}
    </div>
  )
}

export function FAQSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border/40 bg-card">
          <div className="flex items-center justify-between p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-5 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function GuideCardsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border/40 bg-card p-6 space-y-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <Skeleton className="h-6 w-3/4" />
          <SkeletonText lines={2} />
          <Skeleton className="h-8 w-24 rounded" />
        </div>
      ))}
    </div>
  )
}

export function HomeSkeleton() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center space-y-4">
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-6 w-1/2 mx-auto" />
          <div className="flex justify-center gap-4 pt-4">
            <Skeleton className="h-12 w-32 rounded" />
            <Skeleton className="h-12 w-32 rounded" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 bg-muted/30">
        <div className="mx-auto max-w-6xl">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border/40 bg-card p-6 space-y-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-5 w-1/2" />
                <SkeletonText lines={2} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Stories */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Skeleton className="h-8 w-40 mb-8" />
          <NovelCardGridSkeleton count={3} />
        </div>
      </section>
    </div>
  )
}
