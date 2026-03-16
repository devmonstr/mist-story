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
  nsecToHex,
  getPublicKeyFromPrivateKey,
  isValidNsec,
} from "@/lib/nostr-utils"

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

const STORAGE_KEY = "Mist Story_nostr_pubkey"
const STORAGE_KEY_METHOD = "Mist Story_auth_method"

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
        if (storedPubkey) {
          // Restore session for both extension and nsec users
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
    localStorage.removeItem(STORAGE_KEY_METHOD)
  }, [])

  const signInWithNsec = useCallback(async (nsec: string): Promise<{ success: boolean; error?: string }> => {
    // Validate nsec format
    if (!isValidNsec(nsec)) {
      return { success: false, error: "Invalid nsec format. Must start with nsec1" }
    }

    setIsLoading(true)
    try {
      const privateKeyHex = nsecToHex(nsec)
      if (!privateKeyHex) {
        return { success: false, error: "Failed to decode nsec" }
      }

      const pubkey = getPublicKeyFromPrivateKey(privateKeyHex)
      if (!pubkey) {
        return { success: false, error: "Failed to derive public key from nsec" }
      }

      const nostrUser = await createNostrUser(pubkey)
      setUser(nostrUser)
      localStorage.setItem(STORAGE_KEY, pubkey)
      localStorage.setItem(STORAGE_KEY_METHOD, "nsec")
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
