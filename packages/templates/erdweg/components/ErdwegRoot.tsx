"use client"

import type { ReactNode } from "react"
import "../erdweg.css"

export function ErdwegRoot({ children }: { children: ReactNode }) {
  return <div className="erdweg-root min-h-screen bg-background text-foreground">{children}</div>
}
