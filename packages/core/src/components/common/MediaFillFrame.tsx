import type { CSSProperties, ReactNode } from "react"
import { cn } from "@wse/core/lib/utils"

type Props = {
  children: ReactNode
  className?: string
  /** Used when `className` has no Tailwind aspect-* utility (e.g. storefront `EditableDocImage`). */
  aspectRatio?: number
  style?: CSSProperties
}

/**
 * Required wrapper for Next.js `Image` with `fill` — without `position: relative` + bounds,
 * the image escapes and can cover sibling layout (hero text/CTAs disappearing after load).
 */
export function MediaFillFrame({ children, className, aspectRatio, style }: Props) {
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={aspectRatio ? { aspectRatio, ...style } : style}
    >
      {children}
    </div>
  )
}
