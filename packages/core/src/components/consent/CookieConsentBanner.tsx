"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@wse/core/components/ui/button"
import { isAnalyticsEnabled } from "@wse/core/lib/analytics/config"
import { hasConsentDecision, writeConsent } from "@wse/core/lib/analytics/consent"
import { pushConsentDefaultDenied } from "@wse/core/lib/analytics/data-layer"

export function CookieConsentBanner() {
  const enabled = isAnalyticsEnabled()
  const [visible, setVisible] = React.useState(false)
  const [showCustomize, setShowCustomize] = React.useState(false)
  const [marketing, setMarketing] = React.useState(false)

  React.useEffect(() => {
    if (!enabled) return
    pushConsentDefaultDenied()
    setVisible(!hasConsentDecision())
  }, [enabled])

  if (!enabled || !visible) return null

  const save = (acceptMarketing: boolean) => {
    writeConsent(acceptMarketing)
    setVisible(false)
  }

  return (
    <div
      role="dialog"
      aria-label="Süti beállítások"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-white/10 bg-neutral-950/95 p-4 shadow-2xl backdrop-blur-md sm:p-6"
    >
      <div className="container mx-auto max-w-4xl">
        <p className="text-sm font-medium text-neutral-200 leading-relaxed">
          A weboldal működéséhez szükséges sütiket mindig használunk. Marketing és mérési sütiket (Google Tag
          Manager, Meta Pixel) csak az Ön hozzájárulásával töltünk be, hogy mérni tudjuk a látogatottságot és a
          hirdetések hatékonyságát.
        </p>
        {showCustomize ? (
          <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-neutral-300">
            <input
              type="checkbox"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-white/20"
            />
            <span>
              Marketing és analitikai sütik (Google Tag Manager, Meta Pixel, konverziókövetés)
            </span>
          </label>
        ) : null}
        <p className="mt-2 text-xs text-neutral-500">
          Részletek:{" "}
          <Link href="/privacy" className="underline hover:text-neutral-300">
            Adatvédelmi tájékoztató
          </Link>
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Button
            type="button"
            className="rounded-none font-black uppercase tracking-widest text-xs"
            onClick={() => save(true)}
          >
            Összes elfogadása
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-none border-white/20 font-black uppercase tracking-widest text-xs"
            onClick={() => save(false)}
          >
            Csak szükséges
          </Button>
          {showCustomize ? (
            <Button
              type="button"
              variant="secondary"
              className="rounded-none font-black uppercase tracking-widest text-xs"
              onClick={() => save(marketing)}
            >
              Mentés
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              className="rounded-none font-black uppercase tracking-widest text-xs text-neutral-400"
              onClick={() => setShowCustomize(true)}
            >
              Testreszabás
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
