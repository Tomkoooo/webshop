"use client"

import type { ReactNode } from "react"
import "../dr-zsanett.css"

export function DrZsanettRoot({ children }: { children: ReactNode }) {
  return <div className="dz-root min-h-screen bg-background text-foreground">{children}</div>
}
