import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { SettingsSkeleton } from "@/components/skeletons"

export default function SettingsLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <SettingsSkeleton />
      <Footer />
    </div>
  )
}
