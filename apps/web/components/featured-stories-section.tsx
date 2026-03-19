import Link from "next/link"
import { ArrowRight } from "lucide-react"

const featuredStories = [
  {
    id: 1,
    title: "The Last Library",
    author: "Elena Morrison",
    excerpt:
      "In a world where books have been forgotten, one librarian guards the final collection of human stories.",
    genre: "Science Fiction",
    chapters: 24,
  },
  {
    id: 2,
    title: "Whispers of the Silk Road",
    author: "James Chen",
    excerpt:
      "A merchant's journey along ancient trade routes reveals secrets that could change history.",
    genre: "Historical Fiction",
    chapters: 18,
  },
  {
    id: 3,
    title: "The Midnight Garden",
    author: "Sarah Blake",
    excerpt:
      "Every night at midnight, the garden awakens with memories of those who once walked its paths.",
    genre: "Literary Fiction",
    chapters: 12,
  },
]

export function FeaturedStoriesSection() {
  return (
    <section className="w-full">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-serif text-3xl tracking-tight text-foreground sm:text-4xl">
              Featured Stories
            </h2>
            <p className="mt-2 text-base text-muted-foreground">
              Discover exceptional narratives from our community.
            </p>
          </div>
          <Link
            href="/discover"
            className="hidden items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground sm:flex"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {featuredStories.map((story) => (
            <article
              key={story.id}
              className="group flex flex-col border-t border-border pt-6"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{story.genre}</span>
                <span>·</span>
                <span>{story.chapters} chapters</span>
              </div>
              <h3 className="mt-3 font-serif text-xl text-foreground transition-colors group-hover:text-muted-foreground">
                <Link href={`/story/${story.id}`}>{story.title}</Link>
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                by {story.author}
              </p>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                {story.excerpt}
              </p>
              <Link
                href={`/story/${story.id}`}
                className="mt-6 inline-flex items-center gap-1 text-sm text-foreground transition-colors hover:text-muted-foreground"
              >
                Read story
                <ArrowRight className="h-3 w-3" />
              </Link>
            </article>
          ))}
        </div>
        <Link
          href="/discover"
          className="mt-8 flex items-center justify-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground sm:hidden"
        >
          View all stories
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
