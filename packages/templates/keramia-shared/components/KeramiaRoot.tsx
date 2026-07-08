"use client"

import type { ReactNode } from "react"
import "../keramia.css"

export function KeramiaRoot({ children }: { children: ReactNode }) {
  return <div className="keramia-root min-h-screen bg-background text-foreground">{children}</div>
}
