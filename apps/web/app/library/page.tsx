import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { buildCanonicalUrl } from "@/lib/site-url"
import { LibraryCatalogProvider } from "./library-catalog-context"
import { LibraryShell } from "./library-shell"
import { StoriesGrid } from "./stories-grid"

export const metadata: Metadata = {
  title: "Library",
  description: "Browse published stories from writers on Mist Story.",
  alternates: {
    canonical: buildCanonicalUrl("/library"),
  },
  openGraph: {
    type: "website",
    title: "Library | Mist Story",
    description: "Browse published stories from writers on Mist Story.",
    url: buildCanonicalUrl("/library"),
    siteName: "Mist Story",
  },
  twitter: {
    card: "summary_large_image",
    title: "Library | Mist Story",
    description: "Browse published stories from writers on Mist Story.",
  },
}

export default function LibraryPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <LibraryCatalogProvider>
          <LibraryShell>
            <StoriesGrid />
          </LibraryShell>
        </LibraryCatalogProvider>
      </main>
      <Footer />
    </div>
  )
}
