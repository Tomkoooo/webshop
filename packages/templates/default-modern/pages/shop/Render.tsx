"use client"

import Link from "next/link"
import { Filter } from "lucide-react"
import { ShopHeader } from "@wse/core/components/shop/ShopHeader"
import { ShopFilters } from "@wse/core/components/shop/ShopFilters"
import { ProductCard } from "@wse/core/components/shop/ProductCard"
import { Button } from "@wse/core/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@wse/core/components/ui/sheet"
import { cn } from "@wse/core/lib/utils"
import { EditableDocText } from "@wse/core/features/template-cms/primitives/EditableDocText"
import { useSurfaceDocEdit } from "@wse/core/features/template-cms/surface-doc-edit-context"
import type { RenderProps, ShopPageDeps } from "@wse/sdk/templates/types"
import type { ShopContent } from "./schema"
import { ShopListAnalytics } from "@wse/core/components/analytics/AnalyticsRouteListener"

const COLUMN_CLASSES: Record<2 | 3 | 4, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
}

export function ShopRender({
  content,
  deps,
}: RenderProps<ShopContent, ShopPageDeps>) {
  const cms = useSurfaceDocEdit()
  const { products, categories, total, pages, currentPage, query, shopRendering, shopEnabled } = deps
  const ProductCardCmp = shopRendering?.ProductCard ?? ProductCard
  const gridClasses = COLUMN_CLASSES[content.productGridColumns]
  const filtersOnTop = content.filtersPosition === "top"

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
    <main className="min-h-screen bg-background-dark pt-32 pb-20 px-6">
      <ShopListAnalytics products={products as never} />
      <div className="container mx-auto">
        {(content.heading ||
          content.subheading ||
          cms.enabled) && (
          <div className="mb-10 max-w-3xl">
            {(content.heading || cms.enabled) && (
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white">
                <EditableDocText path="heading" value={content.heading} className="uppercase" />
              </h1>
            )}
            {(content.subheading || cms.enabled) && (
              <p className="mt-4 text-neutral-400">
                <EditableDocText path="subheading" value={content.subheading} multiline />
              </p>
            )}
          </div>
        )}

        <div
          className={cn(
            "grid gap-12",
            filtersOnTop ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-4"
          )}
        >
          {filtersOnTop ? (
            <div className="hidden lg:block">
              <ShopFilters categories={categories as never} />
            </div>
          ) : (
            <>
              <div className="lg:hidden block mb-6">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full btn-krausz bg-transparent border-white/20 text-white rounded-none h-14 flex gap-3 text-xs tracking-widest uppercase"
                    >
                      <Filter className="w-4 h-4" />
                      Szűrők megjelenítése
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="bg-background-dark border-r border-white/10 w-full sm:max-w-md overflow-y-auto"
                  >
                    <div className="mt-12">
                      <ShopFilters categories={categories as never} />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              <aside className="hidden lg:block lg:col-span-1">
                <div className="sticky top-32">
                  <ShopFilters categories={categories as never} />
                </div>
              </aside>
            </>
          )}

          <div className={filtersOnTop ? "" : "lg:col-span-3"}>
            <ShopHeader total={total} q={query.q} />

            {(products as Array<{ _id: { toString(): string } }>).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 border border-white/5 bg-white/5">
                <p className="text-neutral-500 font-medium italic mb-6">
                  <EditableDocText path="emptyStateMessage" value={content.emptyStateMessage} />
                </p>
                <Link href="/shop">
                  <Button
                    variant="outline"
                    className="btn-krausz border-white/20 text-white rounded-none"
                  >
                    MINDEN TERMÉK MUTATÁSA
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className={cn("grid gap-6 mb-12", gridClasses)}>
                  {(products as Array<Record<string, unknown>>).map((product) => (
                    <ProductCardCmp
                      key={String((product._id as { toString(): string }).toString())}
                      product={product as never}
                      shopEnabled={shopEnabled}
                    />
                  ))}
                </div>

                {pages > 1 && (
                  <div className="flex justify-center items-center gap-3">
                    {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                      <Link key={p} href={buildPageHref(p)}>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-12 h-12 rounded-none font-black tracking-widest text-xs",
                            p === currentPage
                              ? "bg-primary border-primary-foreground/35 text-white"
                              : "bg-background-dark border-white/10 text-neutral-500 hover:text-white"
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
        </div>
      </div>
    </main>
  )
}
