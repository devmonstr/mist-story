'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HelpCircle, MessageCircle, Mail, BookOpen } from 'lucide-react'
import { useState } from 'react'

export default function SupportPage() {
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)

  const faqs = [
    {
      id: '1',
      question: 'How do I sign in to Inkwell?',
      answer: 'Inkwell uses Nostr NIP-07 for authentication. You\'ll need a compatible browser extension like Alby, nos2x, or Nostr Connect. Visit our Sign In page and click "Connect with Nostr" to authenticate using your extension.',
    },
    {
      id: '2',
      question: 'How can I publish my novel on Inkwell?',
      answer: 'After signing in, go to your Studio and click "Create New Novel". Fill in the novel details, then start writing chapters. You can save drafts and publish when ready. Published novels are distributed across Nostr relays.',
    },
    {
      id: '3',
      question: 'Is my content secure on Inkwell?',
      answer: 'Your content is secured using your Nostr keypair. Only you can publish or modify your work. Content is decentralized across Nostr relays, ensuring it remains available even if any single service goes down.',
    },
    {
      id: '4',
      question: 'Can I delete my account?',
      answer: 'You can clear your reading history and preferences in Settings. However, due to Nostr\'s decentralized nature, published content on relays cannot be permanently deleted. You can mark novels as private or unpublish them.',
    },
    {
      id: '5',
      question: 'How do I report inappropriate content?',
      answer: 'If you encounter content that violates our community guidelines, please use the report button on the content page or contact us at support@inkwell.app with details.',
    },
    {
      id: '6',
      question: 'What Nostr extensions are supported?',
      answer: 'We support all NIP-07 compatible extensions including Alby, nos2x, Nostr Connect, and others. You can download a recommended extension from our Sign In page.',
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <HelpCircle className="h-8 w-8 text-foreground" />
            <h1 className="font-serif text-3xl font-bold text-foreground">Help & Support</h1>
          </div>
          <p className="text-muted-foreground">Get answers to common questions or reach out to our team</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Support Options */}
        <div className="grid gap-6 md:grid-cols-3 mb-12">
          <div className="border border-border/40 rounded bg-card p-6 flex flex-col items-center text-center">
            <Mail className="h-8 w-8 text-foreground mb-3" />
            <h3 className="font-medium text-foreground mb-2">Email Support</h3>
            <p className="text-sm text-muted-foreground mb-4">Reach our support team</p>
            <Button variant="outline" asChild className="w-full">
              <a href="mailto:support@inkwell.app">Send Email</a>
            </Button>
          </div>

          <div className="border border-border/40 rounded bg-card p-6 flex flex-col items-center text-center">
            <MessageCircle className="h-8 w-8 text-foreground mb-3" />
            <h3 className="font-medium text-foreground mb-2">Live Chat</h3>
            <p className="text-sm text-muted-foreground mb-4">Chat with support instantly</p>
            <Button variant="outline" className="w-full">
              Start Chat
            </Button>
          </div>

          <div className="border border-border/40 rounded bg-card p-6 flex flex-col items-center text-center">
            <BookOpen className="h-8 w-8 text-foreground mb-3" />
            <h3 className="font-medium text-foreground mb-2">Documentation</h3>
            <p className="text-sm text-muted-foreground mb-4">Read our guides</p>
            <Button variant="outline" asChild className="w-full">
              <Link href="/guides">View Guides</Link>
            </Button>
          </div>
        </div>

        {/* FAQ Section */}
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.id} className="border border-border/40 rounded overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-card hover:bg-muted transition-colors"
                >
                  <span className="font-medium text-foreground text-left">{faq.question}</span>
                  <span className={`text-muted-foreground transition-transform ${expandedFaq === faq.id ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                {expandedFaq === faq.id && (
                  <div className="px-6 py-4 bg-background border-t border-border/40">
                    <p className="text-sm text-foreground leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
