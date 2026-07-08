export type TBookPriceBasis = "net" | "gross"

export const TBOOK_VAT_PRESETS = [0, 5, 18, 27] as const

export const TBOOK_DEFAULT_VAT_PERCENT = 27

/** Stored admin amount → gross HUF used in quotes and checkout. */
export function toGrossHuf(
  amount: number,
  basis: TBookPriceBasis = "gross",
  vatPercent: number = TBOOK_DEFAULT_VAT_PERCENT
): number {
  const value = Math.max(0, Number.isFinite(amount) ? amount : 0)
  if (basis === "gross") return Math.round(value)
  const rate = Math.max(0, vatPercent) / 100
  return Math.round(value * (1 + rate))
}

export function grossPreview(
  amount: number,
  basis: TBookPriceBasis = "net",
  vatPercent: number = TBOOK_DEFAULT_VAT_PERCENT
): { netHuf: number; grossHuf: number; vatHuf: number } {
  const netHuf = basis === "net" ? Math.round(Math.max(0, amount)) : Math.round(amount / (1 + Math.max(0, vatPercent) / 100))
  const grossHuf = toGrossHuf(amount, basis, vatPercent)
  return { netHuf, grossHuf, vatHuf: grossHuf - netHuf }
}
