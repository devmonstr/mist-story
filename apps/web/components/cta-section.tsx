import Link from "next/link"
import { Button } from "@/components/ui/button"

export function CtaSection() {
  return (
    <section className="w-full border-t border-border bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl tracking-tight text-foreground sm:text-4xl text-balance">
            Ready to tell your story?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg text-pretty">
            Join thousands of writers who have found their creative home. 
            Start writing today — it&apos;s free.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/sign-up">Create free account</Link>
            </Button>
            <Button variant="ghost" size="lg" asChild>
              <Link href="/about">Learn more</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
