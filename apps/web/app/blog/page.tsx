import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import {
  pageContentContainerClassName,
  pageHeadingLeadClassName,
  pageHeadingTitleClassName,
  pageSectionPaddingClassName,
} from "@/components/page-heading"
import { Calendar, ArrowRight } from "lucide-react"

export default function BlogPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className={`border-b border-border/40 bg-background ${pageSectionPaddingClassName}`}>
          <div className={`${pageContentContainerClassName} text-center`}>
            <h1 className={pageHeadingTitleClassName}>
              Blog
            </h1>
            <p className={pageHeadingLeadClassName}>
              Stories, tips, and updates from the Mist Story team.
            </p>
          </div>
        </section>

        <section className={pageSectionPaddingClassName}>
          <div className={pageContentContainerClassName}>
            <div className="text-center py-16">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
                Coming Soon
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                We&apos;re working on bringing you helpful articles about writing, reading, and the future of storytelling.
              </p>
              <Button variant="outline" asChild>
                <a href="/library">
                  Explore Stories Instead
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
