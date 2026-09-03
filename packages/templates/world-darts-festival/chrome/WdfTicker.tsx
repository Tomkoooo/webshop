"use client"

import { useEffect, useRef } from "react"
import { CmsText } from "@wse/cms-bridge"
import { useSurfaceDocEdit } from "@wse/core/features/template-cms/surface-doc-edit-context"

const REPEAT_COUNT = 4
const SPEED_PX_PER_SEC = 72

function TickerCopy({
  text,
  editable,
}: {
  text: string
  editable?: boolean
}) {
  const display = text.trim() || "Írd ide a futószöveget…"
  return (
    <span className="wdf-ticker-copy inline-flex items-center">
      {Array.from({ length: REPEAT_COUNT }, (_, index) => (
        <span
          key={index}
          className="inline-flex items-center whitespace-nowrap px-6 text-sm font-semibold tracking-[0.12em]"
        >
          {editable && index === 0 ? (
            <CmsText path="chrome.tickerText" value={text} placeholder="Írd ide a futószöveget…" />
          ) : (
            <span>{display}</span>
          )}
          <span className="mx-6 text-primary/70" aria-hidden>
            ◆
          </span>
        </span>
      ))}
    </span>
  )
}

export function WdfTicker({ text }: { text: string }) {
  const cms = useSurfaceDocEdit()
  const trackRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const trimmed = text.trim()

  useEffect(() => {
    const track = trackRef.current
    const root = rootRef.current
    if (!track || !root) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let offset = 0
    let raf = 0
    let last = performance.now()
    track.style.animation = "none"

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const paused = root.contains(document.activeElement)
      if (!paused) {
        const half = track.scrollWidth / 2
        if (half > 0) {
          offset -= SPEED_PX_PER_SEC * dt
          if (-offset >= half) offset += half
          track.style.transform = `translate3d(${offset}px,0,0)`
        }
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [text, cms.enabled])

  if (!trimmed && !cms.enabled) return null

  return (
    <div
      ref={rootRef}
      className="wdf-ticker border-t border-primary/25 text-primary"
      aria-label={trimmed || "Announcement"}
    >
      <div ref={trackRef} className="wdf-ticker-track">
        <TickerCopy text={text} editable={cms.enabled} />
        <span aria-hidden>
          <TickerCopy text={text} />
        </span>
      </div>
    </div>
  )
}
