"use client"

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
import { ArrowLeft, Loader2, Image as ImageIcon, X, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"

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

interface NovelFormData {
  title: string
  description: string
  genre: string
  status: string
  tags: string[]
  coverImage: string | null
  isComplete: boolean
  contentWarning: string
}

export default function NewNovelPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState<NovelFormData>({
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
  const [errors, setErrors] = useState<Partial<Record<keyof NovelFormData, string>>>({})

  // Redirect if not signed in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/sign-in")
    }
  }, [user, isLoading, router])

  const updateField = <K extends keyof NovelFormData>(
    field: K,
    value: NovelFormData[K]
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

  const handleRemoveTag = (tagToRemove: string) => {
    updateField(
      "tags",
      formData.tags.filter((tag) => tag !== tagToRemove)
    )
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({ ...prev, coverImage: "Please select an image file" }))
        return
      }
      
      const reader = new FileReader()
      reader.onload = (event) => {
        updateField("coverImage", event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveCoverImage = () => {
    updateField("coverImage", null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof NovelFormData, string>> = {}
    
    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
    }
    
    if (formData.title.length > 200) {
      newErrors.title = "Title must be less than 200 characters"
    }
    
    if (formData.description.length > 2000) {
      newErrors.description = "Description must be less than 2000 characters"
    }
    
    if (!formData.genre) {
      newErrors.genre = "Please select a genre"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    console.log("Novel data:", formData)
    
    // In a real app, this would create the novel via API
    // and redirect to the novel's editor page
    router.push("/studio")
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

  if (!user) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          {/* Back Link */}
          <Link
            href="/studio"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Studio
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-serif text-2xl font-medium text-foreground sm:text-3xl">
              Create a New Novel
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Start your writing journey. You can always change these details later.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
                <CardDescription>
                  Essential details about your novel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="Enter your novel's title"
                    className={errors.title ? "border-destructive" : ""}
                  />
                  {errors.title && (
                    <p className="text-xs text-destructive">{errors.title}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formData.title.length}/200 characters
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="A brief description of your story..."
                    rows={4}
                    className={errors.description ? "border-destructive" : ""}
                  />
                  {errors.description && (
                    <p className="text-xs text-destructive">{errors.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formData.description.length}/2000 characters
                  </p>
                </div>

                {/* Genre */}
                <div className="space-y-2">
                  <Label htmlFor="genre">
                    Genre <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.genre}
                    onValueChange={(value) => updateField("genre", value)}
                  >
                    <SelectTrigger className={errors.genre ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select a genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENRES.map((g) => (
                        <SelectItem key={g} value={g.toLowerCase()}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.genre && (
                    <p className="text-xs text-destructive">{errors.genre}</p>
                  )}
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">Publication Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => updateField("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
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
                    Draft novels are only visible to you
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Cover Image */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cover Image</CardTitle>
                <CardDescription>
                  Upload a cover image for your novel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  {formData.coverImage ? (
                    <div className="relative">
                      <img
                        src={formData.coverImage}
                        alt="Cover preview"
                        className="h-48 w-32 rounded-lg object-cover border"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveCoverImage}
                        className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-48 w-32 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted transition-colors hover:border-foreground/50"
                    >
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-xs text-muted-foreground">
                          Click to upload
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageChange}
                      className="hidden"
                    />
                    {errors.coverImage && (
                      <p className="text-xs text-destructive">{errors.coverImage}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Recommended: 600x900px (2:3 ratio)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supported formats: JPG, PNG, WEBP
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Maximum file size: 5MB
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tags</CardTitle>
                <CardDescription>
                  Add tags to help readers discover your novel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Add a tag (press Enter)"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAddTag}
                    disabled={!tagInput.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Content Warning */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Content Warning (Optional)</CardTitle>
                <CardDescription>
                  Add any content warnings for sensitive material
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.contentWarning}
                  onChange={(e) => updateField("contentWarning", e.target.value)}
                  placeholder="e.g., Contains violence, strong language, mature themes..."
                  rows={3}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  This helps readers make informed decisions about your content
                </p>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
              <Button variant="outline" type="button" asChild>
                <Link href="/studio">Cancel</Link>
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !formData.title.trim()}
                className="min-w-[120px]"
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
