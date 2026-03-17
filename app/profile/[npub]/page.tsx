import { Suspense } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProfileShell } from "./profile-shell"
import { ProfileHeader } from "./profile-header"
import { ProfileNovels } from "./profile-novels"
import { ProfileHeaderSkeleton } from "@/components/skeletons/profile-skeleton"
import { NovelListSkeleton } from "@/components/skeletons/profile-skeleton"

export default function ProfilePage({ params }: { params: Promise<{ npub: string }> }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
        <ProfileShell params={params}>
          <Suspense fallback={<ProfileHeaderSkeleton />}>
            <ProfileHeader params={params} />
          </Suspense>
          <Suspense fallback={<NovelListSkeleton />}>
            <ProfileNovels params={params} />
          </Suspense>
        </ProfileShell>
      </main>
      <Footer />
    </div>
  )
}
