import { use } from "react"
import { Button } from "@/components/ui/button"

const novels: Record<string, {
  id: string
  author: string
  authorBio: string
  publishedDate: string
  lastUpdated: string
}> = {
  "1": {
    id: "1",
    author: "Emma Stone",
    authorBio: "Emma Stone is a bestselling fantasy author known for her richly detailed worlds and compelling characters. She has been writing for over a decade.",
    publishedDate: "March 15, 2024",
    lastUpdated: "January 8, 2026",
  },
}

const defaultNovel = novels["1"]

export function AuthorSidebar({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const novel = novels[id] || defaultNovel

  const totalWords = (novels[id] || defaultNovel).id === "1" ? 41300 : 0

  return (
    <div className="sticky top-8 space-y-8">
      {/* Author Info */}
      <div className="border border-border/40 bg-card p-6">
        <h3 className="text-sm font-medium text-muted-foreground">About the Author</h3>
        <div className="mt-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg font-medium text-muted-foreground">
            {novel.author.charAt(0)}
          </div>
          <p className="mt-3 font-serif text-lg text-foreground">{novel.author}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {novel.authorBio}
          </p>
          <Button variant="outline" size="sm" className="mt-4 w-full">
            View Profile
          </Button>
        </div>
      </div>

      {/* Story Details */}
      <div className="border border-border/40 bg-card p-6">
        <h3 className="text-sm font-medium text-muted-foreground">Story Details</h3>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Published</dt>
            <dd className="text-foreground">{novel.publishedDate}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Last Updated</dt>
            <dd className="text-foreground">{novel.lastUpdated}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Total Words</dt>
            <dd className="text-foreground">{totalWords.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="text-foreground">Ongoing</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
