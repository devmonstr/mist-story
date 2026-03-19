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
