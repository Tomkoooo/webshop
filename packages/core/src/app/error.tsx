"use client"

import { useEffect } from "react"
import { Button } from "@wse/core/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[storefront] route error:", error)
  }, [error])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] px-6 text-center text-white">
      <h1 className="font-heading text-3xl font-black uppercase tracking-tighter md:text-4xl">
        Valami hiba történt
      </h1>
      <p className="mt-4 max-w-md text-sm text-neutral-400">
        Az oldal betöltése közben probléma lépett fel. Próbálja újra, vagy frissítse az oldalt.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          className="rounded-none font-black uppercase tracking-widest text-xs"
          onClick={() => reset()}
        >
          Újrapróbálás
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-none border-white/20 font-black uppercase tracking-widest text-xs"
          onClick={() => window.location.reload()}
        >
          Oldal frissítése
        </Button>
      </div>
    </main>
  )
}
