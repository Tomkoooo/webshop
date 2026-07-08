"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, ShoppingBag } from "lucide-react"
import { Badge } from "@wse/core/components/ui/badge"
import { Button } from "@wse/core/components/ui/button"
import { Skeleton } from "@wse/core/components/ui/skeleton"
import { cn } from "@wse/core/lib/utils"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { mediaImageSrc } from "@wse/core/lib/images"
import { isStorefrontProductOrderable } from "@wse/core/lib/storefront-catalog"
import { ProductCardVariantArea } from "@wse/core/components/shop/ProductCardVariantArea"
import { initialCardVariantId } from "@wse/core/lib/product-card-variants"
import {
  isUniqueNumberedProduct,
  productRequiresVariantPurchase,
} from "@wse/core/lib/unique-numbered-variants"
import {
  buildProductListingLines,
  buildRegularProductListingLines,
  getActiveVariants,
  getLimitedPriceOffer,
  getVariantById,
  getVariantLabel,
  hasPurchasableActiveVariants,
  hasVariants,
  resolveProductView,
} from "@wse/core/lib/product-variants"
import { clampVatPercent, customerGrossFromNetWithDiscount, formatHuf, listingHasPriceRange, listingPriceSummary } from "@wse/core/lib/pricing"
import { useCartStore } from "@wse/core/store/useCartStore"
import { trackProductSelectFromListing } from "@wse/core/lib/analytics/product-events"

/**
 * Catalogue **row card** (image + copy side-by-side) — unlike engine `ProductCard` portrait glass tile.
 */
