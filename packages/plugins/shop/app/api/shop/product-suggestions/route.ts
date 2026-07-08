import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { shopCommerceBlockedResponse } from "@wse/core/lib/features/shop"
import { ProductSuggestionSettingsService } from "@wse/core/services/product-suggestion-settings"
import { resolveCheckoutSuggestionItems } from "@wse/core/services/checkout-product-suggestions"

const postBodySchema = z.object({
  excludeProductIds: z.array(z.string()).max(200).optional().default([]),
  excludeLineIds: z.array(z.string()).max(200).optional().default([]),
})

export async function POST(request: NextRequest) {
  const blocked = shopCommerceBlockedResponse()
  if (blocked) return blocked

  const json = await request.json().catch(() => ({}))
  const { excludeProductIds, excludeLineIds } = postBodySchema.parse(json)
  const settings = await ProductSuggestionSettingsService.get()

  if (!settings.enabled) {
    return NextResponse.json({
      enabled: false,
      showCartLinesInModal: false,
      items: [] as unknown[],
      modalTitle: settings.modalTitle,
      modalHelper: settings.modalHelper,
    })
  }

  const items =
    settings.sources.length > 0
      ? await resolveCheckoutSuggestionItems(settings, {
          excludeProductIds: new Set(excludeProductIds),
          excludeLineIds: new Set(excludeLineIds),
        })
      : []

  return NextResponse.json({
    enabled: true,
    showCartLinesInModal: Boolean(settings.showCartLinesInModal),
    items,
    modalTitle: settings.modalTitle,
    modalHelper: settings.modalHelper,
  })
}
