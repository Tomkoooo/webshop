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
      <SelectTrigger id={id}>
        <SelectValue placeholder="Pénznem" />
      </SelectTrigger>
      <SelectContent>
        {TBOOK_CURRENCY_OPTIONS.map((opt) => (
          <SelectItem key={opt.code} value={opt.code}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
