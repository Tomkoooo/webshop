import type { ProductFilters } from "@wse/core/services/product"

/**
 * Products eligible for shop listing and checkout suggestions.
 * Uses visibility only — many catalogs keep `isActive: false` while `isVisible: true` (PDP still reachable).
 */
export function storefrontCatalogFilters(): Pick<ProductFilters, "isVisible"> {
  return { isVisible: true }
}

export function isStorefrontCatalogProduct(product: {
  isVisible?: boolean
}): boolean {
  return product.isVisible !== false
}

/** Whether customers may add this product to cart / checkout (preview listings may still be visible). */
export function isStorefrontProductOrderable(product: { isActive?: boolean }): boolean {
  return product.isActive !== false
}
