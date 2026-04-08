import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  type PublicNovelAuthorDto,
  type PublicNovelDetailDto,
} from "@mist/shared"
import { formatPublishedDate } from "./novel-utils"

interface AuthorSidebarProps {
  novel: PublicNovelDetailDto
  author: PublicNovelAuthorDto
}

export function AuthorSidebar({ novel, author }: AuthorSidebarProps) {
  const avatarFallback = author.displayName.charAt(0).toUpperCase()
  const hasWebsite = Boolean(author.website)
  const hasHandle = Boolean(author.handle?.trim())

  return (
    <div className="sticky top-8 space-y-8">
      <div className="border border-border/40 bg-card p-6">
        <h3 className="text-sm font-medium text-muted-foreground">About the Author</h3>
        <div className="mt-4">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-muted text-lg font-medium text-muted-foreground">
            {author.avatarUrl ? (
              <Image
                src={author.avatarUrl}
                alt={author.displayName}
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            ) : (
              avatarFallback
            )}
          </div>
          <p className="mt-3 font-serif text-lg text-foreground">{author.displayName}</p>
          {hasHandle ? (
            <p className="mt-1 text-xs text-muted-foreground">@{author.handle}</p>
          ) : null}
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {author.about || "This author has not added a bio yet."}
          </p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Followers</dt>
              <dd className="text-foreground">{author.followersCount.toLocaleString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Novels</dt>
              <dd className="text-foreground">{author.publishedNovelsCount.toLocaleString()}</dd>
            </div>
          </dl>
          {hasWebsite ? (
            <p className="mt-4 text-sm text-muted-foreground">
              <a
                href={author.website ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground hover:underline"
              >
                {author.website}
              </a>
            </p>
          ) : null}
          <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
            <Link href={`/profile/${author.npub}`}>View Profile</Link>
          </Button>
        </div>
      </div>

      <div className="border border-border/40 bg-card p-6">
        <h3 className="text-sm font-medium text-muted-foreground">Story Details</h3>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Published</dt>
            <dd className="text-foreground">{formatPublishedDate(novel.publishedAt)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Last Updated</dt>
            <dd className="text-foreground">{formatPublishedDate(novel.updatedAt)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Total Words</dt>
            <dd className="text-foreground">{novel.totalWords.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Chapters</dt>
            <dd className="text-foreground">{novel.chaptersCount.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Rating</dt>
            <dd className="text-foreground">
              {novel.rating.toFixed(1)} ({novel.ratingsCount.toLocaleString()})
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="text-foreground">{novel.status}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
