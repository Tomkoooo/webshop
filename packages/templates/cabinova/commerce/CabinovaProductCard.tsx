"use client"

import Link from "next/link"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { plainTextFromHtml } from "@wse/core/lib/plain-text-from-html"
import { mediaImageSrc } from "@wse/core/lib/images"
import type { ProductCardSlotProps } from "@wse/sdk/templates/types"

type ProductRow = {
  _id?: { toString(): string }
  name: string
  slug: string
  description?: string
  images?: string[]
  displayMinGrossPrice?: number
  grossPrice?: number
  category?: { name?: string } | string
}

function formatPrice(product: ProductRow): string {
  const value = product.displayMinGrossPrice ?? product.grossPrice
  if (value == null) return "On request"
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value)
}

function categoryName(product: ProductRow): string {
  const c = product.category
  if (!c) return "Model"
  if (typeof c === "string") return c
  return c.name || "Model"
}

export function CabinovaProductCard({ product: raw }: ProductCardSlotProps) {
  const product = raw as ProductRow
  const image = product.images?.[0] ?? "/template-assets/cabinova/hero-forest.jpg"
  const tagline = plainTextFromHtml(product.description).slice(0, 140)

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group grid md:grid-cols-12 gap-8 md:gap-16 items-center"
    >
      <div className="md:col-span-7 relative aspect-[4/3] overflow-hidden bg-muted">
        <FallbackImage
          src={mediaImageSrc(image)}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-[1500ms] group-hover:scale-105"
        />
      </div>
      <div className="md:col-span-5">
        <div className="flex items-baseline gap-4 mb-6">
          <span className="font-mono text-xs text-muted-foreground tracking-[0.2em] uppercase">
            {categoryName(product)}
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <h2 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl tracking-tight group-hover:text-accent transition-colors duration-500">
          {product.name}
        </h2>
        {tagline ? <p className="mt-6 text-lg text-muted-foreground leading-relaxed">{tagline}</p> : null}
        <dl className="mt-10 grid grid-cols-2 gap-y-4 text-sm border-t border-border pt-6">
          <dt className="text-muted-foreground">From</dt>
          <dd className="text-right font-mono">{formatPrice(product)}</dd>
        </dl>
        <div className="mt-8 inline-flex items-center gap-3 text-sm uppercase tracking-[0.2em] text-accent">
          View model
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </div>
      </div>
    </Link>
  )
}
