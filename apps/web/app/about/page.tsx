import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import {
  pageContentContainerClassName,
  pageHeadingLeadClassName,
  pageHeadingTitleClassName,
  pageSectionPaddingClassName,
} from "@/components/page-heading"
import { Heart, Globe, Sparkles } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className={`border-b border-border/40 bg-background ${pageSectionPaddingClassName}`}>
          <div className={pageContentContainerClassName}>
            <h1 className={pageHeadingTitleClassName}>
              About Mist Story
            </h1>
            <p className={`${pageHeadingLeadClassName} max-w-3xl`}>
              A platform dedicated to connecting writers and readers, celebrating stories that move us.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className={`border-b border-border/40 ${pageSectionPaddingClassName}`}>
          <div className={pageContentContainerClassName}>
            <h2 className="font-serif text-3xl font-light tracking-tight text-foreground">
              Our Mission
            </h2>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
              Mist Story exists to democratize storytelling. We believe every voice deserves to be heard, and every reader should have access to exceptional stories. Our platform removes barriers between writers and their audiences, fostering a community where creativity thrives.
            </p>
          </div>
        </section>

        {/* Values Section */}
        <section className={`border-b border-border/40 ${pageSectionPaddingClassName}`}>
          <div className={pageContentContainerClassName}>
            <h2 className="mb-12 font-serif text-3xl font-light tracking-tight text-foreground">
              Our Values
            </h2>

            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col gap-4">
                <div className="inline-flex w-fit rounded-lg bg-muted p-3">
                  <Heart className="h-6 w-6 text-foreground" />
                </div>
                <h3 className="font-serif text-xl font-medium text-foreground">Community First</h3>
                <p className="text-sm text-muted-foreground">
                  We prioritize the needs of our writers and readers above all else, fostering genuine connections and mutual support.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="inline-flex w-fit rounded-lg bg-muted p-3">
                  <Globe className="h-6 w-6 text-foreground" />
                </div>
                <h3 className="font-serif text-xl font-medium text-foreground">Inclusivity</h3>
                <p className="text-sm text-muted-foreground">
                  Stories from all backgrounds, perspectives, and cultures are welcome here. Diversity strengthens our community.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="inline-flex w-fit rounded-lg bg-muted p-3">
                  <Sparkles className="h-6 w-6 text-foreground" />
                </div>
                <h3 className="font-serif text-xl font-medium text-foreground">Excellence</h3>
                <p className="text-sm text-muted-foreground">
                  We're committed to providing the best tools and experience for both reading and writing exceptional stories.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className={`border-b border-border/40 bg-card/50 ${pageSectionPaddingClassName}`}>
          <div className={pageContentContainerClassName}>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="font-serif text-3xl font-light text-foreground">15K+</div>
                <p className="mt-2 text-sm text-muted-foreground">Writers Publishing Stories</p>
              </div>
              <div className="text-center">
                <div className="font-serif text-3xl font-light text-foreground">250K+</div>
                <p className="mt-2 text-sm text-muted-foreground">Stories Published</p>
              </div>
              <div className="text-center">
                <div className="font-serif text-3xl font-light text-foreground">2M+</div>
                <p className="mt-2 text-sm text-muted-foreground">Active Readers</p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className={`border-b border-border/40 ${pageSectionPaddingClassName}`}>
          <div className={pageContentContainerClassName}>
            <h2 className="mb-8 font-serif text-3xl font-light tracking-tight text-foreground">
              Behind the Pages
            </h2>
            <p className="mb-8 max-w-3xl text-muted-foreground">
              Mist Story was founded by a team of writers, readers, and technologists who believe that stories matter. We're passionate about creating a space where creativity can flourish without compromise.
            </p>
            <p className="max-w-3xl text-muted-foreground">
              We're based in multiple locations worldwide, bringing diverse perspectives to everything we build. Our commitment is simple: create the best platform for storytellers and story lovers everywhere.
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className={pageSectionPaddingClassName}>
          <div className={`${pageContentContainerClassName} text-center`}>
            <h2 className="font-serif text-3xl font-light tracking-tight text-foreground">
              Join Our Community
            </h2>
            <p className="mt-4 max-w-3xl mx-auto text-muted-foreground">
              Whether you're a reader seeking inspiration or a writer ready to share your work, Mist Story is your home.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <a href="/library">Explore Stories</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="/write">Start Writing</a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
