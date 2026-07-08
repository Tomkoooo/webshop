"use client"

import { cn } from "@wse/core/lib/utils"

export function CartLineOrderabilityMessage({
  message,
  className,
}: {
  message: string | undefined
  className?: string
}) {
  if (!message) return null
  return (
    <p
      role="alert"
      className={cn(
        "mt-2 text-sm font-semibold text-red-600 dark:text-red-400",
        className
      )}
    >
      {message}
    </p>
  )
}
