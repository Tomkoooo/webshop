"use client"

import { useEffect } from "react"

/** Writes --es-scroll (0–1 of page) for CSS parallax layers. */
export function ParallaxRoot() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const root = document.documentElement
    const onScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      root.style.setProperty("--es-scroll", String(window.scrollY / max))
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])
  return null
}
