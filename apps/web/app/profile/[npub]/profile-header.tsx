"use client"

import Image from "next/image"
import { useMemo } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Share2, Users, Loader2, AlertCircle } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { truncateNpub } from "@/lib/nostr-utils"
import { useProfileShell } from "./profile-shell"

export function ProfileHeader() {
  const { user } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const { npub, data, isLoading, error, isFollowPending, toggleFollow } = useProfileShell()

  const displayName = useMemo(() => {
    return (
      data?.profile.displayName ??
      data?.profile.handle ??
      truncateNpub(npub, 10)
    )
  }, [data?.profile.displayName, data?.profile.handle, npub])

  if (isLoading && !data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const profile = data.profile

  const handleFollowClick = async () => {
    if (!user) {
      router.push(`/sign-in?next=${encodeURIComponent(pathname)}`)
      return
    }

    try {
      await toggleFollow()
    } catch (followError) {
      console.error("Failed to update follow state:", followError)
    }
  }

  return (
    <>
      {/* Banner */}
      {profile.bannerUrl && (
        <div className="relative h-48 w-full overflow-hidden bg-muted">
          <Image
            src={profile.bannerUrl}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
      )}

      {/* Header Section */}
      <div className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              {profile.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt={displayName}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-full object-cover border-2 border-background shadow-sm -mt-12 sm:-mt-16"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted border-2 border-background shadow-sm -mt-12 sm:-mt-16">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 pt-2">
                <h1 className="font-serif text-2xl font-bold text-foreground sm:text-4xl">{displayName}</h1>
                {profile.nip05 && (
                  <p className="text-sm text-muted-foreground">@{profile.nip05}</p>
                )}
                {profile.about && (
                  <p className="mt-3 text-base text-foreground leading-relaxed">{profile.about}</p>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm text-primary hover:underline"
                  >
                    {profile.website}
                  </a>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 sm:flex-row">
              {data.isOwnProfile ? (
                <>
                  <Button asChild>
                    <Link href="/settings">Edit Profile</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/studio">My Studio</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={handleFollowClick} disabled={isFollowPending}>
                    {isFollowPending
                      ? "Saving..."
                      : data.isFollowing
                        ? "Following"
                        : "Follow"}
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div>
              <div className="text-2xl font-semibold text-foreground">{data.stats.novels}</div>
              <div className="text-sm text-muted-foreground">Novels</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-foreground">
                <Link href={`/profile/${npub}/followers`} className="hover:underline">
                  {data.stats.followers.toLocaleString()}
                </Link>
              </div>
              <div className="text-sm text-muted-foreground">Followers</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-foreground">
                <Link href={`/profile/${npub}/following`} className="hover:underline">
                  {data.stats.following.toLocaleString()}
                </Link>
              </div>
              <div className="text-sm text-muted-foreground">Following</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-foreground">
                {data.stats.totalReads.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Reads</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
