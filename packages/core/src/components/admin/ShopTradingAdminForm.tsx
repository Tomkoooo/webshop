"use client"

import * as React from "react"
import { Button } from "@wse/core/components/ui/button"
import { Label } from "@wse/core/components/ui/label"
import { cn } from "@wse/core/lib/utils"
import {
  formatAllowedCountriesList,
  normalizeIso2,
  resolveCountryInput,
} from "@wse/core/lib/country-codes"
import type { ShopTradingSettings } from "@wse/core/services/shop-trading-settings"

export type ShopTradingAdminFormProps = {
  initial: ShopTradingSettings
}

type ParseResult = { codes: string[]; warnings: string[] }

/** Split free-text tokens (comma / newline / semicolon); resolve ISO2 or fuzzy match. */
export function parseCountryTokens(raw: string): ParseResult {
  const parts = String(raw ?? "")
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const codes: string[] = []
  const warnings: string[] = []
  for (const p of parts) {
    const direct = normalizeIso2(p)
    if (direct) {
      codes.push(direct)
      continue
    }
    const res = resolveCountryInput(p)
    if (res.code) {
      codes.push(res.code)
      continue
    }
    const sug = res.suggestions
      .slice(0, 4)
      .map((s) => `${s.code} (${s.labelHu})`)
      .join("; ")
    warnings.push(sug ? `„${p}” → ${sug}` : `„${p}” — adj meg pontos ISO2 kódot (pl. HU).`)
  }
  return { codes: [...new Set(codes)].sort((a, b) => a.localeCompare(b)), warnings }
}

export function ShopTradingAdminForm({ initial }: ShopTradingAdminFormProps) {
  const [shippingText, setShippingText] = React.useState(() => initial.shippingAllowedCountryCodes.join(", "))
  const [invoiceText, setInvoiceText] = React.useState(() => initial.invoicingAllowedCountryCodes.join(", "))
  const [reservationMinutes, setReservationMinutes] = React.useState(() =>
    initial.maxReservationMinutes != null ? String(initial.maxReservationMinutes) : ""
  )
  const [busy, setBusy] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)

  const shipPreview = React.useMemo(() => parseCountryTokens(shippingText), [shippingText])
  const invPreview = React.useMemo(() => parseCountryTokens(invoiceText), [invoiceText])

  const save = async () => {
    setBusy(true)
    setMessage(null)
    try {
      const ship = parseCountryTokens(shippingText)
      const inv = parseCountryTokens(invoiceText)
      const res = await fetch("/api/admin/shop/trading", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAllowedCountryCodes: ship.codes,
          invoicingAllowedCountryCodes: inv.codes,
          maxReservationMinutes: reservationMinutes.trim() ? Number(reservationMinutes) : null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage(data?.error || "Mentés sikertelen")
        return
      }
      setMessage("Elmentve.")
      setShippingText(data.shippingAllowedCountryCodes.join(", "))
      setInvoiceText(data.invoicingAllowedCountryCodes.join(", "))
      setReservationMinutes(data.maxReservationMinutes != null ? String(data.maxReservationMinutes) : "")
    } catch {
      setMessage("Hálózati hiba")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-10 rounded-none border border-white/10 bg-white/[0.03] p-8 text-white">
      <section className="space-y-3">
        <p className="text-[11px] font-black uppercase tracking-widest text-neutral-500">
          Szállítás engedélyezett országai
        </p>
        <p className="text-sm text-neutral-400">
          Üres mező = nincs korlát (mindenhova szállítható). Lista megadása esetén a pénztár csak ezekhez enged szállítási címet
          és GLS országkódot.
        </p>
        <Label htmlFor="ship-countries" className="sr-only">
          Szállítás ISO országkódok
        </Label>
        <textarea
          id="ship-countries"
          value={shippingText}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setShippingText(e.target.value)}
          rows={3}
          className={cn(
            "min-h-[4.5rem] w-full rounded-none border border-white/15 bg-black/40 px-3 py-2 font-mono text-sm text-white shadow-xs outline-none placeholder:text-neutral-600",
            "focus-visible:border-white/30 focus-visible:ring-1 focus-visible:ring-white/20"
          )}
          placeholder="pl. HU, AT, SK vagy egy soronként"
        />
        <div className="text-[11px] text-neutral-400">
          <span className="font-black uppercase tracking-widest text-neutral-500">Értelmezett: </span>
          {shipPreview.codes.length
            ? `${formatAllowedCountriesList(shipPreview.codes)} (${shipPreview.codes.join(", ")})`
            : "üres lista — korlát nélkül"}
        </div>
        {shipPreview.warnings.map((w) => (
          <p key={w} className="text-[11px] text-amber-400/90">
            {w}
          </p>
        ))}
      </section>

      <section className="space-y-3">
        <p className="text-[11px] font-black uppercase tracking-widest text-neutral-500">
          Számlázás engedélyezett országai
        </p>
        <p className="text-sm text-neutral-400">
          Üres = minden ország. Lista esetén a számlázási cím országa csak a felsorolt ISO2 kódok közül lehet.
        </p>
        <Label htmlFor="inv-countries" className="sr-only">
          Számlázás ISO országkódok
        </Label>
        <textarea
          id="inv-countries"
          value={invoiceText}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInvoiceText(e.target.value)}
          rows={3}
          className={cn(
            "min-h-[4.5rem] w-full rounded-none border border-white/15 bg-black/40 px-3 py-2 font-mono text-sm text-white shadow-xs outline-none placeholder:text-neutral-600",
            "focus-visible:border-white/30 focus-visible:ring-1 focus-visible:ring-white/20"
          )}
          placeholder="pl. csak HU"
        />
        <div className="text-[11px] text-neutral-400">
          <span className="font-black uppercase tracking-widest text-neutral-500">Értelmezett: </span>
          {invPreview.codes.length
            ? `${formatAllowedCountriesList(invPreview.codes)} (${invPreview.codes.join(", ")})`
            : "üres lista — korlát nélkül"}
        </div>
        {invPreview.warnings.map((w) => (
          <p key={w} className="text-[11px] text-amber-400/90">
            {w}
          </p>
        ))}
      </section>

      <section className="space-y-3">
        <p className="text-[11px] font-black uppercase tracking-widest text-neutral-500">
          Foglalási idő maximuma
        </p>
        <p className="text-sm text-neutral-400">
          Stripe fizetésnél eddig tartjuk a készletet. Üres mező = env/default beállítás. Stripe miatt minimum 30 perc.
        </p>
        <input
          type="number"
          min={30}
          value={reservationMinutes}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReservationMinutes(e.target.value)}
          className="h-10 w-full max-w-xs rounded-none border border-white/15 bg-black/40 px-3 py-2 font-mono text-sm text-white shadow-xs outline-none placeholder:text-neutral-600 focus-visible:border-white/30 focus-visible:ring-1 focus-visible:ring-white/20"
          placeholder="pl. 60"
        />
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className="rounded-none bg-primary font-black uppercase tracking-widest"
        >
          Mentés
        </Button>
        {message ? <span className="text-sm text-neutral-300">{message}</span> : null}
      </div>
    </div>
  )
}
