import type { Metadata } from "next"
import { Suspense } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { buildCanonicalUrl } from "@/lib/site-url"
import { SearchPageContent } from "./search-page-content"

export const metadata: Metadata = {
  title: "Search",
  description: "Search stories and writers on Myth Story.",
  alternates: {
    canonical: buildCanonicalUrl("/search"),
  },
  openGraph: {
    type: "website",
    title: "Search | Myth Story",
    description: "Search stories and writers on Myth Story.",
    url: buildCanonicalUrl("/search"),
    siteName: "Myth Story",
  },
  twitter: {
    card: "summary_large_image",
    title: "Search | Myth Story",
    description: "Search stories and writers on Myth Story.",
  },
}

export default function SearchPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
        <Suspense fallback={<SearchLoading />}>
          <SearchPageContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}

function SearchLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-pulse rounded-full border border-border/60" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
