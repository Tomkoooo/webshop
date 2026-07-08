"use client"

import Link from "next/link"
import { ProductCard } from "@wse/core/components/shop/ProductCard"
import { AtelierShopFilters } from "@wse/template-atelier-showcase/pages/shop/AtelierShopFilters"
import { AtelierShopHeader } from "@wse/template-atelier-showcase/pages/shop/AtelierShopHeader"
import { Button } from "@wse/core/components/ui/button"
import { cn } from "@wse/core/lib/utils"
import { EditableDocText } from "@wse/core/features/template-cms/primitives/EditableDocText"
import { useSurfaceDocEdit } from "@wse/core/features/template-cms/surface-doc-edit-context"
import type { RenderProps, ShopPageDeps } from "@wse/sdk/templates/types"
import type { ShopContent } from "./schema"
import { ShopListAnalytics } from "@wse/core/components/analytics/AnalyticsRouteListener"

/**
 * Atelier shop: **full-width filter strip + masonry product columns** — structurally unlike
 * `default-modern` (sidebar / `lg:grid-cols-4` + dark shell + engine `ShopFilters`).
 */
export function ShopRender({ content, deps }: RenderProps<ShopContent, ShopPageDeps>) {
  const cms = useSurfaceDocEdit()
  const { products, categories, total, pages, currentPage, query, shopRendering, shopEnabled } = deps
  const ProductCardCmp = shopRendering?.ProductCard ?? ProductCard
  const CategoryPill = shopRendering?.CategoryPill

  const buildPageHref = (page: number) => {
    const params = new URLSearchParams()
    if (query.q) params.set("q", query.q)
    if (query.category) params.set("category", query.category)
    if (query.discounted) params.set("discounted", "true")
    if (query.sort) params.set("sort", query.sort)
    params.set("page", String(page))
    return `/shop?${params.toString()}`
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-muted/40 via-background to-background pb-28 pt-36 text-foreground md:pt-40">
      <ShopListAnalytics products={products as never} />
      <div className="container mx-auto px-4 sm:px-6">
        {(content.heading || content.subheading || cms.enabled) && (
          <div className="mb-10 flex flex-col gap-4 border-l-4 border-primary-foreground/35 pl-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              {(content.heading || cms.enabled) && (
                <h1 className="font-serif text-4xl font-semibold tracking-tight md:text-5xl">
                  <EditableDocText path="heading" value={content.heading} />
                </h1>
              )}
              {(content.subheading || cms.enabled) && (
                <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
                  <EditableDocText path="subheading" value={content.subheading} multiline />
                </p>
              )}
            </div>
          </div>
        )}

        <section className="mb-10 rounded-2xl border border-border/80 bg-card/60 p-5 shadow-sm backdrop-blur-sm md:p-7">
          <AtelierShopFilters categories={categories as never} CategoryPill={CategoryPill} />
        </section>

        <AtelierShopHeader total={total} q={query.q} />

        {(products as Array<{ _id: { toString(): string } }>).length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/15 py-28">
            <div className="mb-6 h-px w-24 bg-primary/60" aria-hidden />
            <p className="mb-6 max-w-md text-center text-muted-foreground">
              <EditableDocText path="emptyStateMessage" value={content.emptyStateMessage} />
            </p>
            <Button asChild variant="outline" className="rounded-full border-primary-foreground/40 px-10">
              <Link href="/shop">Összes termék</Link>
            </Button>
          </div>
        ) : (
          <>
            <div
              className={cn(
                "columns-1 gap-6 space-y-6 md:columns-2 xl:gap-8",
                content.productGridColumns >= 4 ? "2xl:columns-3" : ""
              )}
            >
              {(products as Array<Record<string, unknown>>).map((product) => (
                <div key={String((product._id as { toString(): string }).toString())} className="break-inside-avoid">
                  <ProductCardCmp product={product as never} shopEnabled={shopEnabled} />
                </div>
              ))}
            </div>

            {pages > 1 && (
              <div className="mt-14 flex flex-wrap items-center justify-center gap-2">
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <Link key={p} href={buildPageHref(p)}>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-10 min-w-10 rounded-full font-serif text-sm",
                        p === currentPage
                          ? "border-primary-foreground/35 bg-primary text-primary-foreground"
                          : "border-border bg-background/80 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {p}
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
