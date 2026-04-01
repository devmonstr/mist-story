import { prisma } from "../client"

export async function listBookmarkedNovelsForUser(userId: string) {
  const bookmarks = await prisma.novelBookmark.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      novel: {
        include: {
          chapters: {
            where: {
              status: "PUBLISHED",
            },
            select: {
              publishedAt: true,
              updatedAt: true,
            },
            orderBy: [{ updatedAt: "desc" }, { publishedAt: "desc" }],
            take: 1,
          },
        },
      },
    },
  })

  return bookmarks.sort((left, right) => {
    const leftLatest =
      left.novel.chapters[0]?.updatedAt ??
      left.novel.chapters[0]?.publishedAt ??
      left.novel.updatedAt
    const rightLatest =
      right.novel.chapters[0]?.updatedAt ??
      right.novel.chapters[0]?.publishedAt ??
      right.novel.updatedAt

    const chapterDelta = rightLatest.getTime() - leftLatest.getTime()
    if (chapterDelta !== 0) {
      return chapterDelta
    }

    return right.updatedAt.getTime() - left.updatedAt.getTime()
  })
}

export async function listBookmarkNotificationRecipientsForNovel(
  novelId: string,
  excludeUserId?: string
) {
  const recipients = await prisma.novelBookmark.findMany({
    where: {
      novelId,
      ...(excludeUserId
        ? {
            userId: {
              not: excludeUserId,
            },
          }
        : {}),
      user: {
        notificationPreferences: {
          none: {
            type: "CHAPTER_PUBLISHED",
            enabled: false,
          },
        },
      },
    },
    select: {
      userId: true,
    },
  })

  return recipients.map((recipient) => recipient.userId)
}

export async function listReadingProgressForUser(userId: string) {
  return prisma.readingProgress.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      novel: true,
      chapter: true,
    },
  })
}

export async function findNovelBookmarkForUser(userId: string, novelId: string) {
  return prisma.novelBookmark.findUnique({
    where: {
      userId_novelId: {
        userId,
        novelId,
      },
    },
  })
}

export async function upsertNovelBookmarkForUser(userId: string, novelId: string) {
  return prisma.novelBookmark.upsert({
    where: {
      userId_novelId: {
        userId,
        novelId,
      },
    },
    create: {
      userId,
      novelId,
    },
    update: {},
  })
}

export async function deleteNovelBookmarkForUser(userId: string, novelId: string) {
  return prisma.novelBookmark.deleteMany({
    where: {
      userId,
      novelId,
    },
  })
}

export async function findReadingProgressForUserAndNovel(userId: string, novelId: string) {
  return prisma.readingProgress.findUnique({
    where: {
      userId_novelId: {
        userId,
        novelId,
      },
    },
    include: {
      chapter: true,
      novel: true,
    },
  })
}

export async function upsertReadingProgressForUser(input: {
  userId: string
  novelId: string
  chapterId?: string | null
  chapterNumber: number
}) {
  return prisma.readingProgress.upsert({
    where: {
      userId_novelId: {
        userId: input.userId,
        novelId: input.novelId,
      },
    },
    create: {
      userId: input.userId,
      novelId: input.novelId,
      chapterId: input.chapterId ?? null,
      chapterNumber: input.chapterNumber,
    },
    update: {
      chapterId: input.chapterId ?? null,
      chapterNumber: input.chapterNumber,
    },
    include: {
      chapter: true,
      novel: true,
    },
  })
}

export async function deleteReadingProgressForUserAndNovel(userId: string, novelId: string) {
  return prisma.readingProgress.deleteMany({
    where: {
      userId,
      novelId,
    },
  })
}

export async function clearReadingProgressForUser(userId: string) {
  return prisma.readingProgress.deleteMany({
    where: { userId },
  })
}
