import { ProfileHeaderSkeleton, NovelListSkeleton } from "@/components/skeletons/profile-skeleton"

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Profile Header Skeleton */}
      <ProfileHeaderSkeleton />

      {/* Novels Section Skeleton */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 h-8 w-24 animate-pulse rounded bg-muted" />
        <NovelListSkeleton />
      </div>
    </div>
  )
}
