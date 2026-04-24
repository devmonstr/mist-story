import type {
  ChapterDto,
  CreateNovelInput,
  NovelGenreSlug,
  NovelDto,
  StudioChapterListResponse,
} from "@myth/shared"
import { normalizeNovelGenreSlug } from "@myth/shared"
import { resolveNovelCoverSrc } from "./novel-cover"

export interface StudioNovelCard {
  id: string
  title: string
  description: string
  status: "published" | "draft"
  coverUrl: string | null
  chapters: number
  totalWords: number
  lastEdited: string
  reads: number
}

export interface StudioNovelFormData {
  title: string
  description: string
  genre: NovelGenreSlug | ""
  legacyGenreLabel: string | null
  status: "draft" | "publishing"
  workType: "ORIGINAL" | "TRANSLATION"
  tags: string[]
  coverImage: string | null
  coverImageName: string | null
  coverImageMimeType: string | null
  coverImageSizeBytes: number | null
  isComplete: boolean
  contentWarning: string
}

export interface EditorChapter {
  id: string
  title: string
  content: string
  wordCount: number
  lastEdited: string
  status: ChapterDto["status"]
  publishedAt: string | null
}

export interface EditorNovel {
  id: string
  title: string
  description: string
  coverImage: string | null
  chaptersCount: number
  visibility: NovelDto["visibility"]
  workType: NovelDto["workType"]
  status: NovelDto["status"]
}

export type EditorChapterList = StudioChapterListResponse["chapterList"]

export function mapNovelToCard(novel: NovelDto): StudioNovelCard {
  return {
    id: novel.id,
    title: novel.title,
    description: novel.summary,
    status: novel.visibility === "PUBLISHED" ? "published" : "draft",
    coverUrl: resolveNovelCoverSrc({
      novelId: novel.id,
      coverUrl: novel.coverUrl,
      coverStorageKey: novel.coverStorageKey,
    }),
    chapters: novel.chaptersCount,
    totalWords: 0,
    lastEdited: novel.updatedAt,
    reads: 0,
  }
}

export function mapNovelToFormData(novel: NovelDto): StudioNovelFormData {
  const normalizedGenre = normalizeNovelGenreSlug(novel.genre)

  return {
    title: novel.title,
    description: novel.summary,
    genre: normalizedGenre ?? "",
    legacyGenreLabel: normalizedGenre ? null : novel.genre.trim() || null,
    status: novel.visibility === "HIDDEN" ? "draft" : "publishing",
    workType: novel.workType,
    tags: novel.tags,
    coverImage: resolveNovelCoverSrc({
      novelId: novel.id,
      coverUrl: novel.coverUrl,
      coverStorageKey: novel.coverStorageKey,
    }),
    coverImageName: novel.coverOriginalName,
    coverImageMimeType: novel.coverMimeType,
    coverImageSizeBytes: novel.coverFileSizeBytes,
    isComplete: novel.isComplete,
    contentWarning: novel.contentWarning,
  }
}

export function buildNovelInputFromForm(
  formData: StudioNovelFormData,
  authorDisplayName = ""
): CreateNovelInput {
  const visibility = formData.status === "draft" ? "HIDDEN" : "PUBLISHED"
  const status = formData.isComplete ? "Completed" : "Ongoing"
  const genre = normalizeNovelGenreSlug(formData.genre)

  if (!genre) {
    throw new Error("Invalid genre")
  }

  return {
    title: formData.title,
    summary: formData.description,
    genre,
    workType: formData.workType,
    subgenres: [],
    tags: formData.tags,
    authorDisplayName,
    translatorName: "",
    isComplete: formData.isComplete,
    status,
    visibility,
    contentWarning: formData.contentWarning,
    updateNote: "",
    coverUrl:
      formData.coverImage && !formData.coverImage.startsWith("data:")
        ? formData.coverImage
        : "",
    clearCover: formData.coverImage === null,
    coverUpload:
      formData.coverImage &&
      formData.coverImage.startsWith("data:") &&
      formData.coverImageName &&
      formData.coverImageMimeType &&
      formData.coverImageSizeBytes
        ? {
            dataUrl: formData.coverImage,
            fileName: formData.coverImageName,
            mimeType: formData.coverImageMimeType,
            fileSizeBytes: formData.coverImageSizeBytes,
          }
        : undefined,
  }
}

export function mapChapterToEditorChapter(chapter: ChapterDto): EditorChapter {
  return {
    id: chapter.id,
    title: chapter.title,
    content: chapter.contentDraft || "<p>Start writing...</p>",
    wordCount: (chapter.contentDraft || "")
      .replace(/<[^>]+>/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length,
    lastEdited: chapter.updatedAt,
    status: chapter.status,
    publishedAt: chapter.publishedAt,
  }
}
