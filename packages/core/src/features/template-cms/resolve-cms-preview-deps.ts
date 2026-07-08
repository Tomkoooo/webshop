import { toPlainObject } from "@wse/core/lib/to-plain-object"
import { CategoryService } from "@wse/core/services/category"
import { ProductService } from "@wse/core/services/product"
import type { TemplateModule } from "@wse/sdk/templates/types"
import { resolveCommerceShopRendering } from "@wse/core/templates/resolve-commerce-slots"

/**
 * Server deps for `/admin/cms/shop` preview (mirrors storefront shape).
 */
export async function getShopCmsPreviewDeps(
  template: TemplateModule,
  pageSize: number,
  shopEnabled = true
) {
  const filters = {
    search: undefined as string | undefined,
    category: undefined as string | undefined,
    isDiscounted: false,
    sort: "featured" as const,
    isActive: true,
    isVisible: true,
  }

  const [paginationResult, categoriesResult] = await Promise.all([
    ProductService.getStorefrontPaginated(1, pageSize, filters),
    CategoryService.getTree(),
  ])

  const products = toPlainObject(paginationResult.products)
  const categories = toPlainObject(categoriesResult) as unknown[]
  const total = paginationResult.total
  const pages = paginationResult.pages

  return {
    products,
    categories,
    total,
    pages,
    currentPage: 1,
    query: {} as {
      q?: string
      category?: string
      discounted?: boolean
      sort?: string
      page?: number
    },
    shopRendering: resolveCommerceShopRendering(template),
    shopEnabled,
  }
}

/** First visible product for PDP CMS preview, or `null` when catalog is empty. */
export async function getPdpPreviewProduct() {
  const res = await ProductService.getPaginated(1, 1, {
    isActive: true,
    isVisible: true,
    sort: "newest",
  })
  const raw = res.products[0]
  if (!raw) return null
  return toPlainObject(raw)
}
