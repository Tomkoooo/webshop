export const DEFAULT_TBOOK_CURRENCY = "HUF" as const

export type TBookCurrencyCode = "HUF" | "EUR" | "USD" | "GBP" | "CHF" | "CZK" | "PLN" | "RON"

export type TBookCurrencyOption = {
  code: TBookCurrencyCode
  label: string
  /** BCP 47 locale for Intl.NumberFormat */
  locale: string
  /** Stripe uses lowercase ISO 4217 codes */
  stripeCode: string
  /** Stripe amounts: HUF/JPY have no minor units (×1), EUR/USD use cents (×100) */
  stripeZeroDecimal: boolean
}

export const TBOOK_CURRENCY_OPTIONS: readonly TBookCurrencyOption[] = [
  { code: "HUF", label: "Magyar forint (HUF)", locale: "hu-HU", stripeCode: "huf", stripeZeroDecimal: true },
  { code: "EUR", label: "Euro (EUR)", locale: "de-DE", stripeCode: "eur", stripeZeroDecimal: false },
  { code: "USD", label: "US dollar (USD)", locale: "en-US", stripeCode: "usd", stripeZeroDecimal: false },
  { code: "GBP", label: "British pound (GBP)", locale: "en-GB", stripeCode: "gbp", stripeZeroDecimal: false },
  { code: "CHF", label: "Swiss franc (CHF)", locale: "de-CH", stripeCode: "chf", stripeZeroDecimal: false },
  { code: "CZK", label: "Czech koruna (CZK)", locale: "cs-CZ", stripeCode: "czk", stripeZeroDecimal: false },
  { code: "PLN", label: "Polish zloty (PLN)", locale: "pl-PL", stripeCode: "pln", stripeZeroDecimal: false },
  { code: "RON", label: "Romanian leu (RON)", locale: "ro-RO", stripeCode: "ron", stripeZeroDecimal: false },
] as const

const byCode = new Map(TBOOK_CURRENCY_OPTIONS.map((c) => [c.code, c]))

export function normalizeTBookCurrency(raw: string | null | undefined): TBookCurrencyCode {
  const code = String(raw ?? "")
    .trim()
    .toUpperCase()
  if (byCode.has(code as TBookCurrencyCode)) return code as TBookCurrencyCode
  return DEFAULT_TBOOK_CURRENCY
}

export function getTBookCurrencyOption(code: string | null | undefined): TBookCurrencyOption {
  return byCode.get(normalizeTBookCurrency(code)) ?? byCode.get(DEFAULT_TBOOK_CURRENCY)!
}

export function formatTBookMoney(amount: number, currency: string | null | undefined = DEFAULT_TBOOK_CURRENCY): string {
  const opt = getTBookCurrencyOption(currency)
  const rounded = opt.stripeZeroDecimal ? Math.round(amount) : Math.round(amount * 100) / 100
  return new Intl.NumberFormat(opt.locale, {
    style: "currency",
    currency: opt.code,
    maximumFractionDigits: opt.stripeZeroDecimal ? 0 : 2,
  }).format(rounded)
}

/** Convert a major-unit amount to Stripe `unit_amount`. */
export function toStripeUnitAmount(amount: number, currency: string | null | undefined): number {
  const opt = getTBookCurrencyOption(currency)
  const major = Math.max(0, Number(amount) || 0)
  if (opt.stripeZeroDecimal) return Math.max(1, Math.round(major))
  return Math.max(1, Math.round(major * 100))
}

export function stripeCurrencyCode(currency: string | null | undefined): string {
  return getTBookCurrencyOption(currency).stripeCode
}

/** Resolves checkout currency for a booking; event and hotel must match when both are set. */
export function resolveBookingCurrency(
  eventCurrency: string | null | undefined,
  hotelCurrency?: string | null
): TBookCurrencyCode {
  const event = normalizeTBookCurrency(eventCurrency)
  if (!hotelCurrency) return event
  const hotel = normalizeTBookCurrency(hotelCurrency)
  if (event !== hotel) {
    throw new Error(
      `A jegy (${event}) és a szállás (${hotel}) pénzneme nem egyezik. Állítsd ugyanarra mindkettőn.`
    )
  }
  return event
}
