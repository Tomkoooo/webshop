import type { ComponentType, ReactNode } from "react"
import { ProductCard as DefaultProductCard } from "@wse/core/components/shop/ProductCard"
import { ProductDetail as DefaultProductDetail } from "@wse/core/components/shop/ProductDetail"
import type {
  NavbarSearchSlotProps,
  ProductCardSlotProps,
  ProductDetailSlotProps,
  ShopPageDeps,
  TemplateModule,
} from "@wse/sdk/templates/types"

/** Resolved optional commerce primitives for the active template (defaults preserved). */
export type ResolvedCommerceSlots = {
  ProductCard: ComponentType<ProductCardSlotProps>
  ProductDetail: ComponentType<ProductDetailSlotProps>
  CategoryPill?: ComponentType<{ label: string; active?: boolean; href?: string }>
  PdpChrome?: ComponentType<{ product: unknown; children?: ReactNode }>
  NavbarSearch?: ComponentType<NavbarSearchSlotProps>
}

function DefaultProductDetailSlot(props: ProductDetailSlotProps) {
  return (
    <DefaultProductDetail
      product={props.product as never}
      initialVariantId={props.initialVariantId}
      shopEnabled={props.shopEnabled}
      editorial={props.editorial}
      introPlacement={props.introPlacement}
    />
  )
}

/** Storefront / chrome wiring; omit from CMS JSON deps — pass only from routes/layouts. */
export function resolveCommerceSlots(template: TemplateModule): ResolvedCommerceSlots {
  return {
    ProductCard: template.commerceSlots?.ProductCard ?? DefaultProductCard,
    ProductDetail: template.commerceSlots?.ProductDetail ?? DefaultProductDetailSlot,
    CategoryPill: template.commerceSlots?.CategoryPill,
    PdpChrome: template.commerceSlots?.PdpChrome,
    NavbarSearch: template.commerceSlots?.NavbarSearch,
  }
}

/** Same as `resolveCommerceSlots(template).ProductCard`; kept as a terse import where only the card is needed. */
export function resolveCommerceProductCard(
  template: TemplateModule
): ComponentType<ProductCardSlotProps> {
  return resolveCommerceSlots(template).ProductCard
}

/** `/shop` + CMS shop preview: product card plus optional category pill slot. */
export function resolveCommerceShopRendering(
  template: TemplateModule
): NonNullable<ShopPageDeps["shopRendering"]> {
  const s = resolveCommerceSlots(template)
  const out: NonNullable<ShopPageDeps["shopRendering"]> = { ProductCard: s.ProductCard }
  if (s.CategoryPill) {
    out.CategoryPill = s.CategoryPill
  }
  return out
}

export function resolveCommerceProductDetail(
  template: TemplateModule
): ComponentType<ProductDetailSlotProps> {
  return resolveCommerceSlots(template).ProductDetail
}

import { loadTemplateModuleForCommerce } from "@wse/core/templates/template-commerce-loaders"

/**
 * Async lookup by id — safe from client components (does not import `registry` or plugins).
 */
export async function resolveCommerceProductDetailForId(
  templateId: string
): Promise<ComponentType<ProductDetailSlotProps>> {
  const mod = await loadTemplateModuleForCommerce(templateId)
  return resolveCommerceProductDetail(mod)
}
