"use client"

import * as React from "react"
import Link from "next/link"
import { useCheckoutWithSuggestions } from "@wse/core/components/checkout-suggestions/CheckoutSuggestionsDialog"
import { Reveal, RevealListItem } from "@wse/core/components/motion/css-reveal"
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Truck,
  CreditCard,
} from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import { cn } from "@wse/core/lib/utils"
import { useCartStore, type CartItem } from "@wse/core/store/useCartStore"
import { Separator } from "@wse/core/components/ui/separator"
import { formatHuf, priceBreakdownFromGross, totalsFromMixedVatLines, clampVatPercent, DEFAULT_VAT_PERCENT } from "@wse/core/lib/pricing"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import { CartLineOrderabilityMessage } from "@wse/core/components/cart/CartLineOrderabilityMessage"
import { useCartLineIssues } from "@wse/core/hooks/useCartLineIssues"

export type CartPageVariant = "page" | "embedded"

export function CartPageView({
  variant = "page",
  showPageHeading = true,
}: {
  variant?: CartPageVariant
  /** When false, template flow shell supplies the page title (default-modern cart). */
  showPageHeading?: boolean
}) {
  const embedded = variant === "embedded"
  const { items, removeItem, updateQuantity, totalItems, replaceItems } = useCartStore()
  const [exitingItemId, setExitingItemId] = React.useState<string | null>(null)

  const removeItemWithAnimation = React.useCallback(
    (id: string) => {
      if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        removeItem(id)
        return
      }
      setExitingItemId(id)
      window.setTimeout(() => {
        removeItem(id)
        setExitingItemId(null)
      }, 280)
    },
    [removeItem]
  )
  const { issues, hasIssues } = useCartLineIssues(items, {
    reconcile: true,
    onReconciled: replaceItems,
  })
  const { beginCheckout, checkoutModalUI, checkoutSuggestionsLoading } = useCheckoutWithSuggestions()
  const [shopEnabled, setShopEnabled] = React.useState<boolean | null>(null)
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 5
  const totalPages = Math.ceil(items.length / itemsPerPage)
  const paginatedItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalBreakdown = React.useMemo(
    () =>
      totalsFromMixedVatLines(
        items.map((i: CartItem) => ({
          grossUnit: i.price,
          quantity: i.quantity,
          vatPercent: clampVatPercent(i.vatPercent ?? DEFAULT_VAT_PERCENT),
        }))
      ),
    [items]
  )

  React.useEffect(() => {
    const loadAvailability = async () => {
      try {
        const res = await fetch("/api/shop/availability")
        if (!res.ok) {
          setShopEnabled(false)
          return
        }
        const data = await res.json()
        setShopEnabled(Boolean(data.enabled))
      } catch {
        setShopEnabled(false)
      }
    }
    loadAvailability()
  }, [])

  const shell = embedded
    ? "min-h-0 bg-transparent py-2 pb-6 px-2 sm:px-3"
    : cn(
        "min-h-screen bg-background pb-20 px-6",
        showPageHeading ? "pt-48" : "pt-0"
      )

  if (shopEnabled === false) {
    return (
      <main className={shell}>
        <div className="container mx-auto max-w-4xl text-center">
          <div className="glass-card p-20 border-border">
            <h1 className="text-4xl font-heading font-black text-foreground mb-6 uppercase tracking-tighter">
              JELENLEG A RENDELÉS LEADÁS SZÜNETEL
            </h1>
            <Link href="/">
              <Button className="bg-primary hover:bg-primary/80 text-primary-foreground h-16 px-12 text-lg btn-krausz font-black">
                VISSZA A FŐOLDALRA <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (shopEnabled === null) {
    return (
      <main className={shell}>
        {embedded ? (
          <div className="flex justify-center py-12" aria-busy="true">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="flex min-h-[40vh] flex-col items-center justify-center py-16" aria-busy="true">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-sm text-muted-foreground">Betöltés…</p>
          </div>
        )}
      </main>
    )
  }

  if (items.length === 0) {
    return (
      <main className={shell}>
        <div className="container mx-auto max-w-4xl text-center">
          <Reveal mode="mount" className="glass-card p-20 border-border">
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-muted/50">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="mb-6 text-4xl font-heading font-black uppercase tracking-tighter text-foreground">
              A KOSARAD ÜRES
            </h1>
            <p className="mx-auto mb-10 max-w-md text-lg text-muted-foreground">
              Még nem adtál hozzá semmit a kosaradhoz. Fedezd fel professzionális szerszám kínálatunkat!
            </p>
            <Link href="/shop">
              <Button className="h-16 bg-primary px-12 text-lg font-black text-primary-foreground hover:bg-primary/80 btn-krausz">
                IRÁNY A BOLT <ArrowRight className="ml-2 inline h-5 w-5" />
              </Button>
            </Link>
          </Reveal>
        </div>
      </main>
    )
  }

  return (
    <main className={shell}>
      <div className="container mx-auto">
        <div className="flex flex-col gap-12 lg:flex-row">
          <div className="lg:grow">
            {showPageHeading ? (
              <div className="mb-10 flex items-center justify-between">
                <h1 className="text-4xl font-heading font-black uppercase tracking-tighter text-foreground md:text-5xl">
                  KOSÁR{" "}
                  <span className="text-[var(--primary-foreground)]">({totalItems})</span>
                </h1>
              </div>
            ) : (
              <p className="mb-6 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                {totalItems} tétel a kosárban
              </p>
            )}

            <div className="space-y-4">
                {paginatedItems.map((item: CartItem) => {
                  const breakdown = priceBreakdownFromGross(
                    item.price,
                    item.quantity,
                    clampVatPercent(item.vatPercent ?? DEFAULT_VAT_PERCENT)
                  )
                  return (
                    <RevealListItem
                      key={item.id}
                      exiting={exitingItemId === item.id}
                      className="glass-card border-border p-4 sm:p-6"
                    >
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:items-start">
                        <div className="relative mx-auto h-32 w-32 shrink-0 overflow-hidden border border-border bg-muted sm:mx-0">
                          <FallbackImage
                            src={item.image}
                            alt={item.name}
                            width={128}
                            height={128}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 text-center sm:text-left">
                          <Link href={`/products/${item.slug}`}>
                            <h3 className="mb-2 text-xl font-heading font-black uppercase text-foreground transition-colors hover:text-[var(--primary-foreground)]">
                              {item.name}
                            </h3>
                          </Link>
                          {item.variantLabel ? (
                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--primary-foreground)]">
                              {item.variantLabel}
                            </p>
                          ) : null}
                          {item.discount > 0 ? (
                            <p className="mt-2 text-sm font-bold text-[var(--primary-foreground)]">
                              -{item.discount}% KEDVEZMÉNY
                            </p>
                          ) : null}
                          <CartLineOrderabilityMessage message={issues[item.id]} />
                          <div className="mt-4 inline-flex items-center border border-border bg-muted/50 p-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-none text-foreground hover:bg-muted"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-12 text-center font-black text-foreground">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-none text-foreground hover:bg-muted"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.stock}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-start justify-between gap-4 border-t border-border pt-4 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
                          <div className="min-w-[10rem] text-left sm:text-right">
                            <p className="text-2xl font-black tabular-nums text-foreground">
                              {formatHuf(breakdown.lineGross)}
                            </p>
                            <dl className="mt-2 space-y-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              <div className="flex justify-between gap-4 sm:block">
                                <dt className="sm:inline">Egység nettó</dt>
                                <dd className="tabular-nums sm:inline sm:before:content-[':_']">
                                  {formatHuf(breakdown.unitNet)}
                                </dd>
                              </div>
                              <div className="flex justify-between gap-4 sm:block">
                                <dt className="sm:inline">Egység ÁFA ({breakdown.vatPercent}%)</dt>
                                <dd className="tabular-nums sm:inline sm:before:content-[':_']">
                                  {formatHuf(breakdown.unitVat)}
                                </dd>
                              </div>
                              <div className="flex justify-between gap-4 sm:block">
                                <dt className="sm:inline">Egység bruttó</dt>
                                <dd className="tabular-nums sm:inline sm:before:content-[':_']">
                                  {formatHuf(breakdown.unitGross)}
                                </dd>
                              </div>
                            </dl>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 rounded-none text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                            onClick={() => removeItemWithAnimation(item.id)}
                            aria-label="Tétel eltávolítása"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </RevealListItem>
                  )
                })}
            </div>

            {totalPages > 1 ? (
              <div className="mt-10 flex justify-center gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button
                    key={i}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    className={cn(
                      "h-12 w-12 rounded-none font-black transition-all",
                      currentPage === i + 1
                        ? "border-primary-foreground/35 bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-muted-foreground/30"
                    )}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex-none lg:w-[400px]">
            <div className="glass-card sticky top-40 border-border p-10">
              <h2 className="mb-8 border-b border-border pb-4 text-2xl font-heading font-black uppercase tracking-tighter text-foreground">
                RENDELÉS ÖSSZESÍTŐ
              </h2>

              <div className="mb-10 space-y-6">
                <div className="flex items-center justify-between gap-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  <span>Részösszeg (Nettó)</span>
                  <span className="tabular-nums text-foreground">{formatHuf(totalBreakdown.net)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  <span>ÁFA</span>
                  <span className="tabular-nums text-foreground">{formatHuf(totalBreakdown.vat)}</span>
                </div>
                <Separator className="bg-border" />
                <div className="flex items-end justify-between gap-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                    Fizetendő összesen
                  </span>
                  <span className="text-4xl font-black leading-none tracking-tighter tabular-nums text-foreground">
                    {formatHuf(totalBreakdown.gross)}
                  </span>
                </div>
              </div>

              {hasIssues ? (
                <p className="mb-4 text-sm font-semibold text-red-600 dark:text-red-400">
                  A kosárban nem rendelhető tételek vannak. Javítsd vagy távolítsd el őket a pénztár előtt.
                </p>
              ) : null}

              <Button
                type="button"
                disabled={checkoutSuggestionsLoading || hasIssues}
                className="group h-20 w-full overflow-hidden bg-primary text-xl font-black uppercase tracking-widest text-primary-foreground hover:bg-primary/80 btn-krausz"
                onClick={() => void beginCheckout()}
              >
                <span className="relative z-10 flex items-center justify-center gap-4">
                  PÉNZTÁRHOZ
                  <ArrowRight className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-2" />
                </span>
              </Button>

              <div className="mt-10 space-y-4">
                <div className="group flex items-center gap-4 rounded-none border border-border bg-muted/50 p-4 transition-colors hover:border-primary-foreground/30">
                  <Truck className="h-5 w-5 text-primary-foreground" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Gyors és biztos házhozszállítás
                  </span>
                </div>
                <div className="group flex items-center gap-4 rounded-none border border-border bg-muted/50 p-4 transition-colors hover:border-primary-foreground/30">
                  <ShieldCheck className="h-5 w-5 text-primary-foreground" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Hivatalos garancia minden termékre
                  </span>
                </div>
                <div className="group flex items-center gap-4 rounded-none border border-border bg-muted/50 p-4 transition-colors hover:border-primary-foreground/30">
                  <CreditCard className="h-5 w-5 text-primary-foreground" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Biztonságos online fizetési lehetőségek
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {checkoutModalUI}
    </main>
  )
}
