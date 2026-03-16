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
  isNostrExtensionAvailable,
  getPublicKey,
  createNostrUser,
} from "@/lib/nostr-utils"

interface AuthContextType {
  user: NostrUser | null
  isLoading: boolean
  isExtensionAvailable: boolean
  signIn: () => Promise<boolean>
  signOut: () => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = "inkwell_nostr_pubkey"

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
        const storedPubkey = localStorage.getItem(STORAGE_KEY)
        if (storedPubkey && isNostrExtensionAvailable()) {
          const nostrUser = await createNostrUser(storedPubkey)
          setUser(nostrUser)
        }
      } catch (error) {
        console.error("Failed to restore session:", error)
        localStorage.removeItem(STORAGE_KEY)
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

      const nostrUser = await createNostrUser(pubkey)
      setUser(nostrUser)
      localStorage.setItem(STORAGE_KEY, pubkey)
      return true
    } catch (error) {
      console.error("Sign in failed:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signOut = useCallback(() => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user) return

    try {
      const updatedUser = await createNostrUser(user.pubkey)
      setUser(updatedUser)
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