export function AtelierProductCard({
  product,
  shopEnabled = true,
}: {
  product: unknown
  shopEnabled?: boolean
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = product as any
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [isAdded, setIsAdded] = React.useState(false)
  const router = useRouter()
  const addItem = useCartStore((state) => state.addItem)

  const variantProduct = hasVariants(p)
  const requiresVariantSelection = Boolean(p.requireVariantSelection) && variantProduct
  const activeVariants = getActiveVariants(p)
  const [selectedVariantId, setSelectedVariantId] = React.useState(() => initialCardVariantId(p))
  const selectedVariant = getVariantById(p, selectedVariantId)
  const limitedOffer = variantProduct
    ? selectedVariant
      ? getLimitedPriceOffer(p, selectedVariant.id)
      : null
    : getLimitedPriceOffer(p)
  const listingLines = buildProductListingLines(p)
  const regularListingLines = buildRegularProductListingLines(p)
  const showFromPrice = variantProduct && listingHasPriceRange(regularListingLines, p.vatPercent)
  const {
    unitGross: finalPrice,
    unitNet,
    vatPercent: vatPct,
    maxDiscount,
    compareGross,
  } = listingPriceSummary(listingLines, p.vatPercent)
  const ratingValue = typeof p.rating === "number" ? p.rating : 0
  const productOrderable = isStorefrontProductOrderable(p)
  const mustPickVariant = productRequiresVariantPurchase(p)
  const hasPurchasableVariants = hasPurchasableActiveVariants(p)
  const canOrder =
    shopEnabled !== false &&
    productOrderable &&
    (!mustPickVariant || hasPurchasableVariants)

  const handleAddToCart = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!canOrder) return
    if (selectedVariantId && !selectedVariant) return
    if (requiresVariantSelection && !selectedVariant) {
      router.push(`/products/${p.slug}`)
      return
    }
    if (selectedVariant) {
      const productId = p._id.toString()
      const view = resolveProductView(p, selectedVariant.id)
      const vatPercent = clampVatPercent(p.vatPercent)
      addItem({
        id: `${productId}:${selectedVariant.id}`,
        productId,
        variantId: selectedVariant.id,
        variantLabel: getVariantLabel(selectedVariant),
        selectedAttributes: selectedVariant.attributes || {},
        name: view.name,
        slug: p.slug,
        price: customerGrossFromNetWithDiscount(
          Number(view.netPrice || 0),
          Number(view.discount || 0),
          vatPercent,
          view.grossPrice
        ),
        image: mediaImageSrc(view.images?.[0]),
        quantity: 1,
        stock: view.stock,
        netPrice: view.netPrice,
        discount: view.discount,
        vatPercent,
      })
      setIsAdded(true)
      window.setTimeout(() => setIsAdded(false), 2000)
      return
    }
    const view = resolveProductView(p)
    addItem({
      id: p._id.toString(),
      productId: p._id.toString(),
      name: view.name,
      slug: p.slug,
      price: customerGrossFromNetWithDiscount(
        Number(view.netPrice || 0),
        Number(view.discount || 0),
        vatPct,
        view.grossPrice
      ),
      image: mediaImageSrc(view.images?.[0]),
      quantity: 1,
      stock: view.stock,
      netPrice: view.netPrice,
      discount: view.discount,
      vatPercent: vatPct,
    })
    setIsAdded(true)
    window.setTimeout(() => setIsAdded(false), 2000)
  }

  const handleProductNavigate = () => {
    trackProductSelectFromListing(p, selectedVariantId || undefined)
  }

  return (
    <article className="group flex flex-col gap-4 border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-stretch">
      <Link
        href={`/products/${p.slug}`}
        prefetch={false}
        className="relative block h-44 w-full shrink-0 overflow-hidden bg-muted sm:h-auto sm:w-40 sm:min-w-40"
        onClick={handleProductNavigate}
      >
        {!isLoaded && <Skeleton className="absolute inset-0 z-10 rounded-none" />}
        <FallbackImage
          src={mediaImageSrc(p.images?.[0])}
          alt={p.name}
          fill
          onLoad={() => setIsLoaded(true)}
          className={cn(
            "object-cover transition duration-500 group-hover:scale-[1.02]",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
        />
        <div className="pointer-events-none absolute left-2 top-2 z-20 flex flex-wrap gap-1 drop-shadow-sm">
          <Badge className="rounded-full border border-primary-foreground/30 bg-primary px-2 py-0 font-serif text-[9px] uppercase tracking-widest text-primary-foreground">
            {p.category?.name || "Termék"}
          </Badge>
          {maxDiscount > 0 ? (
            <Badge className="rounded-full border border-border bg-card px-2 py-0 font-serif text-[9px] text-foreground">
              −{maxDiscount}%
            </Badge>
          ) : null}
        </div>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/products/${p.slug}`}
              prefetch={false}
              className="block min-w-0"
              onClick={handleProductNavigate}
            >
              <h3 className="font-serif text-lg font-semibold leading-snug tracking-tight text-foreground decoration-primary/0 underline-offset-4 group-hover:underline">
                {p.name}
              </h3>
            </Link>
            <span className="font-serif text-[10px] text-muted-foreground">★ {ratingValue.toFixed(1)}</span>
            {requiresVariantSelection ? (
              <Badge variant="outline" className="rounded-full font-serif text-[9px] uppercase">
                Variáns
              </Badge>
            ) : null}
          </div>
          <p className="mt-2 font-serif text-[10px] uppercase tracking-widest text-muted-foreground">
            Nettó {formatHuf(unitNet)} · ÁFA {vatPct}%
          </p>
          {limitedOffer && !limitedOffer.exhausted ? (
            <p className="mt-2 font-serif text-[10px] uppercase tracking-widest text-primary">
              Első {limitedOffer.limitQuantity} db {formatHuf(limitedOffer.promoUnitGross)}, utána{" "}
              {formatHuf(limitedOffer.regularUnitGross)}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-serif text-xl font-semibold text-foreground">
              {formatHuf(finalPrice)}
              {showFromPrice ? (
                <span className="ml-1 text-xs font-normal text-muted-foreground">tól</span>
              ) : null}
            </p>
            {maxDiscount > 0 ? (
              <p className="font-serif text-sm text-muted-foreground line-through">{formatHuf(compareGross)}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            {variantProduct ? (
              <ProductCardVariantArea
                product={p}
                selectedVariantId={selectedVariantId}
                onVariantChange={setSelectedVariantId}
                chipClassName="rounded-full"
              />
            ) : null}
            <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleAddToCart}
              disabled={!canOrder}
              className="rounded-full border-0 bg-primary font-serif text-xs uppercase tracking-wider text-primary-foreground"
            >
              {isAdded ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <ShoppingBag className="mr-1.5 h-3.5 w-3.5" />}
              {isAdded
                ? "Kosárban"
                : requiresVariantSelection && !selectedVariant
                  ? isUniqueNumberedProduct(p)
                    ? "Sorszám"
                    : "Variáns"
                  : "Kosárba"}
            </Button>
            <Button variant="outline" size="sm" asChild className="rounded-full border-border font-serif text-xs uppercase">
              <Link href={`/products/${p.slug}`} prefetch={false} onClick={handleProductNavigate}>
                Részletek
              </Link>
            </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
