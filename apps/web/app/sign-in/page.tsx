"use client"

import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Key, ExternalLink, AlertCircle, CheckCircle2, Loader2, Eye, EyeOff, ShieldAlert } from "lucide-react"
import Link from "next/link"
import { normalizeRedirectTarget } from "@/lib/auth-routes"

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

type LoginMethod = "extension" | "nsec"

export default function SignInPage() {
  const { user, isLoading, isExtensionAvailable, signIn, signInWithNsec } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("extension")
  const [nsec, setNsec] = useState("")
  const [showNsec, setShowNsec] = useState(false)
  const nextPath = normalizeRedirectTarget(searchParams.get("next"))

  // Redirect if already signed in
  useEffect(() => {
    if (user && !isLoading) {
      router.replace(nextPath)
    }
  }, [isLoading, nextPath, router, user])

  const handleSignIn = async () => {
    setError(null)
    setIsSigningIn(true)

    try {
      const success = await signIn()
      if (success) {
        router.replace(nextPath)
      } else {
        setError("Failed to sign in. Please make sure your Nostr extension is unlocked.")
      }
    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleNsecSignIn = async () => {
    setError(null)
    if (!nsec.trim()) {
      setError("Please enter your nsec private key")
      return
    }

    setIsSigningIn(true)
    try {
      const result = await signInWithNsec(nsec.trim())
      if (result.success) {
        router.replace(nextPath)
      } else {
        setError(result.error || "Failed to sign in with nsec")
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
              Connect your Nostr identity to start writing and reading on Myth Story
            </p>
          </div>

          {/* Sign In Card */}
          <div className="border border-border bg-card p-6">
            {/* Login Method Toggle */}
            <div className="mb-4 flex rounded-sm border border-border">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod("extension")
                  setError(null)
                }}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  loginMethod === "extension"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Extension
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod("nsec")
                  setError(null)
                }}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  loginMethod === "nsec"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Private Key
              </button>
            </div>

            {loginMethod === "extension" ? (
              isExtensionAvailable ? (
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
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-2 rounded-sm border border-border/60 bg-muted/50 p-3">
                    <AlertCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      No Nostr extension detected. Install one or use Private Key method.
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
              )
            ) : (
              <div className="space-y-4">
                {/* Security Warning */}
                <div className="flex items-start gap-2 rounded-sm border border-amber-500/50 bg-amber-500/10 p-3">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-600 dark:text-amber-500">
                      Security Warning
                    </p>
                    <p className="mt-1 text-amber-700/80 dark:text-amber-400/80 text-xs leading-relaxed">
                      Never share your private key with anyone. It gives full control of your Nostr identity.
                      We recommend using a browser extension for better security.
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-sm border border-destructive/50 bg-destructive/10 p-3">
                    <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                    <span className="text-sm text-destructive">{error}</span>
                  </div>
                )}

                {/* Nsec Input */}
                <div className="space-y-2">
                  <label htmlFor="nsec" className="text-sm font-medium text-foreground">
                    Private Key (nsec)
                  </label>
                  <div className="relative">
                    <input
                      id="nsec"
                      type={showNsec ? "text" : "password"}
                      value={nsec}
                      onChange={(e) => setNsec(e.target.value)}
                      placeholder="nsec1..."
                      className="w-full rounded-sm border border-border bg-background px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNsec(!showNsec)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNsec ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter your nsec private key (starts with "nsec1")
                  </p>
                </div>

                <Button
                  onClick={handleNsecSignIn}
                  disabled={isSigningIn || !nsec.trim()}
                  className="w-full"
                >
                  {isSigningIn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in with Private Key"
                  )}
                </Button>
              </div>
            )}

            <p className="mt-4 text-center text-xs text-muted-foreground">
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
