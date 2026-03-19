import { prisma } from "../client"
import { buildChapterContentHash, randomToken } from "../utils"

export async function findChapterVersionById(chapterVersionId: string) {
  return prisma.chapterVersion.findUnique({
    where: { id: chapterVersionId },
    include: {
      chapter: {
        include: {
          novel: true,
        },
      },
      relayPublishes: true,
    },
  })
}

export async function createChapterVersionFromDraft(
  chapterId: string,
  previewText?: string
) {
  const chapter = await prisma.chapter.findUniqueOrThrow({
    where: { id: chapterId },
    include: {
      versions: {
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  })

  const nextVersion = (chapter.versions[0]?.version ?? 0) + 1
  const contentDraft = chapter.contentDraft ?? ""

  const created = await prisma.chapterVersion.create({
    data: {
      chapterId,
      version: nextVersion,
      previewText: previewText || contentDraft.slice(0, 280),
      contentHash: buildChapterContentHash(contentDraft),
      ciphertext: contentDraft,
      wrappedDek: randomToken(),
      wrappedDekIv: randomToken(),
      wrappedDekAuthTag: randomToken(),
      masterKeyVersion: "local-dev-v1",
    },
  })

  await prisma.chapter.update({
    where: { id: chapterId },
    data: {
      latestVersionId: created.id,
    },
  })

  return created
}

export async function markChapterVersionPublished(input: {
  chapterVersionId: string
  publishedEventId: string
  publishedRelayCount: number
}) {
  const updated = await prisma.chapterVersion.update({
    where: { id: input.chapterVersionId },
    data: {
      publishState: "PUBLISHED",
      publishedEventId: input.publishedEventId,
      publishedRelayCount: input.publishedRelayCount,
      publishedAt: new Date(),
    },
  })

  await prisma.chapter.update({
    where: { id: updated.chapterId },
    data: {
      status: "PUBLISHED",
      latestPublishedVersionId: updated.id,
      publishedAt: new Date(),
    },
  })

  return updated
}

export async function markChapterVersionFailed(
  chapterVersionId: string,
  lastPublishError: string
) {
  return prisma.chapterVersion.update({
    where: { id: chapterVersionId },
    data: {
      publishState: "FAILED",
      lastPublishError,
    },
  })
}

export async function upsertChapterVersionRelayPublish(input: {
  chapterVersionId: string
  relayUrl: string
  publishState: "PENDING" | "SUCCESS" | "FAILED"
  eventId?: string
  lastError?: string
}) {
  return prisma.chapterVersionRelayPublish.upsert({
    where: {
      chapterVersionId_relayUrl: {
        chapterVersionId: input.chapterVersionId,
        relayUrl: input.relayUrl,
      },
    },
    create: {
      chapterVersionId: input.chapterVersionId,
      relayUrl: input.relayUrl,
      publishState: input.publishState,
      eventId: input.eventId,
      lastError: input.lastError,
      attemptCount: 1,
      lastAttemptedAt: new Date(),
      publishedAt: input.publishState === "SUCCESS" ? new Date() : null,
    },
    update: {
      publishState: input.publishState,
      eventId: input.eventId,
      lastError: input.lastError,
      attemptCount: {
        increment: 1,
      },
      lastAttemptedAt: new Date(),
      publishedAt: input.publishState === "SUCCESS" ? new Date() : null,
    },
  })
}
