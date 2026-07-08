"use client"

import type { HomepageBlock } from "@wse/core/features/homepage-cms/types/block-types"
import { getView } from "@wse/core/features/homepage-cms/registry/block-registry-views"

type Props = {
  blocks: HomepageBlock[]
  reviews: Array<{ id: string; name: string; role: string; content: string; rating: number; avatar: string }>
  products: Array<{
    id: string
    name: string
    slug: string
    price: number
    image: string
    category: string
    rating: number
    hasVariants: boolean
    requireVariantSelection: boolean
  }>
  categories: Array<{ id: string; name: string; description: string; image: string; slug: string }>
  company: {
    name: string
    address: string
    phone: string
    email: string
    contactEmails: Array<{ id: string; label: string; email: string }>
  }
  siteContact?: {
    emails: Array<{ id: string; label: string; email: string }>
    phone: string
    address: string
  }
}

export function HomepageRenderer({ blocks, reviews, products, categories, company, siteContact }: Props) {
  return (
    <>
      {blocks.filter((block) => block.enabled !== false).map((block) => {
        const Component = getView(block.type)
        if (!Component) return null
        const selectedProducts =
          block.type === "productGrid"
            ? (() => {
                const ids = block.data.selectedProductIds as string[]
                const byId = new Map(products.map((p) => [p.id, p]))
                const rows =
                  ids.length > 0
                    ? ids.map((id) => byId.get(id)).filter((p): p is (typeof products)[0] => Boolean(p))
                    : products
                return rows
              })().map((product) => ({
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  image: product.image,
                  price: product.price,
                }))
            : []
        const props = {
          block,
          products: selectedProducts,
          reviews,
          categories,
          company,
          siteContact,
        } as unknown as Record<string, unknown>
        return <Component key={block.id} {...props} />
      })}
    </>
  )
}
