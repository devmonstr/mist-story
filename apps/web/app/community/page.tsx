import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Users, MessageCircle, Heart, ArrowRight } from "lucide-react"

export default function CommunityPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-border/40 bg-background px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
            <h1 className="font-serif text-4xl font-light tracking-tight text-foreground sm:text-5xl">
              Community
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Connect with fellow writers and readers.
            </p>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 md:grid-cols-3 text-center">
              <div className="flex flex-col items-center">
                <div className="inline-flex rounded-lg bg-muted p-4 mb-4">
                  <Users className="h-8 w-8 text-foreground" />
                </div>
                <h3 className="font-serif text-lg font-medium text-foreground mb-2">
                  15K+ Writers
                </h3>
                <p className="text-sm text-muted-foreground">
                  A growing community of storytellers
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="inline-flex rounded-lg bg-muted p-4 mb-4">
                  <MessageCircle className="h-8 w-8 text-foreground" />
                </div>
                <h3 className="font-serif text-lg font-medium text-foreground mb-2">
                  Active Discussions
                </h3>
                <p className="text-sm text-muted-foreground">
                  Share ideas and get feedback
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="inline-flex rounded-lg bg-muted p-4 mb-4">
                  <Heart className="h-8 w-8 text-foreground" />
                </div>
                <h3 className="font-serif text-lg font-medium text-foreground mb-2">
                  Supportive Environment
                </h3>
                <p className="text-sm text-muted-foreground">
                  Encouragement for all skill levels
                </p>
              </div>
            </div>

            <div className="text-center mt-12 py-8 border-t border-border/40">
              <p className="text-muted-foreground mb-4">
                Join our community and start connecting with other writers and readers.
              </p>
              <Button asChild>
                <a href="/sign-in">
                  Join Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
