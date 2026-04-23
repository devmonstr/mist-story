"use client"

import {
  createContext,
  use,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type { ProfilePageResponse } from "@myth/shared"
import { fetchProfilePage, followProfile, unfollowProfile } from "@/lib/api"
import { useAuth } from "@/context/auth-context"

interface ProfileShellProps {
  params: Promise<{ npub: string }>
  children: ReactNode
}

interface ProfileShellContextValue {
  npub: string
  data: ProfilePageResponse | null
  isLoading: boolean
  error: string | null
  isFollowPending: boolean
  refetch: () => Promise<void>
  toggleFollow: () => Promise<void>
}

const ProfileShellContext = createContext<ProfileShellContextValue | undefined>(undefined)

export function ProfileShell({ params, children }: ProfileShellProps) {
  const { npub } = use(params)
  const { user } = useAuth()
  const [data, setData] = useState<ProfilePageResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFollowPending, setIsFollowPending] = useState(false)
  const loadRequestIdRef = useRef(0)

  const loadProfile = useCallback(async () => {
    const requestId = ++loadRequestIdRef.current
    setIsLoading(true)
    setError(null)
    setData(null)

    try {
      const payload = await fetchProfilePage(npub)
      if (loadRequestIdRef.current !== requestId) {
        return
      }

      setData(payload)
    } catch (loadError) {
      if (loadRequestIdRef.current !== requestId) {
        return
      }

      const message = loadError instanceof Error ? loadError.message : "Failed to load profile"
      setError(message)
    } finally {
      if (loadRequestIdRef.current === requestId) {
        setIsLoading(false)
      }
    }
  }, [npub])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile, user?.npub])

  const toggleFollow = useCallback(async () => {
    if (!data) {
      return
    }

    setIsFollowPending(true)

    try {
      const nextState = data.isFollowing
        ? await unfollowProfile(npub)
        : await followProfile(npub)

      setData((current) =>
        current
          ? {
              ...current,
              isFollowing: nextState.isFollowing,
              stats: {
                ...current.stats,
                followers: nextState.followersCount,
              },
            }
          : current
      )
    } finally {
      setIsFollowPending(false)
    }
  }, [data, npub])

  return (
    <ProfileShellContext.Provider
      value={{
        npub,
        data,
        isLoading,
        error,
        isFollowPending,
        refetch: loadProfile,
        toggleFollow,
      }}
    >
      {children}
    </ProfileShellContext.Provider>
  )
}

export function useProfileShell() {
  const context = useContext(ProfileShellContext)
  if (!context) {
    throw new Error("useProfileShell must be used within ProfileShell")
  }

  return context
}
