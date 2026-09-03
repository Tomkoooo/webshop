import type { ReactNode } from "react"
import { cn } from "@wse/core/lib/utils"

export function WaveRibbon({
  variant,
  children,
}: {
  variant: "gold" | "navy"
  children: ReactNode
}) {
  const fill = variant === "gold" ? "var(--theme-secondary)" : "var(--theme-primary)"
  return (
    <div
      className={cn(
        "relative isolate -my-2",
        variant === "gold" ? "sorfeszt-wave-gold text-primary" : "sorfeszt-wave-navy text-primary-foreground"
      )}
    >
      <svg className="block h-12 w-full sm:h-16" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden>
        <path
          fill={fill}
          d="M0,52 C180,88 360,12 540,40 C720,68 900,8 1080,44 C1260,80 1350,28 1440,48 L1440,80 L0,80 Z"
        />
      </svg>
      <div
        className={cn(
          "px-5 py-8 text-center sm:px-8 sm:py-10",
          variant === "gold" ? "bg-secondary" : "bg-primary"
        )}
      >
        <div className="mx-auto max-w-3xl text-balance text-lg font-semibold leading-snug sm:text-xl">
          {children}
        </div>
      </div>
      <svg className="block h-12 w-full sm:h-16" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden>
        <path
          fill={fill}
          d="M0,0 L1440,0 L1440,28 C1260,64 1080,8 900,40 C720,72 540,12 360,44 C180,76 90,20 0,36 Z"
        />
      </svg>
    </div>
  )
}
