/** Inputs used to resolve the image at the top of voucher PDFs. */
export type VoucherHeaderSource = {
  voucherHeaderImage?: string | null
  heroImage?: string | null
  defaultHeroImage?: string | null
}

/**
 * Event-specific header wins; otherwise group default; then event hero; then group default hero.
 */
export function resolveVoucherHeaderImage(
  event: VoucherHeaderSource,
  group?: VoucherHeaderSource | null
): string {
  const eventHeader = event.voucherHeaderImage?.trim()
  if (eventHeader) return eventHeader

  const groupHeader = group?.voucherHeaderImage?.trim()
  if (groupHeader) return groupHeader

  const eventHero = event.heroImage?.trim()
  if (eventHero) return eventHero

  return group?.defaultHeroImage?.trim() || ""
}
