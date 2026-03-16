import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { NovelDetailSkeleton } from "@/components/skeletons"

export default function NovelLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <NovelDetailSkeleton />
      <Footer />
    </div>
  )
}
