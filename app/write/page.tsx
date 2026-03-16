'use client'

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { FileText, Save, Share2, Settings, Users, Zap } from "lucide-react"

const features = [
  {
    icon: FileText,
    title: "Rich Text Editor",
    description: "A distraction-free writing environment with formatting tools and organization features.",
  },
  {
    icon: Save,
    title: "Auto-Save",
    description: "Your work is automatically saved as you write, with full version history.",
  },
  {
    icon: Share2,
    title: "Collaborate",
    description: "Invite readers and fellow writers to comment and provide feedback on your work.",
  },
  {
    icon: Settings,
    title: "Custom Styling",
    description: "Customize how your story appears with themes, fonts, and layout options.",
  },
  {
    icon: Users,
    title: "Community Feedback",
    description: "Get constructive feedback from the Inkwell community of readers and writers.",
  },
  {
    icon: Zap,
    title: "Publishing Tools",
    description: "Powerful tools to format, publish, and manage your story on the platform.",
  },
]

export default function WritePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-border/40 bg-background px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="font-serif text-4xl font-light tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Share Your Stories
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Write, publish, and connect with readers. Bring your imagination to life on Inkwell.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <a href="/sign-up">Start Writing</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="/library">Read Stories First</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="font-serif text-3xl font-light tracking-tight text-foreground">
                Everything You Need to Write
              </h2>
              <p className="mt-4 text-muted-foreground">
                Professional tools designed for writers, by writers.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <div
                    key={feature.title}
                    className="border border-border/40 bg-card p-8 transition-all hover:border-border/80"
                  >
                    <div className="mb-4 inline-flex rounded-lg bg-muted p-3">
                      <Icon className="h-6 w-6 text-foreground" />
                    </div>
                    <h3 className="mb-2 font-serif text-lg font-medium text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-border/40 bg-card/50 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-3xl font-light tracking-tight text-foreground">
              Ready to Tell Your Story?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Join thousands of writers who are already sharing their work on Inkwell. It takes less than a minute to get started.
            </p>
            <Button size="lg" className="mt-8" asChild>
              <a href="/sign-up">Create Free Account</a>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
