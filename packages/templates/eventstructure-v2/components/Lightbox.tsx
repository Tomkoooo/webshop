"use client"

import { useEffect, useId, useState } from "react"
import { X } from "lucide-react"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { mediaImageSrc } from "@wse/core/lib/images"

export type LightboxItem = { image: string; caption?: string }

type Props = {
  items: LightboxItem[]
  index: number | null
  onClose: () => void
  onIndexChange: (index: number) => void
}

export function DarkroomLightbox({ items, index, onClose, onIndexChange }: Props) {
  const titleId = useId()
  const open = index !== null && items[index]

  useEffect(() => {
    if (index === null) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight") onIndexChange((index + 1) % items.length)
      if (e.key === "ArrowLeft") onIndexChange((index - 1 + items.length) % items.length)
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener("keydown", onKey)
    }
  }, [index, items.length, onClose, onIndexChange])

  if (!open || index === null) return null
  const item = items[index]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm"
    >
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <p id={titleId} className="esv2-kicker truncate text-accent">
            {item.caption || `Image ${index + 1} / ${items.length}`}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="esv2-focus inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-foreground/20 text-foreground"
            aria-label="Close lightbox"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted/20 md:aspect-[16/10]">
          <FallbackImage
            src={mediaImageSrc(item.image)}
            alt={item.caption || ""}
            fill
            className="object-contain"
            sizes="100vw"
            priority
          />
        </div>
        <div className="flex justify-between gap-3">
          <button
            type="button"
            className="esv2-focus min-h-11 rounded-full border border-foreground/20 px-4 text-sm text-foreground"
            onClick={() => onIndexChange((index - 1 + items.length) % items.length)}
          >
            Previous
          </button>
          <button
            type="button"
            className="esv2-focus min-h-11 rounded-full border border-foreground/20 px-4 text-sm text-foreground"
            onClick={() => onIndexChange((index + 1) % items.length)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export function useLightbox() {
  const [index, setIndex] = useState<number | null>(null)
  return {
    index,
    open: (i: number) => setIndex(i),
    close: () => setIndex(null),
    setIndex,
  }
}
