"use client"

import { useEffect, useState } from "react"
import { cn } from "@wse/core/lib/utils"

/** Desktop cursor shadow + ring. Off for touch / reduced-motion / CMS edit. */
export function Followspot({ enabled = true }: { enabled?: boolean }) {
  const [on, setOn] = useState(false)

  useEffect(() => {
    if (!enabled) return
    const fine = window.matchMedia("(pointer: fine)").matches
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!fine || reduce) return

    const spot = document.getElementById("esv2-followspot")
    const ring = document.getElementById("esv2-cursor-ring")
    if (!spot) return

    setOn(false)
    let armed = false
    const onMove = (e: PointerEvent) => {
      const t = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`
      spot.style.transform = t
      if (ring) ring.style.transform = t
      if (!armed) {
        armed = true
        setOn(true)
      }
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => window.removeEventListener("pointermove", onMove)
  }, [enabled])

  if (!enabled) return null

  return (
    <>
      <div id="esv2-followspot" className={cn("esv2-followspot", on && "is-on")} aria-hidden />
      <div id="esv2-cursor-ring" className={cn("esv2-cursor-ring", on && "is-on")} aria-hidden />
    </>
  )
}
