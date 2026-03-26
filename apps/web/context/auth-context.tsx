"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import type { NostrUser } from "@/lib/nostr-types"
import {
  getPublicKeyFromNsec,
  isNostrExtensionAvailable,
  getPublicKey,
  isValidNsec,
  signAuthChallengeWithExtension,
  signAuthChallengeWithNsec,
} from "@/lib/nostr-utils"
import {
  getCurrentUser,
  requestAuthChallenge,
  signOutSession,
  toNostrUser,
  verifyAuthChallenge,
} from "@/lib/api"

interface AuthContextType {
  user: NostrUser | null
  isLoading: boolean
  isExtensionAvailable: boolean
  signIn: () => Promise<boolean>
  signInWithNsec: (nsec: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<NostrUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExtensionAvailable, setIsExtensionAvailable] = useState(false)

  // Check for extension availability
  useEffect(() => {
    const checkExtension = () => {
      setIsExtensionAvailable(isNostrExtensionAvailable())
    }

    // Check immediately
    checkExtension()

    // Also check after a short delay (some extensions load async)
    const timeout = setTimeout(checkExtension, 500)

    return () => clearTimeout(timeout)
  }, [])

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const session = await getCurrentUser()
        setUser(session ? toNostrUser(session.user) : null)
      } catch (error) {
        console.error("Failed to restore session:", error)
      } finally {
        setIsLoading(false)
      }
    }

    restoreSession()
  }, [])

  const signIn = useCallback(async (): Promise<boolean> => {
    if (!isNostrExtensionAvailable()) {
      return false
    }

    setIsLoading(true)
    try {
      const pubkey = await getPublicKey()
      if (!pubkey) {
        setIsLoading(false)
        return false
      }

      const { challenge } = await requestAuthChallenge(pubkey)
      const signedEvent = await signAuthChallengeWithExtension(pubkey, challenge)
      if (!signedEvent) {
        return false
      }

      const result = await verifyAuthChallenge({
        pubkey,
        challenge,
        signedEvent,
      })

      setUser(toNostrUser(result.user))
      return true
    } catch (error) {
      console.error("Sign in failed:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signOut = useCallback(() => {
    void signOutSession().catch((error) => {
      console.error("Sign out failed:", error)
    })
    setUser(null)
  }, [])

  const signInWithNsec = useCallback(async (nsec: string): Promise<{ success: boolean; error?: string }> => {
    // Validate nsec format
    if (!isValidNsec(nsec)) {
      return { success: false, error: "Invalid nsec format. Must start with nsec1" }
    }

    setIsLoading(true)
    try {
      const pubkey = getPublicKeyFromNsec(nsec)
      if (!pubkey) {
        return { success: false, error: "Failed to derive pubkey from nsec" }
      }

      const { challenge } = await requestAuthChallenge(pubkey)
      const signedChallengeEvent = await signAuthChallengeWithNsec(nsec, challenge)
      if (!signedChallengeEvent) {
        return { success: false, error: "Failed to sign challenge with nsec" }
      }

      const result = await verifyAuthChallenge({
        pubkey: signedChallengeEvent.pubkey!,
        challenge,
        signedEvent: signedChallengeEvent,
      })

      setUser(toNostrUser(result.user))
      return { success: true }
    } catch (error) {
      console.error("Nsec sign in failed:", error)
      return { success: false, error: "Failed to sign in with nsec" }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user) return

    try {
      const session = await getCurrentUser()
      setUser(session ? toNostrUser(session.user) : null)
    } catch (error) {
      console.error("Failed to refresh profile:", error)
    }
  }, [user])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isExtensionAvailable,
        signIn,
        signInWithNsec,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
