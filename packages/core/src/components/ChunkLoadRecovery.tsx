"use client"

import * as React from "react"
import { Button } from "@wse/core/components/ui/button"

function isChunkLoadError(reason: unknown): boolean {
  if (!(reason instanceof Error)) return false
  const message = reason.message.toLowerCase()
  return (
    reason.name === "ChunkLoadError" ||
    message.includes("loading chunk") ||
    message.includes("failed to fetch dynamically imported module") ||
    message.includes("importing a module script failed")
  )
}

/**
 * Surfaces a reload affordance when a JS chunk fails to load (common after deploys).
 */
export function ChunkLoadRecovery() {
  const [failed, setFailed] = React.useState(false)

  React.useEffect(() => {
    const onError = (event: ErrorEvent) => {
      if (isChunkLoadError(event.error)) setFailed(true)
    }
    const onRejection = (event: PromiseRejectionEvent) => {
      if (isChunkLoadError(event.reason)) setFailed(true)
    }
    window.addEventListener("error", onError)
    window.addEventListener("unhandledrejection", onRejection)
    return () => {
      window.removeEventListener("error", onError)
      window.removeEventListener("unhandledrejection", onRejection)
    }
  }, [])

  if (!failed) return null

  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-0 z-[200] border-b border-amber-500/40 bg-neutral-950 px-4 py-3 text-center text-sm text-neutral-200 shadow-lg"
    >
      <p className="font-medium">Az oldal egy része nem töltődött be. Frissítés szükséges lehet.</p>
      <Button
        type="button"
        size="sm"
        className="mt-2 rounded-none font-black uppercase tracking-widest text-[10px]"
        onClick={() => window.location.reload()}
      >
        Oldal frissítése
      </Button>
    </div>
  )
}
