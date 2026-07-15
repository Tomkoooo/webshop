"use client"

import type { TBookPriceBasis } from "../lib/vat"
import { TBOOK_VAT_PRESETS } from "../lib/vat"
import { TBookField, TBookSelect } from "./t-book-admin-ui"

/** VAT and net/gross basis only — no amount field (used for hotel-wide pricing settings). */
export function TBookVatSettingsField({
  label = "ÁFA beállítások",
  priceBasis,
  vatPercent,
  onPriceBasisChange,
  onVatPercentChange,
}: {
  label?: string
  priceBasis: TBookPriceBasis
  vatPercent: number
  onPriceBasisChange: (basis: TBookPriceBasis) => void
  onVatPercentChange: (vat: number) => void
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">
        Az alábbi beállítások minden szobatípus árára és csomagajánlatra vonatkoznak.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TBookField label="Ár típusa">
          <TBookSelect
            value={priceBasis}
            onChange={(e) => onPriceBasisChange(e.target.value as TBookPriceBasis)}
          >
            <option value="net">Nettó</option>
            <option value="gross">Bruttó</option>
          </TBookSelect>
        </TBookField>
        <TBookField label="ÁFA %">
          <TBookSelect
            value={String(vatPercent)}
            onChange={(e) => onVatPercentChange(Number(e.target.value))}
          >
            {TBOOK_VAT_PRESETS.map((vat) => (
              <option key={vat} value={vat}>
                {vat}%
              </option>
            ))}
            {!TBOOK_VAT_PRESETS.includes(vatPercent as (typeof TBOOK_VAT_PRESETS)[number]) ? (
              <option value={vatPercent}>{vatPercent}%</option>
            ) : null}
          </TBookSelect>
        </TBookField>
      </div>
    </div>
  )
}
