"use client"

import { useCallback, useRef, useState } from "react"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { mediaImageSrc } from "@wse/core/lib/images"
import { cn } from "@wse/core/lib/utils"

type Props = {
  beforeLabel: string
  afterLabel: string
  caption?: string
  beforeImage?: string
  afterImage?: string
  className?: string
}

export function BeforeAfterSlider({
  beforeLabel,
  afterLabel,
  caption,
  beforeImage = "",
  afterImage = "",
  className,
}: Props) {
  const [position, setPosition] = useState(50)
  const trackRef = useRef<HTMLDivElement>(null)
  const resolvedBefore = mediaImageSrc(beforeImage)
  const resolvedAfter = mediaImageSrc(afterImage)
  const hasBefore = Boolean(beforeImage.trim())
  const hasAfter = Boolean(afterImage.trim())

  const updateFromClientX = useCallback((clientX: number) => {
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const next = ((clientX - rect.left) / rect.width) * 100
    setPosition(Math.min(100, Math.max(0, next)))
  }, [])

  return (
    <div className={cn("space-y-3", className)}>
      <div
        ref={trackRef}
        className="relative aspect-[16/10] cursor-ew-resize select-none overflow-hidden rounded-2xl border border-border bg-muted shadow-sm"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          updateFromClientX(e.clientX)
        }}
        onPointerMove={(e) => {
          if (e.buttons !== 1) return
          updateFromClientX(e.clientX)
        }}
      >
        {hasBefore ? (
          <FallbackImage
            src={resolvedBefore}
            alt={beforeLabel}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-muted via-surface to-muted-foreground/20" />
        )}
        {hasAfter ? (
          <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
            <FallbackImage src={resolvedAfter} alt={afterLabel} fill className="object-cover" />
          </div>
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary/25 via-background to-primary/10"
            style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
          />
        )}
        <div
          className="absolute inset-y-0 w-0.5 bg-primary shadow-[0_0_12px_rgba(0,0,0,0.15)]"
          style={{ left: `${position}%` }}
        />
        <div
          className="absolute top-1/2 z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold text-foreground shadow-md"
          style={{ left: `${position}%` }}
          aria-hidden
        >
          ↔
        </div>
        <span className="absolute bottom-3 left-3 z-10 rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
          {beforeLabel}
        </span>
        <span className="absolute bottom-3 right-3 z-10 rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
          {afterLabel}
        </span>
      </div>
      {caption ? <p className="text-center text-xs text-muted-foreground">{caption}</p> : null}
    </div>
  )
}
