import { prisma } from "../client"

export async function listChaptersForNovel(novelId: string) {
  return prisma.chapter.findMany({
    where: { novelId },
    orderBy: { number: "asc" },
  })
}

export async function findChapterById(chapterId: string) {
  return prisma.chapter.findUnique({
    where: { id: chapterId },
  })
}

export async function findChapterWithNovelById(chapterId: string) {
  return prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      novel: true,
    },
  })
}

export async function findChapterForNovelByNumber(novelId: string, chapterNumber: number) {
  return prisma.chapter.findFirst({
    where: {
      novelId,
      number: chapterNumber,
    },
  })
}

export async function createChapterForNovel(
  novelId: string,
  input: {
    title: string
    note: string
    contentDraft: string
  }
) {
  const aggregate = await prisma.chapter.aggregate({
    where: { novelId },
    _max: { number: true },
  })

  const nextNumber = (aggregate._max.number ?? 0) + 1

  const chapter = await prisma.chapter.create({
    data: {
      novelId,
      number: nextNumber,
      title: input.title,
      note: input.note,
      contentDraft: input.contentDraft,
    },
  })

  await prisma.novel.update({
    where: { id: novelId },
    data: {
      chaptersCount: {
        increment: 1,
      },
    },
  })

  return chapter
}

export async function updateChapterById(
  chapterId: string,
  input: Partial<{
    title: string
    note: string
    contentDraft: string
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  }>
) {
  return prisma.chapter.update({
    where: { id: chapterId },
    data: input,
  })
}

export async function reorderChaptersForNovel(
  novelId: string,
  orderedChapterIds: string[]
) {
  return prisma.$transaction(async (tx) => {
    const chapters = await tx.chapter.findMany({
      where: { novelId },
      orderBy: { number: "asc" },
      select: { id: true },
    })

    if (chapters.length !== orderedChapterIds.length) {
      throw new Error("Invalid chapter ordering payload")
    }

    const existingIds = new Set(chapters.map((chapter) => chapter.id))
    const payloadIds = new Set(orderedChapterIds)

    if (
      existingIds.size !== payloadIds.size ||
      chapters.some((chapter) => !payloadIds.has(chapter.id))
    ) {
      throw new Error("Invalid chapter ordering payload")
    }

    for (let index = 0; index < orderedChapterIds.length; index += 1) {
      await tx.chapter.update({
        where: { id: orderedChapterIds[index] },
        data: {
          number: orderedChapterIds.length + index + 1,
        },
      })
    }

    for (let index = 0; index < orderedChapterIds.length; index += 1) {
      await tx.chapter.update({
        where: { id: orderedChapterIds[index] },
        data: {
          number: index + 1,
        },
      })
    }

    return tx.chapter.findMany({
      where: { novelId },
      orderBy: { number: "asc" },
    })
  })
}

export async function deleteChapterById(chapterId: string) {
  return prisma.$transaction(async (tx) => {
    const chapter = await tx.chapter.delete({
      where: { id: chapterId },
    })

    await tx.novel.update({
      where: { id: chapter.novelId },
      data: {
        chaptersCount: {
          decrement: 1,
        },
      },
    })

    return chapter
  })
}
