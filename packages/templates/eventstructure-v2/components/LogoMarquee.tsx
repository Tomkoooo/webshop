"use client"

import { cn } from "@wse/core/lib/utils"

export function LogoMarquee({
  children,
  reverse = false,
  className,
}: {
  children: React.ReactNode
  reverse?: boolean
  className?: string
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        className={cn(
          "flex w-max gap-10 whitespace-nowrap py-2 md:gap-16",
          reverse ? "esv2-marquee-reverse" : "esv2-marquee"
        )}
      >
        <div className="flex items-center gap-10 md:gap-16">{children}</div>
        <div className="flex items-center gap-10 md:gap-16" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  )
}
