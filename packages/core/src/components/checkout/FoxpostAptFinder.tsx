"use client"

import * as React from "react"
import { toast } from "sonner"
import { cn } from "@wse/core/lib/utils"
import {
  buildFoxpostAptFinderUrl,
  FOXPOST_APT_FINDER_ORIGIN,
  type FoxpostApmSelection,
  type FoxpostParcelPoint,
} from "@wse/core/lib/foxpost"
import { resolveApmDestinationId } from "@wse/core/lib/parcel-locker"
import { CheckoutRichHtml } from "@wse/core/components/checkout/CheckoutRichHtml"
import {
  cxParcelPickerTrigger,
  ParcelLockerMapDialog,
} from "@wse/core/components/checkout/ParcelLockerMapDialog"
import { type CheckoutStepAppearance } from "@wse/core/components/checkout/checkout-appearance"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"

type FoxpostAptFinderProps = {
  selected?: FoxpostParcelPoint | null
  onSelect: (point: FoxpostParcelPoint) => void
  appearance?: CheckoutStepAppearance
}

function mapSelectionToParcelPoint(apt: FoxpostApmSelection): FoxpostParcelPoint | null {
  const id = resolveApmDestinationId({
    operator_id: apt.operator_id,
    place_id: apt.place_id,
  })
  const name = apt.name?.trim()
  if (!id || !name) return null

  const countryRaw = apt.country?.trim()
  const countryCode = countryRaw
    ? countryRaw.length === 2
      ? countryRaw.toUpperCase()
      : countryRaw.toLowerCase() === "hu"
        ? "HU"
        : undefined
    : "HU"

  return {
    id,
    name,
    address: apt.address?.trim() || apt.street?.trim() || undefined,
    zip: apt.zip?.trim() || undefined,
    city: apt.city?.trim() || undefined,
    findme: apt.findme?.trim() || undefined,
    load: apt.load?.trim() || undefined,
    countryCode,
  }
}

async function validateFoxpostApmSelection(point: FoxpostParcelPoint): Promise<FoxpostParcelPoint | null> {
  const params = new URLSearchParams({
    id: point.id,
    refresh: "1",
  })
  const res = await fetch(`/api/checkout/foxpost/apm?${params.toString()}`, {
    cache: "no-store",
  })
  const data = (await res.json()) as { point?: FoxpostParcelPoint; error?: string }
  if (!res.ok || !data.point) {
    toast.error(
      data.error ||
        "Ez a Foxpost automata jelenleg nem választható. Kérjük, válassz másik pontot."
    )
    return null
  }
  return data.point
}

export function FoxpostAptFinder({
  selected,
  onSelect,
  appearance = "dark",
}: FoxpostAptFinderProps) {
  const onSelectRef = React.useRef(onSelect)
  onSelectRef.current = onSelect
  const hasSelection = Boolean(selected?.id)
  const [dialogOpen, setDialogOpen] = React.useState(!hasSelection)
  const [iframeReloadKey, setIframeReloadKey] = React.useState<number | null>(null)
  const [validatingSelection, setValidatingSelection] = React.useState(false)

  React.useEffect(() => {
    if (!hasSelection) setDialogOpen(true)
  }, [hasSelection])

  React.useEffect(() => {
    if (!dialogOpen) return
    setIframeReloadKey(Date.now())
  }, [dialogOpen])

  React.useEffect(() => {
    const receiveMessage = (event: MessageEvent) => {
      if (!event.origin?.startsWith(FOXPOST_APT_FINDER_ORIGIN)) return
      if (typeof event.data !== "string") return
      if (validatingSelection) return

      try {
        const apt = JSON.parse(event.data) as FoxpostApmSelection
        const point = mapSelectionToParcelPoint(apt)
        if (!point) return

        setValidatingSelection(true)
        void validateFoxpostApmSelection(point)
          .then((canonical) => {
            if (!canonical) return
            onSelectRef.current(canonical)
            setDialogOpen(false)
          })
          .finally(() => {
            setValidatingSelection(false)
          })
      } catch {
        // ignore non-JSON messages from the iframe
      }
    }

    window.addEventListener("message", receiveMessage, false)
    return () => window.removeEventListener("message", receiveMessage, false)
  }, [validatingSelection])

  const iframeSrc =
    iframeReloadKey != null
      ? buildFoxpostAptFinderUrl({
          lang: "hu",
          theme: appearance === "light" ? "default" : "dark",
          reloadToken: iframeReloadKey,
        })
      : null

  return (
    <div className="space-y-4">
      <ParcelLockerMapDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Foxpost csomagautomata választása"
        description="A térkép minden megnyitáskor friss adatokat tölt. A kiválasztás után a párbeszédablak bezárul."
        appearance={appearance}
      >
        {dialogOpen && iframeSrc ? (
          <div className="relative h-full min-h-[50dvh] w-full">
            <iframe
              key={iframeReloadKey ?? undefined}
              title="Foxpost csomagautomata választó"
              src={iframeSrc}
              className="h-full min-h-[50dvh] w-full border-0"
            />
            {validatingSelection ? (
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/50 text-white"
                role="status"
                aria-live="polite"
              >
                <LoadingSpinner size="sm" className="mr-2" />
                Automata ellenőrzése…
              </div>
            ) : null}
          </div>
        ) : null}
      </ParcelLockerMapDialog>
      {hasSelection && selected ? (
        <div
          className={cn(
            "border p-3",
            appearance === "light"
              ? "rounded-lg border-primary-foreground/40 bg-primary/5"
              : "border border-primary-foreground/40 bg-white/5"
          )}
        >
          <p
            className={cn(
              "text-xs font-bold uppercase tracking-wider",
              appearance === "light" ? "text-foreground" : "text-white"
            )}
          >
            Kiválasztott automata: {selected.name}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            {selected.zip || ""} {selected.city || ""} {selected.address || ""}
          </p>
          <CheckoutRichHtml
            html={selected.findme}
            appearance={appearance}
            className="mt-2 text-xs"
          />
        </div>
      ) : (
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
          Még nem választottál Foxpost csomagautomatát.
        </p>
      )}
      {!dialogOpen ? (
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className={cxParcelPickerTrigger(appearance)}
        >
          {hasSelection ? "Másik Foxpost automata választása" : "Foxpost automata kiválasztása a térképen"}
        </button>
      ) : null}
    </div>
  )
}
