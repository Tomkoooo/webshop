"use client"

import { Reveal } from "@wse/core/components/motion/css-reveal"
import { EditableDocText } from "@wse/core/features/template-cms/primitives/EditableDocText"
import { ProductCard } from "@wse/core/components/shop/ProductCard"
import { CabinovaHeadline } from "../../components/CabinovaMotion"
import type { RenderProps, ShopPageDeps } from "@wse/sdk/templates/types"
import type { ShopContent } from "./schema"
import { ShopListAnalytics } from "@wse/core/components/analytics/AnalyticsRouteListener"

export function ShopRender({ content, deps }: RenderProps<ShopContent, ShopPageDeps>) {
  const { products, shopRendering, shopEnabled } = deps
  const ProductCardCmp = shopRendering?.ProductCard ?? ProductCard

  return (
    <div className="cabinova-root pb-32 pt-28 md:pt-36">
      <ShopListAnalytics products={products as never} />

      <section className="border-b border-border pb-20 md:pb-32">
        <div className="cabinova-page">
          <Reveal>
            <p className="cabinova-eyebrow mb-6">
              <EditableDocText path="eyebrow" value={content.eyebrow} />
            </p>
          </Reveal>
          <h1 className="font-[family-name:var(--font-display)] text-5xl md:text-7xl lg:text-[clamp(3rem,9vw,7rem)] leading-[0.95] tracking-[-0.04em] max-w-5xl">
            <CabinovaHeadline text={content.heading} as="span" />
          </h1>
          <Reveal delayMs={200}>
            <p className="mt-12 max-w-xl text-lg text-muted-foreground leading-relaxed">
              <EditableDocText path="subheading" value={content.subheading} multiline />
            </p>
          </Reveal>
        </div>
      </section>

      <section className="py-24 md:py-32">
        <div className="cabinova-page space-y-24 md:space-y-40">
          {(products as Array<Record<string, unknown>>).length === 0 ? (
            <div className="py-24 text-center text-muted-foreground">
              <EditableDocText path="emptyStateMessage" value={content.emptyStateMessage} />
            </div>
          ) : (
            (products as Array<Record<string, unknown>>).map((product) => (
              <Reveal key={String(product._id ?? product.slug)}>
                <ProductCardCmp product={product} shopEnabled={shopEnabled} />
              </Reveal>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
