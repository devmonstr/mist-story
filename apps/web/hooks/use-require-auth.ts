"use client"

import { useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { buildSignInPath } from "@/lib/auth-routes"

export function useRequireAuth() {
  const auth = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (auth.isLoading || auth.user) {
      return
    }

    const query = searchParams.toString()
    const nextPath = query ? `${pathname}?${query}` : pathname
    router.replace(buildSignInPath(nextPath))
  }, [auth.isLoading, auth.user, pathname, router, searchParams])

  return {
    ...auth,
    isAuthenticated: Boolean(auth.user),
  }
}
