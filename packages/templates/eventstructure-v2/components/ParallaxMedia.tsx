"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { cn } from "@wse/core/lib/utils"

/** Local parallax: the inner media drifts opposite to scroll while the frame stays clipped. */
export function ParallaxMedia({
  children,
  speed = 0.28,
  className,
}: {
  children: ReactNode
  speed?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let frame = 0
    const update = () => {
      frame = 0
      const rect = el.getBoundingClientRect()
      const y = (rect.top + rect.height / 2 - window.innerHeight / 2) * speed
      el.style.setProperty("--es-shift", `${y.toFixed(1)}px`)
    }
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [speed])

  return (
    <div ref={ref} className={cn("esv2-parallax-media", className)}>
      <div className="esv2-parallax-media__inner relative h-full w-full">{children}</div>
    </div>
  )
}
