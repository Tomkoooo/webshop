import { NextResponse } from "next/server"
import { ShopTradingSettingsService } from "@wse/core/services/shop-trading-settings"

export const dynamic = "force-dynamic"

export async function GET() {
  const s = await ShopTradingSettingsService.get()
  return NextResponse.json({
    shippingAllowedCountryCodes: s.shippingAllowedCountryCodes,
    invoicingAllowedCountryCodes: s.invoicingAllowedCountryCodes,
    shippingRestricted: s.shippingAllowedCountryCodes.length > 0,
    invoicingRestricted: s.invoicingAllowedCountryCodes.length > 0,
  })
}
