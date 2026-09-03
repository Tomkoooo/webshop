"use client"

import Link from "next/link"
import { useRef } from "react"
import { cn } from "@wse/core/lib/utils"

type Props = {
  href: string
  children: React.ReactNode
  className?: string
  variant?: "primary" | "ghost"
  magnetic?: boolean
}

export function MagneticGoldButton({
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
        "sakkmed-focus inline-flex min-h-11 items-center justify-center px-6 py-3 text-sm font-semibold tracking-[0.08em] transition-[transform,background,box-shadow,border-color] duration-300",
        variant === "primary" &&
          "rounded-full bg-primary text-primary-foreground shadow-[0_0_24px_rgba(201,162,39,0.35)] hover:shadow-[0_0_36px_rgba(232,197,71,0.45)]",
        variant === "ghost" &&
          "rounded-full border border-foreground/25 bg-black/30 text-foreground backdrop-blur-sm hover:border-primary/60 hover:bg-black/50",
        className
      )}
    >
      {children}
    </Link>
  )
}
