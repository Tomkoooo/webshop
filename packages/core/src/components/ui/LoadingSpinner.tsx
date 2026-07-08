import { cn } from "@wse/core/lib/utils"
import { sfSpinner } from "@wse/core/lib/storefront-ui"

const sizeClasses = {
  xs: "h-4 w-4",
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
  xl: "h-12 w-12",
} as const

export type LoadingSpinnerSize = keyof typeof sizeClasses

/** Ring spinner using storefront theme accent (`sfSpinner`). */
export function LoadingSpinner({
  className,
  size = "md",
}: {
  className?: string
  size?: LoadingSpinnerSize
}) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        sizeClasses[size],
        "animate-spin rounded-full border-solid border-white/30",
        sfSpinner,
        className
      )}
    />
  )
}
