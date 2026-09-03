"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@wse/core/lib/utils"

/** Animated count-up for stat orbs; respects reduced motion. */
export function StatOdometer({
  value,
  className,
}: {
  value: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value)
      return
    }

    const numeric = value.replace(/[^\d]/g, "")
    if (!numeric) {
      setDisplay(value)
      return
    }

    const target = parseInt(numeric, 10)
    const suffix = value.replace(numeric, "")
    let frame = 0
    const duration = 900
    const start = performance.now()
    let raf = 0

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        observer.disconnect()
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration)
          const eased = 1 - Math.pow(1 - t, 3)
          frame = Math.round(target * eased)
          setDisplay(`${frame}${suffix}`)
          if (t < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [value])

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {display}
    </span>
  )
}
