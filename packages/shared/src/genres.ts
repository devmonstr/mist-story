export const NOVEL_GENRES = [
  {
    slug: "action",
    label: "Action",
    description: "Fast-paced stories with conflict, danger, and momentum.",
    aliases: [],
  },
  {
    slug: "adventure",
    label: "Adventure",
    description: "Journeys, quests, expeditions, and discoveries.",
    aliases: [],
  },
  {
    slug: "comedy",
    label: "Comedy",
    description: "Lighthearted stories built around humor and charm.",
    aliases: [],
  },
  {
    slug: "drama",
    label: "Drama",
    description: "Character-driven stories with emotional stakes.",
    aliases: [],
  },
  {
    slug: "fantasy",
    label: "Fantasy",
    description: "Epic adventures, magic, and otherworldly realms.",
    aliases: [],
  },
  {
    slug: "romance",
    label: "Romance",
    description: "Love stories that touch the heart and inspire.",
    aliases: [],
  },
  {
    slug: "sci-fi",
    label: "Sci-Fi",
    description: "Futuristic worlds, speculative science, and imaginative technology.",
    aliases: ["science-fiction", "science fiction", "sci fi"],
  },
  {
    slug: "horror",
    label: "Horror",
    description: "Dark, eerie, and unsettling tales.",
    aliases: [],
  },
  {
    slug: "mystery",
    label: "Mystery",
    description: "Suspenseful tales that keep you guessing until the end.",
    aliases: ["mystery & thriller", "mystery-thriller"],
  },
  {
    slug: "thriller",
    label: "Thriller",
    description: "High-tension stories packed with suspense.",
    aliases: [],
  },
  {
    slug: "supernatural",
    label: "Supernatural",
    description: "Ghosts, spirits, curses, and forces beyond the ordinary.",
    aliases: [],
  },
  {
    slug: "historical",
    label: "Historical",
    description: "Stories shaped by the atmosphere and conflicts of the past.",
    aliases: ["historical-fiction", "historical fiction"],
  },
  {
    slug: "slice-of-life",
    label: "Slice of Life",
    description: "Everyday moments, relationships, and gentle growth.",
    aliases: ["slice of life"],
  },
  {
    slug: "sports",
    label: "Sports",
    description: "Competition, teamwork, rivalry, and athletic ambition.",
    aliases: [],
  },
  {
    slug: "psychological",
    label: "Psychological",
    description: "Mind games, inner conflict, and intense character tension.",
    aliases: [],
  },
  {
    slug: "martial-arts",
    label: "Martial Arts",
    description: "Combat discipline, rivalry, training, and mastery.",
    aliases: ["martial arts"],
  },
  {
    slug: "school-life",
    label: "School Life",
    description: "Campus friendships, youth, classes, and coming-of-age stories.",
    aliases: ["school life"],
  },
  {
    slug: "wuxia",
    label: "Wuxia",
    description: "Martial heroes, honor, sects, and Jianghu adventures.",
    aliases: [],
  },
  {
    slug: "xianxia",
    label: "Xianxia",
    description: "Immortals, cultivation, heavenly realms, and Daoist fantasy.",
    aliases: [],
  },
  {
    slug: "xuanhuan",
    label: "Xuanhuan",
    description: "Eastern fantasy worlds with flexible magic and power systems.",
    aliases: [],
  },
  {
    slug: "cultivation",
    label: "Cultivation",
    description: "Power progression, realms, techniques, and ascension.",
    aliases: [],
  },
  {
    slug: "isekai",
    label: "Isekai",
    description: "Characters transported, reborn, or trapped in another world.",
    aliases: [],
  },
  {
    slug: "shounen",
    label: "Shounen",
    description: "Energetic stories of growth, friendship, and ambition.",
    aliases: [],
  },
  {
    slug: "shoujo",
    label: "Shoujo",
    description: "Emotion-forward stories centered on relationships and growth.",
    aliases: [],
  },
  {
    slug: "seinen",
    label: "Seinen",
    description: "Mature stories with complex themes and grounded stakes.",
    aliases: [],
  },
  {
    slug: "josei",
    label: "Josei",
    description: "Adult relationship and life stories with nuanced emotion.",
    aliases: [],
  },
  {
    slug: "bl",
    label: "BL",
    description: "Boys' love stories focused on male-male romance.",
    aliases: ["boys love", "boys' love"],
  },
  {
    slug: "gl",
    label: "GL",
    description: "Girls' love stories focused on female-female romance.",
    aliases: ["girls love", "girls' love"],
  },
  {
    slug: "mature",
    label: "Mature",
    description: "Stories intended for mature readers and heavier themes.",
    aliases: [],
  },
] as const

export type NovelGenre = (typeof NOVEL_GENRES)[number]
export type NovelGenreSlug = NovelGenre["slug"]

export const NOVEL_GENRE_SLUGS = NOVEL_GENRES.map((genre) => genre.slug) as [
  NovelGenreSlug,
  ...NovelGenreSlug[],
]

function normalizeGenreLookupKey(value: string) {
  return value.trim().toLowerCase().replace(/_/g, "-").replace(/\s+/g, " ")
}

const NOVEL_GENRE_LOOKUP = new Map<string, NovelGenreSlug>()
const NOVEL_GENRE_BY_SLUG = new Map<NovelGenreSlug, NovelGenre>()

for (const genre of NOVEL_GENRES) {
  NOVEL_GENRE_BY_SLUG.set(genre.slug, genre)
  NOVEL_GENRE_LOOKUP.set(normalizeGenreLookupKey(genre.slug), genre.slug)
  NOVEL_GENRE_LOOKUP.set(normalizeGenreLookupKey(genre.label), genre.slug)

  for (const alias of genre.aliases) {
    NOVEL_GENRE_LOOKUP.set(normalizeGenreLookupKey(alias), genre.slug)
  }
}

function humanizeGenre(value: string) {
  return value
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function normalizeNovelGenreSlug(value: string | null | undefined) {
  if (!value?.trim()) {
    return null
  }

  return NOVEL_GENRE_LOOKUP.get(normalizeGenreLookupKey(value)) ?? null
}

export function getNovelGenre(value: string | null | undefined) {
  const slug = normalizeNovelGenreSlug(value)
  return slug ? NOVEL_GENRE_BY_SLUG.get(slug) ?? null : null
}

export function getNovelGenreLabel(value: string | null | undefined) {
  const genre = getNovelGenre(value)
  return genre?.label ?? (value?.trim() ? humanizeGenre(value) : "Unknown")
}

export function getNovelGenreDescription(value: string | null | undefined) {
  return getNovelGenre(value)?.description ?? "Discover stories and voices in this genre."
}
