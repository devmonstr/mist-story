"use client"

import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Key, ExternalLink, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"

const NOSTR_EXTENSIONS = [
  {
    name: "Alby",
    url: "https://getalby.com",
    description: "Browser extension with Lightning wallet integration",
  },
  {
    name: "nos2x",
    url: "https://github.com/nicbego/nos2x",
    description: "Simple NIP-07 extension for Chrome/Firefox",
  },
  {
    name: "Flamingo",
    url: "https://www.flamingo.watch",
    description: "Mobile-friendly Nostr key management",
  },
]

export default function SignInPage() {
  const { user, isLoading, isExtensionAvailable, signIn } = useAuth()
  const router = useRouter()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if already signed in
  useEffect(() => {
    if (user && !isLoading) {
      router.push("/studio")
    }
  }, [user, isLoading, router])

  const handleSignIn = async () => {
    setError(null)
    setIsSigningIn(true)

    try {
      const success = await signIn()
      if (success) {
        router.push("/studio")
      } else {
        setError("Failed to sign in. Please make sure your Nostr extension is unlocked.")
      }
    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSigningIn(false)
    }
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

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Key className="h-6 w-6 text-foreground" />
            </div>
            <h1 className="font-serif text-2xl font-medium text-foreground">
              Sign in with Nostr
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Connect your Nostr identity to start writing and reading on Inkwell
            </p>
          </div>

          {/* Sign In Card */}
          <div className="border border-border bg-card p-6">
            {isExtensionAvailable ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-sm border border-border/60 bg-muted/50 p-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Nostr extension detected
                  </span>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-sm border border-destructive/50 bg-destructive/10 p-3">
                    <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                    <span className="text-sm text-destructive">{error}</span>
                  </div>
                )}

                <Button
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="w-full"
                >
                  {isSigningIn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Connect with Extension"
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  By signing in, you agree to our{" "}
                  <Link href="/terms" className="underline hover:text-foreground">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="underline hover:text-foreground">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-2 rounded-sm border border-border/60 bg-muted/50 p-3">
                  <AlertCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    No Nostr extension detected. Install one to continue.
                  </span>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">
                    Recommended Extensions
                  </p>
                  {NOSTR_EXTENSIONS.map((ext) => (
                    <a
                      key={ext.name}
                      href={ext.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between border border-border/60 p-3 transition-colors hover:border-border hover:bg-muted/50"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {ext.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ext.description}
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </a>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  I have installed an extension
                </Button>
              </div>
            )}
          </div>

          {/* What is Nostr */}
          <div className="mt-6 border border-border/60 bg-muted/30 p-4">
            <h3 className="text-sm font-medium text-foreground">What is Nostr?</h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Nostr is a decentralized protocol for social communication. Your Nostr
              identity is controlled by you through a cryptographic key pair, giving
              you full ownership of your data and content.
            </p>
            <a
              href="https://github.com/nostr-protocol/nips"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-foreground underline hover:no-underline"
            >
              Learn more about Nostr
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
