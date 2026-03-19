import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Briefcase, MapPin, ArrowRight } from "lucide-react"

export default function CareersPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-border/40 bg-background px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="font-serif text-4xl font-light tracking-tight text-foreground sm:text-5xl">
              Careers
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Join us in building the future of storytelling.
            </p>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="text-center py-8">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
                No Open Positions
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                We&apos;re a small team right now, but we&apos;re always interested in hearing from passionate people who want to help us grow.
              </p>
              <div className="inline-flex items-center gap-2 text-muted-foreground mb-8">
                <MapPin className="h-4 w-4" />
                <span>Remote-first company</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline" asChild>
                  <a href="mailto:careers@miststory.app">
                    Contact Us
                  </a>
                </Button>
                <Button asChild>
                  <a href="/about">
                    Learn About Us
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
