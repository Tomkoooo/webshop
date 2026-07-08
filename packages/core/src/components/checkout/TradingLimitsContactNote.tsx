import type { TradingLimits } from "@wse/core/components/checkout/CheckoutCountryPicker"
import type { CheckoutStepAppearance } from "@wse/core/components/checkout/checkout-appearance"
import { formatAllowedCountriesList } from "@wse/core/lib/country-codes"

type Props = {
  limits: TradingLimits | null
  kind: "billing" | "shipping"
  appearance?: CheckoutStepAppearance
}

export function TradingLimitsContactNote({ limits, kind, appearance = "dark" }: Props) {
  const restricted =
    kind === "billing" ? limits?.invoicingRestricted : limits?.shippingRestricted
  const codes =
    kind === "billing"
      ? limits?.invoicingAllowedCountryCodes
      : limits?.shippingAllowedCountryCodes

  if (!restricted || !codes?.length || codes.length === 1) return null

  const list = formatAllowedCountriesList(codes)
  const isLight = appearance === "light"

  return (
    <p
      className={
        isLight
          ? "rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground"
          : "border border-border bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground"
      }
    >
      {kind === "billing" ? (
        <>
          Számlázás jelenleg csak: <span className="text-foreground font-semibold">{list}</span>.
        </>
      ) : (
        <>
          Szállítás jelenleg csak: <span className="text-foreground font-semibold">{list}</span>.
        </>
      )}{" "}
      Más országba szeretnél rendelni?{" "}
      <span className="text-foreground font-semibold">Lépj kapcsolatba az üzlettel</span> a
      rendelés egyeztetéséhez (e-mail / telefon a webshop láblécében).
    </p>
  )
}
