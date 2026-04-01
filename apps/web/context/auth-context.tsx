"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import type { NostrUser } from "@/lib/nostr-types"
import {
  getPublicKey,
  getPublicKeyFromNsec,
  isNostrExtensionAvailable,
  isValidNsec,
  signAuthChallengeWithExtension,
  signAuthChallengeWithNsec,
} from "@/lib/nostr-utils"
import {
  fetchNotificationSummary,
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
  unreadNotificationCount: number
  signIn: () => Promise<boolean>
  signInWithNsec: (nsec: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => void
  refreshProfile: () => Promise<void>
  refreshUnreadNotifications: () => Promise<void>
  syncUnreadNotificationCount: (count: number) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<NostrUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExtensionAvailable, setIsExtensionAvailable] = useState(false)
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)

  useEffect(() => {
    const checkExtension = () => {
      setIsExtensionAvailable(isNostrExtensionAvailable())
    }

    checkExtension()
    const timeout = setTimeout(checkExtension, 500)

    return () => clearTimeout(timeout)
  }, [])

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

    void restoreSession()
  }, [])

  const refreshUnreadNotifications = useCallback(async () => {
    if (!user) {
      setUnreadNotificationCount(0)
      return
    }

    try {
      const payload = await fetchNotificationSummary()
      setUnreadNotificationCount(payload.unreadCount)
    } catch (error) {
      console.error("Failed to refresh notification summary:", error)
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setUnreadNotificationCount(0)
      return
    }

    void refreshUnreadNotifications()

    const handleFocus = () => {
      void refreshUnreadNotifications()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshUnreadNotifications()
      }
    }

    window.addEventListener("focus", handleFocus)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("focus", handleFocus)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [refreshUnreadNotifications, user])

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
      setUnreadNotificationCount(0)
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
    setUnreadNotificationCount(0)
  }, [])

  const signInWithNsec = useCallback(
    async (nsec: string): Promise<{ success: boolean; error?: string }> => {
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
        setUnreadNotificationCount(0)
        return { success: true }
      } catch (error) {
        console.error("Nsec sign in failed:", error)
        return { success: false, error: "Failed to sign in with nsec" }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const refreshProfile = useCallback(async () => {
    if (!user) return

    try {
      const session = await getCurrentUser()
      setUser(session ? toNostrUser(session.user) : null)
    } catch (error) {
      console.error("Failed to refresh profile:", error)
    }
  }, [user])

  const syncUnreadNotificationCount = useCallback((count: number) => {
    setUnreadNotificationCount(Math.max(0, count))
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isExtensionAvailable,
        unreadNotificationCount,
        signIn,
        signInWithNsec,
        signOut,
        refreshProfile,
        refreshUnreadNotifications,
        syncUnreadNotificationCount,
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
