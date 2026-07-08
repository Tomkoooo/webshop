"use client"

import { motion, type HTMLMotionProps } from "motion/react"
import type { ReactNode } from "react"
import { useSurfaceDocEdit } from "@wse/core/features/template-cms/surface-doc-edit-context"
import { cn } from "@wse/core/lib/utils"

type RevealVariant = "fade-left" | "fade-scale" | "fade-up"

const REVEAL: Record<
  RevealVariant,
  { initial: { opacity: number; x?: number; y?: number; scale?: number }; animate: { opacity: number; x?: number; y?: number; scale?: number } }
> = {
  "fade-left": { initial: { opacity: 0, x: -30 }, animate: { opacity: 1, x: 0 } },
  "fade-scale": { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 } },
  "fade-up": { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
}

export function KeramiaReveal({
  children,
  className,
  variant = "fade-up",
  delay = 0,
  ...rest
}: {
  children: ReactNode
  className?: string
  variant?: RevealVariant
  delay?: number
} & Omit<HTMLMotionProps<"div">, "children" | "initial" | "animate" | "transition">) {
  const cms = useSurfaceDocEdit()
  if (cms.enabled) {
    return <div className={className}>{children}</div>
  }

  const preset = REVEAL[variant]
  return (
    <motion.div
      className={className}
      initial={preset.initial}
      animate={preset.animate}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

export function KeramiaHoverLift({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const cms = useSurfaceDocEdit()
  if (cms.enabled) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={cn("transition-shadow duration-300 hover:shadow-xl", className)}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
    >
      {children}
    </motion.div>
  )
}
