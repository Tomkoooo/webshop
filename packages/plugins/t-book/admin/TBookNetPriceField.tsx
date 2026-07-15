"use client"

import type { TBookPriceBasis } from "../lib/vat"
import { TBOOK_VAT_PRESETS, grossPreview } from "../lib/vat"
import { TBookField, TBookInput, TBookSelect } from "./t-book-admin-ui"
import { formatMoney } from "./t-book-api"

export function TBookNetPriceField({
  label,
  amount,
  priceBasis,
  vatPercent,
  onAmountChange,
  onPriceBasisChange,
  onVatPercentChange,
  currency = "HUF",
}: {
  label: string
  amount: number
  priceBasis: TBookPriceBasis
  vatPercent: number
  onAmountChange: (amount: number) => void
  onPriceBasisChange: (basis: TBookPriceBasis) => void
  onVatPercentChange: (vat: number) => void
  currency?: string
}) {
  const preview = grossPreview(amount, priceBasis, vatPercent)
  const fmt = (value: number) => formatMoney(value, currency)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <TBookField label={label}>
          <TBookInput
            type="number"
            min={0}
            value={amount}
            onChange={(e) => onAmountChange(Number(e.target.value) || 0)}
          />
        </TBookField>
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
      <p className="text-xs text-neutral-500">
        Nettó: <span className="text-neutral-300 font-bold">{fmt(preview.netHuf)}</span>
        {" · "}
        ÁFA: <span className="text-neutral-300 font-bold">{fmt(preview.vatHuf)}</span>
        {" · "}
        Bruttó (fizetendő):{" "}
        <span className="text-amber-900 font-bold">{fmt(preview.grossHuf)}</span>
      </p>
    </div>
  )
}
