"use client"

import { useEffect, useState } from "react"
import { Beer } from "lucide-react"

const STORAGE_KEY = "sorfeszt-age-ok"

export function AgeGate({ disabled }: { disabled?: boolean }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (disabled) return
    try {
      if (window.sessionStorage.getItem(STORAGE_KEY) === "1") return
    } catch {
      /* ignore */
    }
    setOpen(true)
  }, [disabled])

  if (disabled || !open) return null

  const accept = () => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, "1")
    } catch {
      /* ignore */
    }
    setOpen(false)
  }

  const decline = () => {
    window.location.assign("https://www.google.com")
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-primary/80 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sorfeszt-age-title"
        className="w-full max-w-md rounded-xl border border-border bg-background p-8 text-center shadow-lg"
      >
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Beer className="size-6" aria-hidden />
        </div>
        <h2 id="sorfeszt-age-title" className="font-heading text-2xl font-bold text-foreground">
          Elmúltál már 18 éves?
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Az oldalon nagykorúaknak ajánlott termékek találhatóak. Ha elmúltál 18, kattints az Igen
          gombra.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={accept}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            Igen
          </button>
          <button
            type="button"
            onClick={decline}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground"
          >
            Nem
          </button>
        </div>
      </div>
    </div>
  )
}
