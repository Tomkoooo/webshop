"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wse/core/components/ui/select"
import { cn } from "@wse/core/lib/utils"
import { TBOOK_CURRENCY_OPTIONS, normalizeTBookCurrency } from "../lib/currency"
import { tBookControlClass } from "./t-book-admin-ui"

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
      <SelectTrigger
        id={id}
        className={cn(tBookControlClass, "h-10 w-full border-0 data-[placeholder]:text-muted-foreground")}
      >
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
