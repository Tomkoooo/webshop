"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { allIsoCountryCodes, getCountryDisplayName, resolveCountryInput } from "@wse/core/lib/country-codes"
import { cn } from "@wse/core/lib/utils"
import {
  type CheckoutStepAppearance,
  cxInput,
  cxLabel,
  cxSelect,
} from "@wse/core/components/checkout/checkout-appearance"

export type TradingLimits = {
  shippingAllowedCountryCodes: string[]
  invoicingAllowedCountryCodes: string[]
  shippingRestricted: boolean
  invoicingRestricted: boolean
}

type Props = {
  id: string
  /** ISO alpha-2 */
  valueCode: string
  onChangeCode: (code: string) => void
  /** When set + shop restricts this kind, picker only lists allowed countries. */
  limits: TradingLimits | null
  kind: "billing" | "shipping"
  label?: string
  appearance?: CheckoutStepAppearance
  className?: string
}

export function CheckoutCountryPicker({
  id,
  valueCode,
  onChangeCode,
  limits,
  kind,
  label = "Ország",
  appearance = "dark",
  className,
}: Props) {
  const a = appearance
  const restriction =
    kind === "billing"
      ? limits?.invoicingRestricted
        ? limits.invoicingAllowedCountryCodes
        : null
      : limits?.shippingRestricted
        ? limits.shippingAllowedCountryCodes
        : null

  const options = React.useMemo(() => {
    const pool =
      restriction && restriction.length > 0
        ? restriction
        : allIsoCountryCodes().slice().sort((x, y) => x.localeCompare(y))
    return pool.map((code) => ({ code, label: getCountryDisplayName(code, "hu-HU") }))
  }, [restriction])

  const singleOption = options.length === 1 ? options[0] : null
  const showCountrySearch = options.length > 1

  React.useEffect(() => {
    if (singleOption && valueCode !== singleOption.code) {
      onChangeCode(singleOption.code)
    }
  }, [singleOption, valueCode, onChangeCode])

  const [freeInput, setFreeInput] = React.useState("")
  const hints = React.useMemo(() => {
    if (!showCountrySearch || !freeInput.trim()) return []
    const resolved = resolveCountryInput(freeInput).suggestions
    if (restriction && restriction.length > 0) {
      return resolved.filter((h) => restriction.includes(h.code))
    }
    return resolved
  }, [freeInput, restriction, showCountrySearch])

  if (singleOption) {
    return (
      <div className={cn("space-y-2", className)}>
        <p className={cxLabel(a)}>{label}</p>
        <p
          className={cn(
            "border border-border bg-muted/30 px-3 py-2.5 text-sm font-medium text-foreground",
            a === "dark" && "border-white/10 bg-white/5"
          )}
          id={id}
        >
          {singleOption.label}
        </p>
      </div>
    )
  }

  return (
    <div className={cn(showCountrySearch ? "space-y-6" : "space-y-2", className)}>
      <div className="space-y-2">
        <label htmlFor={id} className={cxLabel(a)}>
          {label} (ISO)
        </label>
        <div className="relative w-full">
          <select
            id={id}
            value={valueCode}
            onChange={(e) => onChangeCode(e.target.value)}
            className={cxSelect(a)}
          >
            {options.map((o) => (
              <option key={o.code} value={o.code} className="bg-background text-foreground">
                {o.label} ({o.code})
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
        </div>
        {restriction && restriction.length > 1 ? (
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            {kind === "billing"
              ? "Ez a bolt csak a felsorolt országoknak állít ki számlát."
              : "Ez a bolt csak a felsorolt országokba szállít."}
          </p>
        ) : null}
      </div>

      {showCountrySearch ? (
        <div className="space-y-3 border-t border-border pt-6">
          <p className={cxLabel(a)}>Nem találod? Írd be a nevet vagy a kódot</p>
          <input
            type="text"
            value={freeInput}
            onChange={(e) => setFreeInput(e.target.value)}
            placeholder="pl. Ausztria vagy AT"
            className={cxInput(a)}
            autoComplete="off"
          />
          {hints.length > 0 ? (
            <ul className="flex flex-wrap gap-2" role="list">
              {hints.map((h) => (
                <li key={h.code}>
                  <button
                    type="button"
                    className={cn(
                      "rounded-none border border-border bg-muted/50 px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest",
                      "text-foreground transition-colors hover:border-primary-foreground/40 hover:bg-muted"
                    )}
                    onClick={() => {
                      onChangeCode(h.code)
                      setFreeInput("")
                    }}
                  >
                    {h.code} — {h.labelHu}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
