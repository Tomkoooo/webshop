"use client"

import { cn } from "@wse/core/lib/utils"
import { Input } from "@wse/core/components/ui/input"
import { formatHuf, priceBreakdownFromGross } from "@wse/core/lib/pricing"
import { AdminFormField } from "@wse/core/components/admin/AdminFormField"

type Props = {
  netPrice: number
  grossPrice: number
  vatPercent: number
  onNetChange: (net: number) => void
  onGrossChange: (gross: number) => void
  netName?: string
  grossName?: string
  showVatHint?: boolean
  compact?: boolean
  className?: string
}

export function AdminPricePairFields({
  netPrice,
  grossPrice,
  vatPercent,
  onNetChange,
  onGrossChange,
  netName,
  grossName,
  showVatHint = true,
  compact = false,
  className,
}: Props) {
  const breakdown = priceBreakdownFromGross(grossPrice, 1, vatPercent)
  const h = compact ? "h-11" : "h-12"
  const inputClass = `bg-background border-border ${h} text-foreground rounded-md w-full`

  const netField = (
    <AdminFormField label="Nettó ár (Ft)">
      <Input
        type="number"
        name={netName}
        value={netPrice}
        onChange={(e) => onNetChange(Number(e.target.value) || 0)}
        className={inputClass}
      />
    </AdminFormField>
  )

  const grossField = (
    <AdminFormField label="Bruttó ár (Ft)">
      <Input
        type="number"
        name={grossName}
        value={grossPrice}
        onChange={(e) => onGrossChange(Number(e.target.value) || 0)}
        className={inputClass}
      />
      {showVatHint && !compact ? (
        <p className="text-xs font-medium text-muted-foreground">
          ÁFA: {formatHuf(breakdown.unitVat)} ({breakdown.vatPercent}%)
        </p>
      ) : null}
    </AdminFormField>
  )

  if (compact) {
    return (
      <div
        className={cn(
          "col-span-2 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:col-span-2 xl:col-span-2",
          className
        )}
      >
        {netField}
        {grossField}
      </div>
    )
  }

  return (
    <>
      {netField}
      {grossField}
    </>
  )
}
