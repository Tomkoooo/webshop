import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowLeft } from "lucide-react"
import { cn } from "@wse/core/lib/utils"

export function AdminBackLink({
  href,
  children,
  className,
}: {
  href: string
  children: ReactNode
  className?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        "text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition-colors",
        className
      )}
    >
      <ArrowLeft className="size-4" aria-hidden />
      {children}
    </Link>
  )
}
