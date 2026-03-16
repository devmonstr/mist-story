export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-serif text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: March 16, 2026</p>

        <div className="prose prose-neutral max-w-none space-y-8">
          <section>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">1. Introduction</h2>
            <p className="text-foreground leading-relaxed">
              Inkwell ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">2. Information We Collect</h2>
            <p className="text-foreground leading-relaxed mb-3">We may collect information about you in a variety of ways. The information we may collect on the Site includes:</p>
            <ul className="list-disc list-inside space-y-2 text-foreground">
              <li><strong>Personal Data:</strong> Email address, display name, bio, location, and website URL you provide voluntarily</li>
              <li><strong>Nostr Data:</strong> Your public key (npub) and associated Nostr profile information from your NIP-07 extension</li>
              <li><strong>Usage Data:</strong> Reading history, bookmarks, reading progress, and engagement with content</li>
              <li><strong>Technical Data:</strong> IP address, browser type, pages visited, and time spent on pages</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">3. How We Use Your Information</h2>
            <p className="text-foreground leading-relaxed mb-3">We use the collected information for various purposes:</p>
            <ul className="list-disc list-inside space-y-2 text-foreground">
              <li>To provide and maintain our services</li>
              <li>To notify you about changes to our services</li>
              <li>To provide customer support and respond to inquiries</li>
              <li>To gather analysis and feedback to improve our services</li>
              <li>To monitor and analyze usage and trends</li>
              <li>To detect and prevent fraudulent transactions and other illegal activities</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">4. Data Security</h2>
            <p className="text-foreground leading-relaxed">
              We implement appropriate technical and organizational measures designed to protect personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">5. Nostr Privacy</h2>
            <p className="text-foreground leading-relaxed">
              Our platform is built on Nostr, a decentralized protocol. Your content published through our platform may be distributed across Nostr relays. Your public profile information is publicly accessible by default, though you can control what information you choose to make public through your settings.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">6. Cookies and Tracking</h2>
            <p className="text-foreground leading-relaxed">
              We use cookies to enhance your experience. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Site.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">7. Third-Party Links</h2>
            <p className="text-foreground leading-relaxed">
              Our Site may contain links to third-party websites. We are not responsible for the privacy practices of other websites. We encourage you to review their privacy policies before providing your personal information.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">8. Contact Us</h2>
            <p className="text-foreground leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at privacy@inkwell.app
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
