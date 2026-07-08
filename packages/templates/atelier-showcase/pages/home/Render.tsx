import { HomepageRenderer } from "@wse/core/features/homepage-cms/render/HomepageRenderer"
import type { RenderProps, HomePageDeps } from "@wse/sdk/templates/types"
import type { HomeContent } from "./schema"

export function HomeRender({ content, deps }: RenderProps<HomeContent, HomePageDeps>) {
  return (
    <div className="bg-background pb-16 pt-36 text-foreground md:pt-40">
      <HomepageRenderer
        blocks={content.blocks}
        siteContact={deps.siteContact}
        reviews={deps.reviews}
        products={deps.products.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          image: p.image,
          category: p.category,
          rating: p.rating,
          hasVariants: p.hasVariants,
          requireVariantSelection: p.requireVariantSelection,
        }))}
        categories={deps.categories}
        company={deps.company}
      />
    </div>
  )
}
