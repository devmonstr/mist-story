import type { Metadata } from "next"
import { Suspense } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { fetchProfilePage } from "@/lib/api"
import { buildCanonicalUrl, resolveMetadataImageUrl } from "@/lib/site-url"
import { truncateNpub } from "@/lib/nostr-utils"
import { ProfileShell } from "./profile-shell"
import { ProfileHeader } from "./profile-header"
import { ProfileNovels } from "./profile-novels"
import { ProfileHeaderSkeleton } from "@/components/skeletons/profile-skeleton"
import { NovelListSkeleton } from "@/components/skeletons/profile-skeleton"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ npub: string }>
}): Promise<Metadata> {
  const { npub } = await params

  try {
    const data = await fetchProfilePage(npub)
    const profile = data.profile
    const displayName =
      profile.displayName ?? profile.handle ?? truncateNpub(profile.npub, 10)
    const description =
      profile.about?.trim() ||
      `${displayName} on Mist Story. ${data.stats.novels.toLocaleString()} novels, ${data.stats.followers.toLocaleString()} followers, ${data.stats.totalReads.toLocaleString()} total reads.`
    const canonicalUrl = buildCanonicalUrl(`/profile/${profile.npub}`)
    const imageUrl = resolveMetadataImageUrl(profile.bannerUrl ?? profile.avatarUrl)
    const images = imageUrl ? [{ url: imageUrl, alt: displayName }] : undefined

    return {
      title: displayName,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        type: "profile",
        url: canonicalUrl,
        title: `${displayName} | Mist Story`,
        description,
        images,
      },
      twitter: {
        card: imageUrl ? "summary_large_image" : "summary",
        title: `${displayName} | Mist Story`,
        description,
        images,
      },
    }
  } catch {
    return {
      title: "Profile",
      description: "Read writer profiles and published novels on Mist Story.",
    }
  }
}

export default function ProfilePage({ params }: { params: Promise<{ npub: string }> }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
        <ProfileShell params={params}>
          <Suspense fallback={<ProfileHeaderSkeleton />}>
            <ProfileHeader />
          </Suspense>
          <Suspense fallback={<NovelListSkeleton />}>
            <ProfileNovels />
          </Suspense>
        </ProfileShell>
      </main>
      <Footer />
    </div>
  )
}
