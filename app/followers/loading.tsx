import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ListSkeleton } from "@/components/skeletons"

export default function FollowersLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-8">Followers</h1>
          <ListSkeleton count={8} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
