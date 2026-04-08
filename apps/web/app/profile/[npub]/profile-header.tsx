"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Share2, Users, Loader2, AlertCircle, Copy, Check } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { truncateNpub } from "@/lib/nostr-utils"
import { useProfileShell } from "./profile-shell"

function compactValue(value: string, head = 14, tail = 10) {
  if (value.length <= head + tail + 3) {
    return value
  }

  return `${value.slice(0, head)}...${value.slice(-tail)}`
}

type ProfileDetail = {
  label: string
  value: string
  displayValue?: string
  href?: string
  monospace?: boolean
  copyValue?: string
}

export function ProfileHeader() {
  const { user } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const { npub, data, isLoading, error, isFollowPending, toggleFollow } = useProfileShell()
  const [copiedField, setCopiedField] = useState<string | null>(null)

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
  const profileDetails: ProfileDetail[] = [
    ...(profile.handle ? [{ label: "Handle", value: profile.handle }] : []),
    ...(profile.nip05 ? [{ label: "NIP-05", value: profile.nip05 }] : []),
    ...(profile.lud16
      ? [{
          label: "Lightning",
          value: profile.lud16,
          copyValue: profile.lud16,
        }]
      : []),
    ...(profile.website
      ? [{
          label: "Website",
          value: profile.website.replace(/^https?:\/\//, ""),
          href: profile.website,
        }]
      : []),
    {
      label: "Nostr",
      value: profile.npub,
      displayValue: compactValue(profile.npub),
      monospace: true,
      copyValue: profile.npub,
    },
  ]

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

  const handleCopyDetail = async (label: string, value: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      return
    }

    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(label)
      window.setTimeout(() => {
        setCopiedField((current) => (current === label ? null : current))
      }, 1600)
    } catch (copyError) {
      console.error(`Failed to copy ${label}:`, copyError)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <section className="overflow-hidden border-b border-border">
        <div className="relative min-h-[280px] bg-muted sm:min-h-[340px]">
          {profile.bannerUrl ? (
            <Image
              src={profile.bannerUrl}
              alt=""
              fill
              sizes="(min-width: 1024px) 1280px, 100vw"
              className="object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />

          <div className="relative flex min-h-[280px] flex-col justify-between px-5 py-5 text-white sm:min-h-[340px] sm:px-8 sm:py-8 lg:px-10">
            <div className="flex justify-end">
              <div className="flex flex-col gap-2 sm:flex-row">
                {data.isOwnProfile ? (
                  <>
                    <Button asChild className="bg-background text-foreground hover:bg-background/90">
                      <Link href="/settings">Edit Profile</Link>
                    </Button>
                    <Button
                      variant="outline"
                      asChild
                      className="border-white/35 bg-black/20 text-white hover:bg-black/35 hover:text-white"
                    >
                      <Link href="/studio">My Studio</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleFollowClick}
                      disabled={isFollowPending}
                      className="bg-background text-foreground hover:bg-background/90"
                    >
                      {isFollowPending
                        ? "Saving..."
                        : data.isFollowing
                          ? "Following"
                          : "Follow"}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-white/35 bg-black/20 text-white hover:bg-black/35 hover:text-white"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-end gap-4 sm:gap-5">
                {profile.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt={displayName}
                    width={112}
                    height={112}
                    className="h-20 w-20 shrink-0 rounded-full border-2 border-white/85 object-cover shadow-[0_16px_40px_rgba(0,0,0,0.28)] sm:h-24 sm:w-24 lg:h-28 lg:w-28"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-white/85 bg-white/12 shadow-[0_16px_40px_rgba(0,0,0,0.28)] backdrop-blur-sm sm:h-24 sm:w-24 lg:h-28 lg:w-28">
                    <Users className="h-8 w-8 text-white/80" />
                  </div>
                )}

                <div className="max-w-3xl space-y-3 pb-1">
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.32em] text-white/72">
                      Mist Story
                    </p>
                    <h1 className="max-w-4xl font-serif text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                      {displayName}
                    </h1>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/78">
                    {profile.nip05 ? <span>@{profile.nip05}</span> : null}
                    {profile.website ? (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-white/40 underline-offset-4 transition hover:text-white"
                      >
                        {profile.website.replace(/^https?:\/\//, "")}
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 bg-background px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] lg:px-10">
          <div className="max-w-2xl space-y-3">
            <p className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
              Profile
            </p>
            <div className="space-y-3">
              <p className="text-base leading-7 text-foreground sm:text-lg">
                {profile.about?.trim() || "A storyteller building worlds one chapter at a time."}
              </p>
              {!profile.about?.trim() ? (
                <p className="text-sm text-muted-foreground">
                  Add a short bio in Edit Profile to introduce your voice and writing focus.
                </p>
              ) : null}
            </div>
            {profileDetails.length > 0 ? (
              <div className="grid gap-3 border-t border-border pt-5 sm:grid-cols-2">
                {profileDetails.map((detail) => (
                  <div key={detail.label} className="space-y-1">
                    <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                      {detail.label}
                    </div>
                    {detail.href ? (
                      <a
                        href={detail.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block text-sm text-foreground transition hover:text-primary ${
                          detail.monospace ? "font-mono break-all" : "break-words"
                        }`}
                      >
                        {detail.displayValue ?? detail.value}
                      </a>
                    ) : (
                      <div className="space-y-2">
                        <div
                          className={`text-sm text-foreground ${
                            detail.monospace ? "font-mono break-all" : "break-words"
                          }`}
                        >
                          {detail.displayValue ?? detail.value}
                        </div>
                        {detail.copyValue ? (
                          <button
                            type="button"
                            onClick={() => void handleCopyDetail(detail.label, detail.copyValue!)}
                            className="inline-flex items-center gap-1 border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition hover:border-foreground/20 hover:text-foreground"
                            aria-label={`Copy ${detail.label}`}
                          >
                            {copiedField === detail.label ? (
                              <>
                                <Check className="h-3 w-3" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                Copy
                              </>
                            )}
                          </button>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
                  At A Glance
                </p>
                <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                  A quick view of this writer&apos;s published catalog and audience on Mist Story.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2 border border-border/70 bg-muted/20 px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                    Novels
                  </div>
                  <div className="text-3xl font-semibold text-foreground">{data.stats.novels}</div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Published stories available to read now.
                  </p>
                </div>

                <div className="space-y-2 border border-border/70 bg-muted/20 px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                    Followers
                  </div>
                  <div className="text-3xl font-semibold text-foreground">
                    <Link href={`/profile/${npub}/followers`} className="transition hover:text-primary">
                      {data.stats.followers.toLocaleString()}
                    </Link>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Readers following future updates from this profile.
                  </p>
                </div>

                <div className="space-y-2 border border-border/70 bg-muted/20 px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                    Following
                  </div>
                  <div className="text-3xl font-semibold text-foreground">
                    <Link href={`/profile/${npub}/following`} className="transition hover:text-primary">
                      {data.stats.following.toLocaleString()}
                    </Link>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Writers and readers this account keeps up with.
                  </p>
                </div>

                <div className="space-y-2 border border-border/70 bg-muted/20 px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                    Total Reads
                  </div>
                  <div className="text-3xl font-semibold text-foreground">
                    {data.stats.totalReads.toLocaleString()}
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Reading sessions across this writer&apos;s published work.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
