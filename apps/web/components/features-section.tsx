import { PenLine, BookOpen, Users, Sparkles } from "lucide-react"

const features = [
  {
    icon: PenLine,
    title: "Distraction-Free Writing",
    description:
      "A clean, minimal editor that lets you focus on what matters most — your words. No clutter, just creativity.",
  },
  {
    icon: BookOpen,
    title: "Beautiful Reading",
    description:
      "Typography designed for long-form reading. Customizable themes and layouts for the perfect reading experience.",
  },
  {
    icon: Users,
    title: "Community",
    description:
      "Connect with fellow writers and readers. Share feedback, join writing groups, and grow together.",
  },
  {
    icon: Sparkles,
    title: "Publish with Ease",
    description:
      "Share your work with the world. Publish chapters, complete novels, or serialized fiction with a single click.",
  },
]

export function FeaturesSection() {
  return (
    <section className="w-full border-t border-border bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl tracking-tight text-foreground sm:text-4xl text-balance">
            Everything you need to write
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg text-pretty">
            Simple tools that stay out of your way, so you can focus on telling your story.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:gap-12">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="relative flex flex-col gap-4 p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-border bg-background">
                <feature.icon className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
