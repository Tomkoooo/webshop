"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Check, ChevronRight } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import { cn } from "@wse/core/lib/utils"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { useCheckoutWizardModel } from "@wse/core/components/checkout/use-checkout-wizard-model"
import { ReservationCountdown } from "@wse/core/components/checkout/ReservationCountdown"
import type { CartItem } from "@wse/core/store/useCartStore"
import type { FlowRouteMainProps } from "@wse/sdk/templates/types"
import { clampVatPercent, DEFAULT_VAT_PERCENT } from "@wse/core/lib/pricing"

/**
 * Full-bleed checkout: same wizard model as the engine (`useCheckoutWizardModel`), layout unlike
 * `CheckoutPageView` (no glass hero stepper + 8/4 grid — here **segmented top rail** + **summary column first**).
 */
export function AtelierCheckoutExperience({ shopEnabled, variant = "page" }: FlowRouteMainProps) {
  void shopEnabled
  const searchParams = useSearchParams()
  const wizard = useCheckoutWizardModel({ variant, stepAppearance: "light" })
  const {
    currentStep,
    steps,
    shopEnabled: shopOk,
    items,
    nextStep,
    prevStep,
    totals,
    totalBreakdown,
    selectedShipping,
    selectedPayment,
    priceBreakdownFromGross,
    formatHuf,
    renderStep,
    handleSubmitOrder,
    isSubmitting,
    stripeRedirectHold,
    goToStripeNow,
  } = wizard

  React.useEffect(() => {
    if (searchParams.get("stripeCancelled") !== "1") return
    const id = typeof window !== "undefined" ? sessionStorage.getItem("stripeTempOrderId") : null
    if (!id) return
    void fetch("/api/checkout/stripe/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tempOrderId: id }),
    }).finally(() => {
      try {
        sessionStorage.removeItem("stripeTempOrderId")
      } catch {
        /* ignore */
      }
    })
  }, [searchParams])

  const embedded = variant === "embedded"
  const shell = embedded
    ? "min-h-0 bg-transparent py-4"
    : "min-h-screen w-full bg-gradient-to-b from-muted/30 to-background px-3 pb-20 pt-28 sm:px-6 sm:pb-24 sm:pt-36 md:px-10 md:pt-40"

  const summary = (
    <aside className="w-full shrink-0 rounded-2xl border border-border bg-card p-6 shadow-lg lg:max-w-sm">
      <h2 className="border-b border-border pb-3 font-serif text-sm font-semibold uppercase tracking-widest">Rendelés</h2>
      <ul className="mt-4 max-h-[min(50vh,24rem)] space-y-4 overflow-y-auto">
        {items.map((item: CartItem) => {
          const b = priceBreakdownFromGross(
            item.price,
            item.quantity,
            clampVatPercent(item.vatPercent ?? DEFAULT_VAT_PERCENT)
          )
          return (
            <li key={item.id} className="flex gap-3 text-sm">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                <FallbackImage src={item.image} alt={item.name} width={56} height={56} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">{item.name}</p>
                <p className="text-muted-foreground">
                  {item.quantity} × {formatHuf(b.unitGross)}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
      <div className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Részösszeg</span>
          <span>{formatHuf(totals.subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Szállítás</span>
          <span>{selectedShipping ? formatHuf(totals.shippingFee) : "—"}</span>
        </div>
        {selectedPayment && totals.paymentFee > 0 ? (
          <div className="flex justify-between text-muted-foreground">
            <span>Fizetés díj</span>
            <span>{formatHuf(totals.paymentFee)}</span>
          </div>
        ) : null}
        <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
          <span>Összesen</span>
          <span>{formatHuf(totalBreakdown.gross)}</span>
        </div>
      </div>
    </aside>
  )

  return (
    <main className={cn(shell, "relative")}>
      {stripeRedirectHold ? (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-background/95 px-5 py-12"
          role="dialog"
          aria-modal="true"
          aria-labelledby="atelier-stripe-redirect-title"
        >
          <div className="max-w-md w-full space-y-6 rounded-2xl border border-border bg-card p-8 shadow-xl">
            <h2 id="atelier-stripe-redirect-title" className="font-serif text-2xl font-semibold tracking-tight">
              Stripe fizetés
            </h2>
            <ReservationCountdown
              reservationExpiresAtIso={stripeRedirectHold.reservationExpiresAt}
              serverTimeIso={stripeRedirectHold.serverTime}
              appearance="light"
            />
            <p className="text-sm text-muted-foreground font-serif leading-relaxed">
              Hamarosan átirányítunk a Stripe oldalára. A készlet a visszaszámláló végéig marad lefoglalva.
            </p>
            <Button type="button" className="w-full rounded-full font-serif" onClick={goToStripeNow}>
              Tovább a Stripe-hoz most
            </Button>
          </div>
        </div>
      ) : null}
      {searchParams.get("stripeCancelled") === "1" && (
        <div className="mx-auto mb-8 max-w-2xl rounded-xl border border-amber-600/40 bg-amber-500/10 px-5 py-4 font-serif text-sm text-foreground">
          <p className="font-semibold">A Stripe fizetés megszakadt.</p>
          <Link href="/#contact" className="mt-2 inline-block text-primary-foreground underline">
            Kapcsolat
          </Link>
        </div>
      )}

      {shopOk === false ? (
        <div className="mx-auto max-w-lg px-4">
          <div className="rounded-2xl border border-border bg-card px-8 py-12 text-center font-serif shadow-inner">
            <p className="text-lg font-semibold">A rendelés leadása szünetel.</p>
            <Button asChild variant="outline" className="mt-6 rounded-full border-2 font-serif">
              <Link href="/">Főoldal</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-6xl">
          <nav className="mb-10 overflow-x-auto pb-1" aria-label="Pénztár lépések">
            <ol className="flex min-w-0 gap-0 border-b border-border">
              {steps.map((step, i) => {
                const done = i < currentStep
                const active = i === currentStep
                return (
                  <li
                    key={step.id}
                    className={cn(
                      "flex min-w-[7rem] flex-1 items-center justify-center border-b-2 px-2 py-3 text-center font-serif text-[10px] font-semibold uppercase tracking-widest transition-colors sm:min-w-0 sm:px-4 sm:text-[11px]",
                      active
                        ? "border-primary-foreground/35 text-foreground"
                        : done
                          ? "border-transparent text-muted-foreground"
                          : "border-transparent text-muted-foreground/60"
                    )}
                  >
                    <span className="mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] sm:h-7 sm:w-7">
                      {done ? <Check className="h-3 w-3" /> : i + 1}
                    </span>
                    <span className="truncate">{step.title}</span>
                  </li>
                )
              })}
            </ol>
          </nav>

          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
            <div className="order-1 min-w-0 flex-1 space-y-8 lg:order-2">
              <header className="border-b border-border pb-5 font-serif">
                <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">Aktuális lépés</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">{steps[currentStep]?.title}</h1>
              </header>

              <div className="rounded-2xl border border-border bg-background/80 p-4 shadow-sm sm:p-6 md:p-8">
                {renderStep()}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="h-11 w-full rounded-full border-border bg-transparent font-serif text-sm text-foreground hover:bg-muted hover:text-foreground sm:h-auto sm:w-auto"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Vissza
                </Button>
                {currentStep === steps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={handleSubmitOrder}
                    disabled={isSubmitting}
                    className="h-11 w-full rounded-full border border-primary-foreground/35 bg-primary px-6 font-serif text-sm text-primary-foreground hover:bg-primary/90 sm:h-auto sm:w-auto sm:px-8"
                  >
                    {isSubmitting ? "Küldés…" : "Megrendelés"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="h-11 w-full rounded-full border border-primary-foreground/35 bg-primary px-6 font-serif text-sm text-primary-foreground hover:bg-primary/90 sm:h-auto sm:w-auto sm:px-8"
                  >
                    Tovább
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="order-2 lg:order-1 lg:w-[min(100%,22rem)] lg:shrink-0">{summary}</div>
          </div>
        </div>
      )}
    </main>
  )
}
