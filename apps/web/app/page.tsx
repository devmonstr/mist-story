import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { FeaturedStoriesSection } from "@/components/featured-stories-section"
import { CtaSection } from "@/components/cta-section"

export const revalidate = 3600

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <FeaturedStoriesSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  )
}
