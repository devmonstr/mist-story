import {
  createNovelForAuthor,
  findNovelByIdOrSlug,
  listNovelsForAuthor,
  listPublishedNovels,
  serializeNovel,
  updateNovelForAuthor,
} from "@mist/db"
import type { CreateNovelInput, UpdateNovelInput } from "@mist/shared"
import { HttpError } from "../utils/http-error"

export async function listNovels(currentUserId?: string) {
  const novels = currentUserId
    ? await listNovelsForAuthor(currentUserId)
    : await listPublishedNovels()

  return novels.map(serializeNovel)
}

export async function getNovel(identifier: string) {
  const novel = await findNovelByIdOrSlug(identifier)
  if (!novel) {
    throw new HttpError(404, "Novel not found")
  }

  return serializeNovel(novel)
}

export async function createNovel(userId: string, input: CreateNovelInput) {
  const created = await createNovelForAuthor(userId, input)
  return serializeNovel(created)
}

export async function updateNovel(
  userId: string,
  novelId: string,
  input: UpdateNovelInput
) {
  const updated = await updateNovelForAuthor(userId, novelId, input)
  return serializeNovel(updated)
}
