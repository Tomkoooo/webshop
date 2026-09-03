"use client"

import Link from "next/link"
import { useEffect, useId, useRef } from "react"
import { X } from "lucide-react"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { cn } from "@wse/core/lib/utils"
import { PROJECT_LINKS, SERVICE_LINKS } from "../lib/constants"
import { padIndex } from "./utils"

const PROJECT_THUMBS: Record<string, string> = {
  "/fesztival-vip": "/sakkmed/fesztival-vip.jpg",
  "/sigma-kontener": "/sakkmed/project-sigma.jpg",
}

type Props = {
  open: boolean
  onClose: () => void
}

export function ServiceAtlas({ open, onClose }: Props) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previouslyFocused.current = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    closeRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener("keydown", onKey)
      previouslyFocused.current?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[80] flex items-stretch"
    >
      <button
        type="button"
        aria-label="Bezárás"
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="sakkmed-root relative z-10 m-3 flex w-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-background/95 shadow-2xl md:m-6 lg:m-10">
        <div className="flex items-center justify-between border-b border-border/40 px-5 py-4 md:px-8">
          <h2 id={titleId} className="sakkmed-kicker text-accent">
            Portfólió térkép
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="sakkmed-focus inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border/60 hover:border-primary hover:text-primary"
            aria-label="Atlasz bezárása"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-8 overflow-y-auto p-5 md:grid-cols-[1.2fr_0.8fr] md:p-8 lg:gap-12">
          <div>
            <p className="sakkmed-kicker mb-6">Szolgáltatásaink</p>
            <ul className="space-y-1">
              {SERVICE_LINKS.map((link, i) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className={cn(
                      "sakkmed-focus group flex min-h-12 items-baseline gap-4 border-b border-border/30 py-3 transition-colors hover:border-primary/50"
                    )}
                  >
                    <span className="sakkmed-mono text-xs text-muted-foreground tabular-nums">
                      {padIndex(i + 1)}
                    </span>
                    <span className="sakkmed-display text-2xl tracking-tight text-foreground transition-colors group-hover:text-primary md:text-3xl">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="sakkmed-kicker mb-6">Projektjeink</p>
            <div className="grid gap-4">
              {PROJECT_LINKS.map((link) => {
                const thumb = PROJECT_THUMBS[link.href]
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onClose}
                    className="sakkmed-focus group relative block overflow-hidden rounded-xl border border-border/50"
                  >
                    <div className="relative aspect-[16/10] bg-muted">
                      {thumb ? (
                        <FallbackImage
                          src={thumb}
                          alt=""
                          fill
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <span className="absolute bottom-4 left-4 sakkmed-display text-xl text-foreground md:text-2xl">
                        {link.label}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
