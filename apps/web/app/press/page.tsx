import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import {
  pageContentContainerClassName,
  pageHeadingLeadClassName,
  pageHeadingTitleClassName,
  pageSectionPaddingClassName,
} from "@/components/page-heading"
import { Newspaper, Mail, ArrowRight } from "lucide-react"

export default function PressPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className={`border-b border-border/40 bg-background ${pageSectionPaddingClassName}`}>
          <div className={`${pageContentContainerClassName} text-center`}>
            <h1 className={pageHeadingTitleClassName}>
              Press
            </h1>
            <p className={pageHeadingLeadClassName}>
              Media resources and press inquiries.
            </p>
          </div>
        </section>

        <section className={pageSectionPaddingClassName}>
          <div className={pageContentContainerClassName}>
            <div className="text-center py-8">
              <Newspaper className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
                Press Kit Coming Soon
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                For media inquiries, please reach out to our team directly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <a href="mailto:press@mythstory.app">
                    <Mail className="mr-2 h-4 w-4" />
                    press@mythstory.app
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/about">
                    About Myth Story
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
