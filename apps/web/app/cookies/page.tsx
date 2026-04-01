import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function CookiesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="font-serif text-4xl font-bold text-foreground mb-2">Cookie Policy</h1>
          <p className="text-sm text-muted-foreground mb-12">Last updated: March 16, 2026</p>

          <div className="prose prose-neutral max-w-none space-y-8">
            <section>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">1. What Are Cookies</h2>
              <p className="text-foreground leading-relaxed">
                Cookies are small text files that are placed on your computer by websites that you visit. They are widely used in order to make websites work more efficiently, as well as to provide information to the owners of the site.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">2. How We Use Cookies</h2>
              <p className="text-foreground leading-relaxed mb-3">Mist Story uses cookies for the following purposes:</p>
              <ul className="list-disc list-inside space-y-2 text-foreground">
                <li><strong>Essential Cookies:</strong> Required for the website to function properly</li>
                <li><strong>Authentication:</strong> To keep you signed in and remember your preferences</li>
                <li><strong>Analytics:</strong> To understand how visitors use our website</li>
                <li><strong>Preferences:</strong> To remember your settings like theme preferences</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">3. Managing Cookies</h2>
              <p className="text-foreground leading-relaxed">
                Most web browsers allow you to control cookies through their settings. You can typically find these settings in the &quot;options&quot; or &quot;preferences&quot; menu of your browser. Please note that limiting cookies may affect your experience on our website.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">4. Third-Party Cookies</h2>
              <p className="text-foreground leading-relaxed">
                Some cookies are placed by third-party services that appear on our pages. We do not control these cookies and recommend reviewing the privacy policies of these third parties.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">5. Changes to This Policy</h2>
              <p className="text-foreground leading-relaxed">
                We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">6. Contact Us</h2>
              <p className="text-foreground leading-relaxed">
                If you have questions about this Cookie Policy, please contact us at privacy@miststory.app
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
