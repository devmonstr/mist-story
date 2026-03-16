import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { StudioSkeleton } from "@/components/skeletons"

export default function StudioLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <StudioSkeleton />
      <Footer />
    </div>
  )
}
