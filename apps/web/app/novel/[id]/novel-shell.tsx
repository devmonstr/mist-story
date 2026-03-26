import type { ReactNode } from "react"

interface NovelShellProps {
  children: ReactNode
}

export function NovelShell({ children }: NovelShellProps) {
  return <>{children}</>
}
