"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
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
  const sessionSyncRequestIdRef = useRef(0)

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
      const requestId = ++sessionSyncRequestIdRef.current

      try {
        const session = await getCurrentUser()
        if (sessionSyncRequestIdRef.current !== requestId) {
          return
        }

        setUser(session ? toNostrUser(session.user) : null)
      } catch (error) {
        if (sessionSyncRequestIdRef.current === requestId) {
          console.error("Failed to restore session:", error)
        }
      } finally {
        if (sessionSyncRequestIdRef.current === requestId) {
          setIsLoading(false)
        }
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

    const requestId = ++sessionSyncRequestIdRef.current
    setIsLoading(true)
    try {
      const pubkey = await getPublicKey()
      if (!pubkey) {
        if (sessionSyncRequestIdRef.current === requestId) {
          setIsLoading(false)
        }
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

      if (sessionSyncRequestIdRef.current !== requestId) {
        return false
      }

      setUser(toNostrUser(result.user))
      setUnreadNotificationCount(0)
      return true
    } catch (error) {
      if (sessionSyncRequestIdRef.current === requestId) {
        console.error("Sign in failed:", error)
      }
      return false
    } finally {
      if (sessionSyncRequestIdRef.current === requestId) {
        setIsLoading(false)
      }
    }
  }, [])

  const signOut = useCallback(() => {
    sessionSyncRequestIdRef.current += 1
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

      const requestId = ++sessionSyncRequestIdRef.current
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

        if (sessionSyncRequestIdRef.current !== requestId) {
          return { success: false, error: "Session changed during sign-in" }
        }

        setUser(toNostrUser(result.user))
        setUnreadNotificationCount(0)
        return { success: true }
      } catch (error) {
        if (sessionSyncRequestIdRef.current === requestId) {
          console.error("Nsec sign in failed:", error)
        }
        return { success: false, error: "Failed to sign in with nsec" }
      } finally {
        if (sessionSyncRequestIdRef.current === requestId) {
          setIsLoading(false)
        }
      }
    },
    []
  )

  const refreshProfile = useCallback(async () => {
    if (!user) return

    const requestId = ++sessionSyncRequestIdRef.current
    try {
      const session = await getCurrentUser()
      if (sessionSyncRequestIdRef.current !== requestId) {
        return
      }

      setUser(session ? toNostrUser(session.user) : null)
    } catch (error) {
      if (sessionSyncRequestIdRef.current === requestId) {
        console.error("Failed to refresh profile:", error)
      }
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
