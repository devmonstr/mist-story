import { prisma } from "../client"

export async function listBookmarkedNovelsForUser(userId: string) {
  return prisma.novelBookmark.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      novel: true,
    },
  })
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
