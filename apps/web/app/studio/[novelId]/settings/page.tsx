"use client"

import { useEffect, useRef, useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, X } from "lucide-react"
import { useAuth } from "@/context/auth-context"
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
import { fetchNovel, updateNovel } from "@/lib/api"
import {
  buildNovelInputFromForm,
  mapNovelToFormData,
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

export default function NovelSettingsPage({
  params,
}: {
  params: Promise<{ novelId: string }>
}) {
  const { novelId } = use(params)
  const { user, isLoading } = useAuth()
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
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/sign-in")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (!user) return

    const loadNovel = async () => {
      try {
        const novel = await fetchNovel(novelId)
        setFormData(mapNovelToFormData(novel))
      } catch (error) {
        console.error("Failed to load novel:", error)
      } finally {
        setIsLoaded(true)
      }
    }

    void loadNovel()
  }, [novelId, user])

  const updateField = <K extends keyof StudioNovelFormData>(
    field: K,
    value: StudioNovelFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()

    try {
      setIsSubmitting(true)
      await updateNovel(
        novelId,
        buildNovelInputFromForm(
          formData,
          user?.profile?.display_name || user?.profile?.name || ""
        )
      )
      router.push(`/studio/${novelId}`)
    } catch (error) {
      console.error("Failed to update novel:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || !isLoaded) {
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

  if (!user) return null

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <Link
            href={`/studio/${novelId}`}
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Editor
          </Link>

          <form onSubmit={handleSave} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Novel Settings</CardTitle>
                <CardDescription>Update your novel metadata and presentation.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
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
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GENRES.map((genre) => (
                          <SelectItem key={genre} value={genre}>
                            {genre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          const value = tagInput.trim().toLowerCase()
                          if (value && !formData.tags.includes(value)) {
                            updateField("tags", [...formData.tags, value])
                            setTagInput("")
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const value = tagInput.trim().toLowerCase()
                        if (value && !formData.tags.includes(value)) {
                          updateField("tags", [...formData.tags, value])
                          setTagInput("")
                        }
                      }}
                    >
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
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = (loadEvent) => {
                        updateField("coverImage", loadEvent.target?.result as string)
                      }
                      reader.readAsDataURL(file)
                    }}
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
                <Link href={`/studio/${novelId}`}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
