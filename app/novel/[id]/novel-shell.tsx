"use client"

import { use } from "react"
import type { ReactNode } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

interface NovelShellProps {
  params: Promise<{ id: string }>
  children: ReactNode
}

export function NovelShell({ params, children }: NovelShellProps) {
  // Unwrap params for use in child components
  const { id } = use(params)

  return (
    <>
      {children}
    </>
  )
}
