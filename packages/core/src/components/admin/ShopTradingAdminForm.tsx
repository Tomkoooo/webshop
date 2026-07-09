"use client"

import * as React from "react"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { AdminFormField } from "@wse/core/components/admin/AdminFormField"
import { AdminPanel } from "@wse/core/components/admin/AdminPanel"
import { cn } from "@wse/core/lib/utils"
import { adminFieldHint, adminInputClass } from "@wse/core/lib/admin-ui"
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
    <div className="max-w-3xl space-y-8">
      <AdminPanel
        title="Szállítás engedélyezett országai"
        description="Üres mező = nincs korlát (mindenhova szállítható). Lista megadása esetén a pénztár csak ezekhez enged szállítási címet és GLS országkódot."
      >
        <AdminFormField label="ISO országkódok">
          <textarea
            id="ship-countries"
            value={shippingText}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setShippingText(e.target.value)}
            rows={3}
            className={cn(adminInputClass, "min-h-[4.5rem] resize-y py-2 font-mono")}
            placeholder="pl. HU, AT, SK vagy egy soronként"
          />
        </AdminFormField>
        <p className={adminFieldHint}>
          Értelmezett:{" "}
          {shipPreview.codes.length
            ? `${formatAllowedCountriesList(shipPreview.codes)} (${shipPreview.codes.join(", ")})`
            : "üres lista — korlát nélkül"}
        </p>
        {shipPreview.warnings.map((w) => (
          <p key={w} className="text-xs text-amber-800">
            {w}
          </p>
        ))}
      </AdminPanel>

      <AdminPanel
        title="Számlázás engedélyezett országai"
        description="Üres = minden ország. Lista esetén a számlázási cím országa csak a felsorolt ISO2 kódok közül lehet."
      >
        <AdminFormField label="ISO országkódok">
          <textarea
            id="inv-countries"
            value={invoiceText}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInvoiceText(e.target.value)}
            rows={3}
            className={cn(adminInputClass, "min-h-[4.5rem] resize-y py-2 font-mono")}
            placeholder="pl. csak HU"
          />
        </AdminFormField>
        <p className={adminFieldHint}>
          Értelmezett:{" "}
          {invPreview.codes.length
            ? `${formatAllowedCountriesList(invPreview.codes)} (${invPreview.codes.join(", ")})`
            : "üres lista — korlát nélkül"}
        </p>
        {invPreview.warnings.map((w) => (
          <p key={w} className="text-xs text-amber-800">
            {w}
          </p>
        ))}
      </AdminPanel>

      <AdminPanel
        title="Foglalási idő maximuma"
        description="Stripe fizetésnél eddig tartjuk a készletet. Üres mező = env/default beállítás. Stripe miatt minimum 30 perc."
      >
        <AdminFormField label="Perc">
          <Input
            type="number"
            min={30}
            value={reservationMinutes}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReservationMinutes(e.target.value)}
            className={cn(adminInputClass, "max-w-xs")}
            placeholder="pl. 60"
          />
        </AdminFormField>
      </AdminPanel>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="button" disabled={busy} onClick={() => void save()}>
          Mentés
        </Button>
        {message ? <span className="text-sm text-foreground">{message}</span> : null}
      </div>
    </div>
  )
}
