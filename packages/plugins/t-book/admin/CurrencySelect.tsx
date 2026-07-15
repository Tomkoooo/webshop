"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wse/core/components/ui/select"
import { TBOOK_CURRENCY_OPTIONS, normalizeTBookCurrency } from "../lib/currency"

export function CurrencySelect({
  value,
  onValueChange,
  id,
}: {
  value: string
  onValueChange: (code: string) => void
  id?: string
}) {
  const normalized = normalizeTBookCurrency(value)
  return (
    <Select value={normalized} onValueChange={onValueChange}>
      <SelectTrigger id={id} className="h-10 w-full bg-background shadow-sm ring-1 ring-border/60">
        <SelectValue placeholder="Pénznem" />
      </SelectTrigger>
      <SelectContent className="z-[300]" position="popper">
        {TBOOK_CURRENCY_OPTIONS.map((opt) => (
          <SelectItem key={opt.code} value={opt.code}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
