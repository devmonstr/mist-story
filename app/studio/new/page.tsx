"use client"

import { useAuth } from "@/context/auth-context"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

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

export default function NewNovelPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [genre, setGenre] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if not signed in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/sign-in")
    }
  }, [user, isLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    // Simulate creation
    await new Promise((resolve) => setTimeout(resolve, 500))
    
    // In a real app, this would create the novel and redirect to its editor
    router.push("/studio/new-novel")
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
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
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
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Title <span className="text-destructive">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter your novel's title"
                className="w-full border border-border bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of your story..."
                rows={4}
                className="w-full resize-none border border-border bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                This will appear on your novel's page. Keep it intriguing!
              </p>
            </div>

            {/* Genre */}
            <div>
              <label
                htmlFor="genre"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Genre
              </label>
              <select
                id="genre"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full appearance-none border border-border bg-card px-4 py-3 text-base text-foreground focus:border-foreground focus:outline-none"
              >
                <option value="">Select a genre</option>
                {GENRES.map((g) => (
                  <option key={g} value={g.toLowerCase()}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
              <Button variant="outline" type="button" asChild>
                <Link href="/studio">Cancel</Link>
              </Button>
              <Button type="submit" disabled={!title.trim() || isSubmitting}>
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
