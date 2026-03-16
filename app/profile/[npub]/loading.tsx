import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProfileSkeleton } from "@/components/skeletons"

export default function ProfileLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <ProfileSkeleton />
      <Footer />
    </div>
  )
}
