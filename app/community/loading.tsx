import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Skeleton, SkeletonText } from "@/components/skeletons"

export default function CommunityLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-8">Community</h1>
          <div className="grid gap-6 md:grid-cols-3">
            {['Discussions', 'Events', 'Challenges'].map((section) => (
              <div key={section} className="rounded-lg border border-border/40 bg-card p-6 space-y-4">
                <Skeleton className="h-6 w-24" />
                <SkeletonText lines={2} />
                <Skeleton className="h-10 w-full rounded" />
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">Join the conversation!</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
