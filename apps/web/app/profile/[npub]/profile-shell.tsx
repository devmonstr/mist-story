"use client"

import { use } from "react"
import type { ReactNode } from "react"

interface ProfileShellProps {
  params: Promise<{ npub: string }>
  children: ReactNode
}

export function ProfileShell({ params, children }: ProfileShellProps) {
  return (
    <>
      {children}
    </>
  )
}
