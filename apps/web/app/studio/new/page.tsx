"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Loader2,
  Plus,
  X,
} from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  NovelCoverImageField,
  type NovelCoverImageSelection,
} from "@/components/novel/novel-cover-image-field"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { createNovel } from "@/lib/api"
import { NOVEL_GENRES } from "@myth/shared"
import {
  buildNovelInputFromForm,
  type StudioNovelFormData,
} from "@/lib/studio"

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft (Private)" },
  { value: "publishing", label: "Publishing (Visible to readers)" },
]

const WORK_TYPE_OPTIONS = [
  { value: "ORIGINAL", label: "Original" },
  { value: "TRANSLATION", label: "Translation" },
] as const

export default function NewNovelPage() {
  const { user, isLoading, isAuthenticated } = useRequireAuth()
  const router = useRouter()
  const [formData, setFormData] = useState<StudioNovelFormData>({
    title: "",
    description: "",
    genre: "",
    legacyGenreLabel: null,
    status: "draft",
    workType: "ORIGINAL",
    tags: [],
    coverImage: null,
    coverImageName: null,
    coverImageMimeType: null,
    coverImageSizeBytes: null,
    isComplete: false,
    contentWarning: "",
  })
  const [tagInput, setTagInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [coverError, setCoverError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof StudioNovelFormData, string>>>({})

  const updateField = <K extends keyof StudioNovelFormData>(
    field: K,
    value: StudioNovelFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase()
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      updateField("tags", [...formData.tags, trimmedTag])
      setTagInput("")
    }
  }

  const handleCoverImageChange = (coverImage: NovelCoverImageSelection | null) => {
    updateField("coverImage", coverImage?.dataUrl ?? null)
    updateField("coverImageName", coverImage?.fileName ?? null)
    updateField("coverImageMimeType", coverImage?.mimeType ?? null)
    updateField("coverImageSizeBytes", coverImage?.fileSizeBytes ?? null)
  }

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof StudioNovelFormData, string>> = {}

    if (!formData.title.trim()) nextErrors.title = "Title is required"
    if (formData.title.length > 200) {
      nextErrors.title = "Title must be less than 200 characters"
    }
    if (!formData.genre.trim()) nextErrors.genre = "Please select a genre"
    if (formData.description.length > 2000) {
      nextErrors.description = "Description must be less than 2000 characters"
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validateForm()) return

    try {
      setIsSubmitting(true)
      setSubmitError(null)
      const payload = buildNovelInputFromForm(
        formData,
        user?.profile?.display_name || user?.profile?.name || ""
      )
      const novel = await createNovel(payload)
      router.push(`/studio/${novel.id}`)
    } catch (error) {
      console.error("Failed to create novel:", error)
      setSubmitError(
        error instanceof Error
          ? error.message
          : "We could not create your novel right now."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!isAuthenticated) return null

  const storySnapshot = [
    formData.workType === "TRANSLATION" ? "Translation" : "Original",
    formData.status === "draft" ? "Private draft" : "Visible to readers",
    formData.isComplete ? "Completed" : "Ongoing",
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <Link
            href="/studio"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Studio
          </Link>

          <div className="mb-8 overflow-hidden border border-border bg-card shadow-none">
            <div className="grid gap-8 px-6 py-8 md:grid-cols-[1.4fr_0.9fr] md:px-8">
              <div>
                <div className="inline-flex items-center border border-border bg-background px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  New Story
                </div>
                <h1 className="mt-4 font-serif text-3xl font-medium text-foreground sm:text-4xl">
                  Create a New Novel
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Start with the essentials, shape the tone of your story, and give
                  readers a strong first impression. You can refine these details again
                  from your studio later.
                </p>
              </div>

              <div className="grid gap-3 self-start">
                <div className="border border-border bg-background p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Quick checklist
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-foreground">
                    <li>Choose a clear title, genre, and work type</li>
                    <li>Add a strong synopsis for discovery</li>
                    <li>Upload a polished cover to make the project feel real</li>
                  </ul>
                </div>
                <div className="border border-border bg-background p-4 text-sm text-muted-foreground">
                  Draft novels stay private until you decide to make them visible.
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="rounded-none border-border bg-card shadow-none">
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
                <CardDescription>Essential details about your novel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="Enter your novel's title"
                    className={errors.title ? "rounded-none border-destructive" : "rounded-none"}
                  />
                  {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
                  <p className="text-xs text-muted-foreground">
                    {formData.title.length}/200 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="A short synopsis, premise, or hook for your story..."
                    rows={5}
                    className={errors.description ? "rounded-none border-destructive" : "rounded-none"}
                  />
                  {errors.description && (
                    <p className="text-xs text-destructive">{errors.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formData.description.length}/2000 characters
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label>
                      Genre <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.genre}
                      onValueChange={(value) =>
                        updateField("genre", value as StudioNovelFormData["genre"])
                      }
                    >
                      <SelectTrigger className={errors.genre ? "rounded-none border-destructive" : "rounded-none"}>
                        <SelectValue placeholder="Select a genre" />
                      </SelectTrigger>
                      <SelectContent>
                        {NOVEL_GENRES.map((genre) => (
                          <SelectItem key={genre.slug} value={genre.slug}>
                            {genre.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.genre && <p className="text-xs text-destructive">{errors.genre}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Work Type</Label>
                    <Select
                      value={formData.workType}
                      onValueChange={(value) => updateField("workType", value as StudioNovelFormData["workType"])}
                    >
                      <SelectTrigger className="rounded-none">
                        <SelectValue placeholder="Choose original or translation" />
                      </SelectTrigger>
                      <SelectContent>
                        {WORK_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Use this to label the project as an original work or a translation.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Visibility</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        updateField("status", value as StudioNovelFormData["status"])
                      }
                    >
                      <SelectTrigger className="rounded-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Private drafts are only visible to you. Publishing makes the novel discoverable.
                    </p>
                  </div>
                </div>

                <div className="border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="is-complete" className="text-sm font-medium text-foreground">
                        Mark this novel as complete
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Completed novels are shown as finished reading experiences across the site.
                      </p>
                    </div>
                    <Checkbox
                      id="is-complete"
                      checked={formData.isComplete}
                      onCheckedChange={(checked) => updateField("isComplete", checked === true)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <NovelCoverImageField
              coverImage={formData.coverImage}
              coverImageName={formData.coverImageName}
              error={coverError}
              onErrorChange={setCoverError}
              onChange={handleCoverImageChange}
            />

            <Card className="rounded-none border-border bg-card shadow-none">
              <CardHeader>
                <CardTitle className="text-lg">Tags</CardTitle>
                <CardDescription>
                  Add tags to help readers discover your novel.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddTag()
                        }
                      }}
                      placeholder="Add a tag and press Enter"
                      className="rounded-none"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleAddTag}
                      disabled={!tagInput.trim()}
                      className="rounded-none"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 border border-border bg-background px-3 py-1 text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() =>
                              updateField(
                                "tags",
                                formData.tags.filter((item) => item !== tag)
                              )
                            }
                            className="p-0.5 transition-colors hover:bg-muted"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Lowercase tags work best for consistency and search.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-none border-border bg-card shadow-none">
              <CardHeader>
                <CardTitle className="text-lg">Content Warning</CardTitle>
                <CardDescription>
                  Optional notes for readers about sensitive material.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={formData.contentWarning}
                  onChange={(e) => updateField("contentWarning", e.target.value)}
                  placeholder="Contains violence, strong language, mature themes..."
                  rows={3}
                  className="rounded-none"
                />
                <p className="text-xs text-muted-foreground">
                  This warning is saved with the novel metadata and can be shown to readers later.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-none border-border bg-card shadow-none">
              <CardHeader>
                <CardTitle className="text-lg">Story Snapshot</CardTitle>
                <CardDescription>
                  A quick preview of how this project is framed before you create it.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {storySnapshot.map((item) => (
                    <span
                      key={item}
                      className="border border-border bg-background px-3 py-1 text-xs font-medium text-foreground"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <div className="border border-dashed border-border bg-background p-4">
                  <p className="font-serif text-xl text-foreground">
                    {formData.title.trim() || "Your novel title"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {formData.description.trim() ||
                      "Your synopsis will appear here as a quick preview once you add one."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {submitError ? (
              <div className="border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {submitError}
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" asChild className="rounded-none sm:min-w-[120px]">
                <Link href="/studio">Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.title.trim()}
                className="rounded-none sm:min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Novel"
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
