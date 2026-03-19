import type { ChapterDto, CreateNovelInput, NovelDto } from "@mist/shared"

export interface StudioNovelCard {
  id: string
  title: string
  description: string
  status: "published" | "draft"
  chapters: number
  totalWords: number
  lastEdited: string
  reads: number
}

export interface StudioNovelFormData {
  title: string
  description: string
  genre: string
  status: string
  tags: string[]
  coverImage: string | null
  isComplete: boolean
  contentWarning: string
}

export interface EditorChapter {
  id: string
  title: string
  content: string
  wordCount: number
  lastEdited: string
}

export function mapNovelToCard(novel: NovelDto): StudioNovelCard {
  return {
    id: novel.id,
    title: novel.title,
    description: novel.summary,
    status: novel.visibility === "PUBLISHED" ? "published" : "draft",
    chapters: novel.chaptersCount,
    totalWords: 0,
    lastEdited: novel.updatedAt,
    reads: 0,
  }
}

export function mapNovelToFormData(novel: NovelDto): StudioNovelFormData {
  return {
    title: novel.title,
    description: novel.summary,
    genre: novel.genre,
    status:
      novel.visibility === "HIDDEN"
        ? "draft"
        : novel.status === "Completed"
          ? "published"
          : "publishing",
    tags: novel.tags,
    coverImage: novel.coverUrl || null,
    isComplete: novel.status === "Completed",
    contentWarning: "",
  }
}

export function buildNovelInputFromForm(
  formData: StudioNovelFormData,
  authorDisplayName = ""
): CreateNovelInput {
  const visibility = formData.status === "draft" ? "HIDDEN" : "PUBLISHED"
  const status = formData.status === "published" ? "Completed" : "Ongoing"

  return {
    title: formData.title,
    summary: formData.description,
    genre: formData.genre,
    subgenres: [],
    tags: formData.tags,
    authorDisplayName,
    translatorName: "",
    status,
    visibility,
    updateNote: "",
    coverUrl: formData.coverImage || "",
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
  }
}
