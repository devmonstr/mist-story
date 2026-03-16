import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HomeSkeleton } from "@/components/skeletons"

export default function HomeLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <HomeSkeleton />
      <Footer />
    </div>
  )
}
