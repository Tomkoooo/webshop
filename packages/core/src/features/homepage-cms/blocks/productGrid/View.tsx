import Link from "next/link"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { mediaImageSrc } from "@wse/core/lib/images"
import { Button } from "@wse/core/components/ui/button"
import type { ProductGridBlock } from "@wse/core/features/homepage-cms/types/block-types"
import { useCmsEdit } from "@wse/core/features/homepage-cms/components/editor/cms-edit-context"
import { EditableTextInline } from "@wse/core/features/homepage-cms/components/primitives/EditableTextInline"
import { EditableLinkInline } from "@wse/core/features/homepage-cms/components/primitives/EditableLinkInline"

type ProductCard = {
  id: string
  name: string
  slug: string
  image: string
  price: number
}

export function ProductGridBlockView({
  block,
  products,
  categories,
}: {
  block: ProductGridBlock
  products: ProductCard[]
  categories: Array<{ id: string; name: string; slug: string }>
}) {
  const cms = useCmsEdit()
  return (
    <section className="border-b border-border bg-background py-16 md:py-20">
      <div className="container mx-auto space-y-6 px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
            {cms.enabled ? (
              <EditableTextInline blockType="productGrid" field="title" value={block.data.title} />
            ) : (
              block.data.title
            )}
          </h2>
          {cms.enabled ? (
            <EditableLinkInline
              blockType="productGrid"
              labelField="viewAllLabel"
              hrefField="viewAllHref"
              label={block.data.viewAllLabel ?? ""}
              href={block.data.viewAllHref ?? ""}
              className="rounded-full px-8 text-sm font-semibold"
            />
          ) : block.data.viewAllLabel && block.data.viewAllHref ? (
            <Button asChild variant="default" size="lg" className="rounded-full px-8 text-sm font-semibold">
              <Link href={block.data.viewAllHref}>{block.data.viewAllLabel}</Link>
            </Button>
          ) : null}
        </div>
        {block.data.description || cms.enabled ? (
          <p className="max-w-lg text-sm text-muted-foreground">
            {cms.enabled ? (
              <EditableTextInline
                blockType="productGrid"
                field="description"
                value={block.data.description}
                multiline
                placeholder="Rövid leírás (opcionális)"
              />
            ) : (
              block.data.description
            )}
          </p>
        ) : null}
        {block.data.categoriesTitle?.trim() ||
        block.data.categoriesDescription?.trim() ||
        cms.enabled ? (
          <div className="space-y-2">
            {block.data.categoriesTitle?.trim() || cms.enabled ? (
              <h3 className="text-base font-medium text-foreground">
                {cms.enabled ? (
                  <EditableTextInline
                    blockType="productGrid"
                    field="categoriesTitle"
                    value={block.data.categoriesTitle ?? ""}
                    placeholder="Kategóriák címe"
                  />
                ) : (
                  block.data.categoriesTitle
                )}
              </h3>
            ) : null}
            {block.data.categoriesDescription?.trim() || cms.enabled ? (
              <p className="text-sm text-muted-foreground">
                {cms.enabled ? (
                  <EditableTextInline
                    blockType="productGrid"
                    field="categoriesDescription"
                    value={block.data.categoriesDescription ?? ""}
                    multiline
                    placeholder="Kategóriák leírása"
                  />
                ) : (
                  block.data.categoriesDescription
                )}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <span
                  key={category.id}
                  className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-foreground"
                >
                  {category.name}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, block.data.maxItems).map((product) => (
            <article
              key={product.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-muted/30"
            >
              <Link
                href={`/products/${product.slug}`}
                prefetch={false}
                className="relative block aspect-square bg-muted"
              >
                <FallbackImage
                  src={mediaImageSrc(product.image)}
                  alt={product.name}
                  fill
                  className="object-cover transition hover:opacity-95"
                />
              </Link>
              <div className="flex flex-1 flex-col gap-2 p-3">
                <p className="text-xs font-medium text-foreground line-clamp-2">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.price.toLocaleString("hu-HU")} Ft</p>
                <Button asChild variant="default" className="mt-auto w-full rounded-full text-sm font-semibold">
                  <Link href={`/products/${product.slug}`} prefetch={false}>
                    View
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
