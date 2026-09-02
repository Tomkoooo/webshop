"use client"

import Link from "next/link"
import { useRef } from "react"
import { cn } from "@wse/core/lib/utils"

type Props = {
  href: string
  children: React.ReactNode
  className?: string
  variant?: "primary" | "ghost" | "invert"
  magnetic?: boolean
}

export function MagneticButton({
  href,
  children,
  className,
  variant = "primary",
  magnetic = true,
}: Props) {
  const ref = useRef<HTMLAnchorElement>(null)

  const onMove = (e: React.PointerEvent) => {
    if (!magnetic || !ref.current) return
    if (!window.matchMedia("(pointer: fine)").matches) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) / 6
    const y = (e.clientY - rect.top - rect.height / 2) / 6
    ref.current.style.transform = `translate(${x}px, ${y}px)`
  }

  const onLeave = () => {
    if (ref.current) ref.current.style.transform = ""
  }

  return (
    <Link
      ref={ref}
      href={href}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn(
        "esv2-focus inline-flex min-h-11 items-center justify-center px-7 py-3 text-sm font-semibold tracking-[0.08em] uppercase transition-[transform,background,border-color] duration-300",
        variant === "primary" && "bg-foreground text-background hover:opacity-90",
        variant === "invert" && "bg-background text-foreground hover:opacity-90",
        variant === "ghost" && "border border-foreground/25 text-foreground hover:border-foreground",
        className
      )}
    >
      {children}
    </Link>
  )
}
