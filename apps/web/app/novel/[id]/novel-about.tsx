import { use } from "react"
import { Separator } from "@/components/ui/separator"

const novels: Record<string, {
  id: string
  longDescription: string
  tags: string[]
}> = {
  "1": {
    id: "1",
    longDescription: `In the shadows of the Elderwood Mountains lies a kingdom lost to time—a realm where magic once flowed like rivers and ancient beings walked among mortals. When young archivist Elara discovers a forbidden manuscript in the royal library, she unwittingly awakens powers that have slumbered for centuries.

As darkness creeps across the land and old enemies stir from their slumber, Elara must navigate treacherous politics, forbidden romance, and the weight of a destiny she never asked for. With the help of a disgraced knight, a mysterious scholar, and a creature of legend, she must uncover the truth behind the kingdom's fall—before history repeats itself.

The Forgotten Kingdom is a sweeping epic fantasy that explores themes of power, sacrifice, and the enduring strength of hope in the darkest of times.`,
    tags: ["Epic Fantasy", "Magic", "Adventure", "Romance", "Mystery"],
  },
}

const defaultNovel = novels["1"]

export function NovelAbout({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const novel = novels[id] || defaultNovel

  return (
    <>
      {/* About */}
      <div>
        <h2 className="font-serif text-2xl text-foreground">About this story</h2>
        <div className="mt-4 whitespace-pre-line text-base leading-relaxed text-muted-foreground">
          {novel.longDescription}
        </div>
      </div>

      {/* Tags */}
      <div className="mt-8">
        <h3 className="text-sm font-medium text-foreground">Tags</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {novel.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <Separator className="my-10" />
    </>
  )
}
