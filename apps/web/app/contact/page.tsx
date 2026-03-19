'use client'

import { useState } from 'react'
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from '@/components/ui/button'
import { Mail, Phone, MapPin } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log('Form submitted:', formData)
    setFormData({ name: '', email: '', subject: '', message: '' })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="font-serif text-4xl font-bold text-foreground mb-4">Get in Touch</h1>
          <p className="text-lg text-muted-foreground">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Contact Form */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a subject</option>
                  <option value="technical-support">Technical Support</option>
                  <option value="bug-report">Bug Report</option>
                  <option value="feature-request">Feature Request</option>
                  <option value="general-inquiry">General Inquiry</option>
                  <option value="partnership">Partnership Opportunity</option>
                  <option value="content-concern">Content Concern</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-2 border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Your message"
                />
              </div>

              <Button type="submit" className="w-full">
                Send Message
              </Button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div className="border-l-2 border-muted-foreground/30 pl-6">
              <Mail className="h-6 w-6 text-foreground mb-3" />
              <h3 className="font-medium text-foreground mb-2">Email</h3>
              <a href="mailto:hello@Mist Story.app" className="text-primary hover:underline">
                hello@Mist Story.app
              </a>
              <p className="text-sm text-muted-foreground mt-2">
                We typically respond within 24 hours
              </p>
            </div>

            <div className="border-l-2 border-muted-foreground/30 pl-6">
              <Phone className="h-6 w-6 text-foreground mb-3" />
              <h3 className="font-medium text-foreground mb-2">Support</h3>
              <p className="text-primary">support@Mist Story.app</p>
              <p className="text-sm text-muted-foreground mt-2">
                Available Monday to Friday, 9 AM - 6 PM PT
              </p>
            </div>

            <div className="border-l-2 border-muted-foreground/30 pl-6">
              <MapPin className="h-6 w-6 text-foreground mb-3" />
              <h3 className="font-medium text-foreground mb-2">Location</h3>
              <p className="text-foreground">
                Mist Story<br />
                San Francisco, California<br />
                United States
              </p>
            </div>

            {/* Response Time */}
            <div className="border border-border/40 rounded bg-card p-6">
              <h3 className="font-medium text-foreground mb-3">Response Times</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex justify-between">
                  <span>General Inquiries:</span>
                  <span className="text-foreground">24-48 hours</span>
                </li>
                <li className="flex justify-between">
                  <span>Bug Reports:</span>
                  <span className="text-foreground">12-24 hours</span>
                </li>
                <li className="flex justify-between">
                  <span>Urgent Issues:</span>
                  <span className="text-foreground">4 hours</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      </main>
      <Footer />
    </div>
  )
}
