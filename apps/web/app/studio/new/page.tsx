"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, X } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
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
import { useRequireAuth } from "@/hooks/use-require-auth"
import { createNovel } from "@/lib/api"
import {
  buildNovelInputFromForm,
  type StudioNovelFormData,
} from "@/lib/studio"

const GENRES = [
  "Fantasy",
  "Science Fiction",
  "Romance",
  "Mystery",
  "Thriller",
  "Horror",
  "Historical Fiction",
  "Literary Fiction",
  "Adventure",
  "Drama",
  "Comedy",
  "Other",
]

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft (Private)" },
  { value: "publishing", label: "Publishing (Serializing)" },
  { value: "published", label: "Published (Complete)" },
]

export default function NewNovelPage() {
  const { user, isLoading, isAuthenticated } = useRequireAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState<StudioNovelFormData>({
    title: "",
    description: "",
    genre: "",
    status: "draft",
    tags: [],
    coverImage: null,
    isComplete: false,
    contentWarning: "",
  })
  const [tagInput, setTagInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof StudioNovelFormData, string>> = {}

    if (!formData.title.trim()) nextErrors.title = "Title is required"
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
      const payload = buildNovelInputFromForm(
        formData,
        user?.profile?.display_name || user?.profile?.name || ""
      )
      const novel = await createNovel(payload)
      router.push(`/studio/${novel.id}`)
    } catch (error) {
      console.error("Failed to create novel:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      updateField("coverImage", event.target?.result as string)
    }
    reader.readAsDataURL(file)
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

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <Link
            href="/studio"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Studio
          </Link>

          <div className="mb-8">
            <h1 className="font-serif text-2xl font-medium text-foreground sm:text-3xl">
              Create a New Novel
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Start your writing journey. You can always change these details later.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
                <CardDescription>Essential details about your novel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="Enter your novel's title"
                  />
                  {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Tell readers what your story is about"
                    rows={5}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Genre</Label>
                    <Select
                      value={formData.genre}
                      onValueChange={(value) => updateField("genre", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a genre" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENRES.map((genre) => (
                          <SelectItem key={genre} value={genre}>
                            {genre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.genre && <p className="text-xs text-destructive">{errors.genre}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => updateField("status", value)}
                    >
                      <SelectTrigger>
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
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tags and Cover</CardTitle>
                <CardDescription>Add details to help readers discover your work.</CardDescription>
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
                      placeholder="Add a tag"
                    />
                    <Button type="button" variant="outline" onClick={handleAddTag}>
                      Add
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs"
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
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Cover Image</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageChange}
                    className="block w-full text-sm"
                  />
                  {formData.coverImage && (
                    <div className="flex items-center gap-3">
                      <img
                        src={formData.coverImage}
                        alt=""
                        className="h-20 w-14 rounded object-cover"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          updateField("coverImage", null)
                          if (fileInputRef.current) fileInputRef.current.value = ""
                        }}
                      >
                        Remove image
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" asChild>
                <Link href="/studio">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Novel"}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
