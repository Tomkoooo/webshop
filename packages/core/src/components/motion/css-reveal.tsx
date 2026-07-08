"use client"

import * as React from "react"
import { cn } from "@wse/core/lib/utils"

export type RevealVariant = "up" | "left" | "right" | "scale" | "fade"

/** Same motion as Features grid cards (`Features.tsx`). */
export const REVEAL_DURATION_MS = 750
export const REVEAL_STAGGER_MS = 120

export type RevealAs = "div" | "h2" | "p" | "span" | "header" | "li"

export type RevealMode = "scroll" | "mount"

export type RevealProps = {
  children?: React.ReactNode
  className?: string
  as?: RevealAs
  variant?: RevealVariant
  mode?: RevealMode
  delayMs?: number
  durationMs?: number
  once?: boolean
  margin?: string
  style?: React.CSSProperties
} & Omit<React.HTMLAttributes<HTMLElement>, "children" | "className" | "style">

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

type RevealPhase = "ssr" | "armed" | "visible"

/** Paint hidden state in the viewport, then add .sf-reveal--visible so transition runs. */
function scheduleReveal(el: HTMLElement, onVisible: () => void) {
  void el.offsetHeight
  requestAnimationFrame(() => {
    void el.offsetHeight
    requestAnimationFrame(() => onVisible())
  })
}

function useRevealPhase(mode: RevealMode, margin: string, once: boolean) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const [phase, setPhase] = React.useState<RevealPhase>("ssr")

  React.useEffect(() => {
    if (prefersReducedMotion()) {
      setPhase("visible")
      return
    }
    setPhase("armed")
  }, [])

  React.useEffect(() => {
    if (phase !== "armed") return
    const el = ref.current
    if (!el) return

    if (mode === "mount") {
      scheduleReveal(el, () => setPhase("visible"))
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          scheduleReveal(el, () => setPhase("visible"))
          if (once) observer.disconnect()
        } else if (!once) {
          setPhase("armed")
        }
      },
      { rootMargin: margin, threshold: 0.12 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [phase, mode, margin, once])

  return { ref, phase }
}

/**
 * SSR-safe scroll/mount reveal: CSS transitions + Intersection Observer.
 * HTML is visible until JS arms; then elements animate when scrolled into view.
 */
export function Reveal({
  children,
  className,
  as = "div",
  variant = "up",
  mode = "scroll",
  delayMs = 0,
  durationMs = REVEAL_DURATION_MS,
  once = true,
  margin = "0px 0px -6% 0px",
  style,
  ...rest
}: RevealProps) {
  const { ref, phase } = useRevealPhase(mode, margin, once)

  return React.createElement(
    as,
    {
      ref,
      className: cn(
        "sf-reveal",
        `sf-reveal--${variant}`,
        phase === "armed" && "sf-reveal--armed",
        phase === "visible" && "sf-reveal--visible",
        className
      ),
      style: {
        ...style,
        ...(delayMs ? { transitionDelay: `${delayMs}ms` } : undefined),
        ...(durationMs ? { ["--sf-reveal-duration" as string]: `${durationMs}ms` } : undefined),
      },
      ...rest,
    },
    children
  )
}

/** Fixed header slide-in (CSS @keyframes, no Framer / no remount). */
export function RevealHeader({ children, className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    if (prefersReducedMotion()) {
      setVisible(true)
      return
    }
    requestAnimationFrame(() => setVisible(true))
  }, [])

  return (
    <header
      className={cn("sf-nav-reveal", visible && "sf-nav-reveal--visible", className)}
      {...props}
    >
      {children}
    </header>
  )
}

/**
 * Checkout wizard panel: animates in when `stepKey` changes (replaces AnimatePresence).
 */
export function RevealStepPanel({
  stepKey,
  children,
  className,
}: {
  stepKey: string | number
  children?: React.ReactNode
  className?: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [phase, setPhase] = React.useState<RevealPhase>("ssr")

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) {
      setPhase("visible")
      return
    }
    setPhase("armed")
    scheduleReveal(el, () => setPhase("visible"))
  }, [stepKey])

  return (
    <div
      ref={ref}
      className={cn(
        "sf-reveal",
        "sf-reveal--up",
        "sf-step-panel",
        phase === "armed" && "sf-reveal--armed",
        phase === "visible" && "sf-reveal--visible",
        className
      )}
      style={{ ["--sf-reveal-duration" as string]: `${REVEAL_DURATION_MS}ms` }}
    >
      {children}
    </div>
  )
}

/** Height + opacity expand/collapse (shipping fields, accordions). */
export function CollapseReveal({
  open,
  children,
  className,
}: {
  open: boolean
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("sf-collapse", open && "sf-collapse--open", className)}>
      <div className="sf-collapse__inner">{children}</div>
    </div>
  )
}

/** List row: mount entrance; optional exit fade when `exiting` before unmount. */
export function RevealListItem({
  children,
  className,
  exiting = false,
  variant = "up",
}: {
  children?: React.ReactNode
  className?: string
  exiting?: boolean
  variant?: RevealVariant
}) {
  const { ref, phase } = useRevealPhase("mount", "0px", true)

  return (
    <div
      ref={ref}
      className={cn(
        "sf-reveal",
        `sf-reveal--${variant}`,
        phase === "armed" && "sf-reveal--armed",
        phase === "visible" && "sf-reveal--visible",
        exiting && "sf-list-item--exit",
        className
      )}
      style={{ ["--sf-reveal-duration" as string]: `${REVEAL_DURATION_MS}ms` }}
    >
      {children}
    </div>
  )
}

/** Short entrance when hero slide/image key changes. */
export function RevealSwap({
  children,
  className,
  swapKey,
}: {
  children?: React.ReactNode
  className?: string
  swapKey: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [phase, setPhase] = React.useState<RevealPhase>("ssr")

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) {
      setPhase("visible")
      return
    }
    setPhase("armed")
    scheduleReveal(el, () => setPhase("visible"))
  }, [swapKey])

  return (
    <div
      ref={ref}
      className={cn(
        "sf-reveal",
        "sf-reveal--up",
        phase === "armed" && "sf-reveal--armed",
        phase === "visible" && "sf-reveal--visible",
        className
      )}
      style={{ ["--sf-reveal-duration" as string]: `${REVEAL_DURATION_MS}ms` }}
    >
      {children}
    </div>
  )
}
