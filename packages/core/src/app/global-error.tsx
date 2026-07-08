"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[storefront] global error:", error)
  }, [error])

  return (
    <html lang="hu">
      <body className="m-0 flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] px-6 text-center font-sans text-white antialiased">
        <h1 className="text-3xl font-bold uppercase tracking-tight">Valami hiba történt</h1>
        <p className="mt-4 max-w-md text-sm text-neutral-400">
          Az alkalmazás nem tudott megfelelően betöltődni. Frissítse az oldalt, vagy próbálja újra később.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-8 cursor-pointer border border-white/25 bg-white px-6 py-3 text-xs font-bold uppercase tracking-widest text-black"
        >
          Újrapróbálás
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-3 cursor-pointer border border-white/25 bg-transparent px-6 py-3 text-xs font-bold uppercase tracking-widest text-white"
        >
          Oldal frissítése
        </button>
      </body>
    </html>
  )
}
