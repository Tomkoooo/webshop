import { trackSelectItem } from "./track"
import {
  buildProductListingLines,
  getVariantById,
  getVariantLabel,
  resolveProductView,
} from "@wse/core/lib/product-variants"
import { customerGrossFromNetWithDiscount, listingPriceSummary, clampVatPercent } from "@wse/core/lib/pricing"

type ProductLike = {
  _id: { toString(): string }
  name: string
  slug: string
  vatPercent?: number
  category?: { name?: string }
}

/** Fire select_item when user navigates to a product from listing. */
export function trackProductSelectFromListing(
  product: ProductLike,
  selectedVariantId?: string
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = product as any
  const variant = selectedVariantId ? getVariantById(p, selectedVariantId) : undefined
  const view = resolveProductView(p, variant?.id)
  const vatPct = clampVatPercent(p.vatPercent)
  const listingLines = buildProductListingLines(p)
  const { unitGross } = variant
    ? {
        unitGross: customerGrossFromNetWithDiscount(
          Number(view.netPrice || 0),
          Number(view.discount || 0),
          vatPct,
          view.grossPrice
        ),
      }
    : listingPriceSummary(listingLines, p.vatPercent)
  const productId = product._id.toString()
  trackSelectItem({
    item_id: variant ? `${productId}:${variant.id}` : productId,
    item_name: view.name,
    price: unitGross,
    item_variant: variant ? getVariantLabel(variant as never) : undefined,
    item_category: product.category?.name,
    item_list_name: "Shop",
  })
}
