import { Separator } from "@/components/ui/separator"
import {
  type PublicNovelDetailDto,
} from "@mist/shared"

interface NovelAboutProps {
  novel: PublicNovelDetailDto
}

export function NovelAbout({ novel }: NovelAboutProps) {
  return (
    <>
      <div>
        <h2 className="font-serif text-2xl text-foreground">About this story</h2>
        <div className="mt-4 whitespace-pre-line text-base leading-relaxed text-muted-foreground">
          {novel.summary || "No summary has been provided for this story yet."}
        </div>
      </div>

      {novel.contentWarning ? (
        <p className="mt-6 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Content Warning:</span>{" "}
          {novel.contentWarning}
        </p>
      ) : null}

      <div className="mt-8">
        <h3 className="text-sm font-medium text-foreground">Tags</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {[...novel.subgenres, ...novel.tags].length > 0 ? (
            [...novel.subgenres, ...novel.tags].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))
          ) : null}
        </div>
      </div>

      <Separator className="my-10" />
    </>
  )
}
