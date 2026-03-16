import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { NotificationListSkeleton } from "@/components/skeletons"

export default function NotificationsLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-8">Notifications</h1>
          <NotificationListSkeleton count={8} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
