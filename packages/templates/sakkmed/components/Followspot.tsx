"use client"

import { useEffect, useState } from "react"
import { cn } from "@wse/core/lib/utils"

/** Desktop-only gold followspot; off for touch / reduced-motion / CMS edit. */
export function Followspot({ enabled = true }: { enabled?: boolean }) {
  const [on, setOn] = useState(false)

  useEffect(() => {
    if (!enabled) return
    const fine = window.matchMedia("(pointer: fine)").matches
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!fine || reduce) return

    const el = document.getElementById("sakkmed-followspot")
    if (!el) return

    setOn(true)
    const onMove = (e: PointerEvent) => {
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => window.removeEventListener("pointermove", onMove)
  }, [enabled])

  if (!enabled) return null

  return (
    <div
      id="sakkmed-followspot"
      className={cn("sakkmed-followspot", on && "is-on")}
      aria-hidden
    />
  )
}
