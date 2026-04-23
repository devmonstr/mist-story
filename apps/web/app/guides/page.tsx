import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import {
  pageContentContainerClassName,
  pageHeadingLeadClassName,
  pageHeadingTitleClassName,
  pageSectionPaddingClassName,
} from "@/components/page-heading"
import { BookOpen, PenTool, Sparkles, ArrowRight } from "lucide-react"

const guides = [
  {
    icon: PenTool,
    title: "Getting Started with Writing",
    description: "Learn the basics of publishing your first novel on Myth Story.",
  },
  {
    icon: BookOpen,
    title: "Reader's Guide",
    description: "Discover how to make the most of your reading experience.",
  },
  {
    icon: Sparkles,
    title: "Building Your Audience",
    description: "Tips and strategies for growing your reader base.",
  },
]

export default function GuidesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className={`border-b border-border/40 bg-background ${pageSectionPaddingClassName}`}>
          <div className={`${pageContentContainerClassName} text-center`}>
            <h1 className={pageHeadingTitleClassName}>
              Writing Guides
            </h1>
            <p className={pageHeadingLeadClassName}>
              Resources to help you become a better writer and reader.
            </p>
          </div>
        </section>

        <section className={pageSectionPaddingClassName}>
          <div className={pageContentContainerClassName}>
            <div className="grid gap-6 md:grid-cols-3">
              {guides.map((guide) => (
                <div
                  key={guide.title}
                  className="border border-border/40 rounded-lg p-6 hover:border-border transition-colors"
                >
                  <div className="inline-flex rounded-lg bg-muted p-3 mb-4">
                    <guide.icon className="h-6 w-6 text-foreground" />
                  </div>
                  <h3 className="font-serif text-lg font-medium text-foreground mb-2">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {guide.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center mt-12 py-8 border-t border-border/40">
              <p className="text-muted-foreground mb-4">
                More guides coming soon. In the meantime, start writing!
              </p>
              <Button asChild>
                <a href="/studio">
                  Start Writing
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
