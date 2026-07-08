"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { RevealStepPanel } from "@wse/core/components/motion/css-reveal"
import { Check, ChevronRight, ArrowLeft, Package } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import { cn } from "@wse/core/lib/utils"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { useCheckoutWizardModel } from "@wse/core/components/checkout/use-checkout-wizard-model"
import { ReservationCountdown } from "@wse/core/components/checkout/ReservationCountdown"
import type { CartItem } from "@wse/core/store/useCartStore"
import { clampVatPercent, DEFAULT_VAT_PERCENT } from "@wse/core/lib/pricing"

export function CheckoutPageView({ variant = "page" }: { variant?: "page" | "embedded" }) {
  const embedded = variant === "embedded"
  const wizard = useCheckoutWizardModel({ variant })
  const {
    currentStep,
    steps,
    shopEnabled,
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

  const router = useRouter()
  const searchParams = useSearchParams()

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

  const mainShell = embedded
    ? "min-h-0 bg-transparent px-2 py-2 pb-8 sm:px-3"
    : "min-h-screen w-full bg-background pb-12 pt-28 sm:pb-20 sm:pt-36 lg:pt-44"

  return (
    <main className={cn(mainShell, "relative")}>
      {stripeRedirectHold ? (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-background/95 px-6 py-10"
          role="dialog"
          aria-modal="true"
          aria-labelledby="stripe-redirect-title"
        >
          <div className="max-w-md w-full space-y-8 border border-border bg-card p-8 shadow-lg">
            <h2 id="stripe-redirect-title" className="text-xl font-heading font-black uppercase tracking-tight">
              Stripe fizetés
            </h2>
            <ReservationCountdown
              reservationExpiresAtIso={stripeRedirectHold.reservationExpiresAt}
              serverTimeIso={stripeRedirectHold.serverTime}
              appearance="light"
            />
            <p className="text-sm text-muted-foreground">
              Néhány másodperc múlva automatikusan átirányítunk a biztonságos fizetőoldalra. A készlet addig marad
              lefoglalva, amíg a visszaszámláló le nem jár.
            </p>
            <Button
              type="button"
              className="w-full h-12 rounded-none font-black uppercase tracking-widest text-xs"
              onClick={goToStripeNow}
            >
              Tovább a Stripe-hoz most
            </Button>
          </div>
        </div>
      ) : null}
      {searchParams.get("stripeCancelled") === "1" && (
        <div className="mx-auto mb-8 w-full max-w-4xl px-3 sm:px-6">
          <div className="border border-amber-500/35 bg-amber-500/10 px-6 py-5 space-y-4">
            <p className="text-foreground font-black uppercase tracking-widest text-xs">
              A Stripe fizetés megszakadt — a rendelés nem jött létre.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed font-medium">
              Ha technikai hibát tapasztaltál, írj nekünk üzenetben; segítünk egyeztetni a helyzetet (például
              dupla terhelés vagy sikertelen fizetés után is).
            </p>
            <Link href="/#contact">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-none h-12 px-8 font-black uppercase tracking-widest text-[10px]">
                Kapcsolatfelvételi űrlap megnyitása →
              </Button>
            </Link>
          </div>
        </div>
      )}
      {shopEnabled === false ? (
        <div className="mx-auto w-full max-w-4xl px-3 sm:px-6">
          <div className="glass-card space-y-6 border-border p-8 text-center sm:p-16">
            <p className="text-3xl font-heading font-black uppercase tracking-tighter text-foreground">
              Jelenleg a rendelés leadás szünetel
            </p>
            <Button
              onClick={() => router.push("/")}
              className="bg-primary hover:bg-primary/80 text-primary-foreground h-14 px-10 font-black uppercase tracking-widest text-xs"
            >
              Vissza a főoldalra
            </Button>
          </div>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-6">
          <div
            className={cn(
              "sticky z-40 -mx-3 mb-6 border-b border-border bg-background px-3 pb-4 pt-4 sm:mx-0 sm:mb-10 sm:px-0 sm:pb-6 sm:pt-6",
              embedded ? "top-0" : "top-[72px] sm:top-[80px] lg:top-[90px]"
            )}
          >
            <div className="absolute top-1/2 left-0 z-0 h-px w-full -translate-y-1/2 bg-muted/50" />
            <div className="relative z-10 flex w-full items-start justify-between gap-1 sm:gap-2">
            {steps.map((step, index) => {
              const isActive = index === currentStep
              const isCompleted = index < currentStep
              return (
                <div key={step.id} className="relative flex min-w-0 flex-1 flex-col items-center gap-2 sm:gap-4">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-none border-2 font-black transition-all duration-500 sm:h-12 sm:w-12",
                      isActive
                        ? "border-primary-foreground/35 bg-primary text-primary-foreground shadow-[0_0_20px_color-mix(in_oklab,var(--primary)_30%,transparent)] sm:scale-110"
                        : isCompleted
                          ? "bg-muted text-foreground border-border"
                          : "bg-background border-border text-muted-foreground"
                    )}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
                  </div>
                  <span
                    className={cn(
                      "max-w-full truncate px-0.5 text-center text-[8px] font-black uppercase leading-tight tracking-[0.12em] transition-colors duration-500 sm:text-[10px] sm:tracking-[0.2em]",
                      isActive
                        ? "text-foreground"
                        : isCompleted
                          ? "text-muted-foreground"
                          : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </span>
                </div>
              )
            })}
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:gap-12">
            <div className="min-w-0 lg:col-span-8">
              <RevealStepPanel
                stepKey={currentStep}
                className="glass-card -mx-3 border-x-0 border-border p-4 sm:mx-0 sm:rounded-lg sm:border-x sm:p-6 lg:p-10"
              >
                  <div className="mb-6 flex items-center gap-3 sm:mb-10 sm:gap-4">
                    <div className="h-6 w-1.5 shrink-0 bg-primary sm:h-8" />
                    <h2 className="font-heading text-xl font-black uppercase italic leading-tight text-foreground sm:text-3xl">
                      {steps[currentStep]?.title}
                    </h2>
                  </div>

                  <div className="min-h-0 sm:min-h-[400px]">{renderStep()}</div>

                  <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:mt-12 sm:flex-row sm:items-center sm:justify-between sm:pt-8">
                    <Button
                      variant="ghost"
                      onClick={prevStep}
                      disabled={currentStep === 0}
                      className="h-11 w-full justify-center rounded-none font-black uppercase tracking-widest text-xs text-foreground hover:bg-muted/50 sm:h-auto sm:w-auto sm:justify-start"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Vissza
                    </Button>

                    {currentStep === steps.length - 1 ? (
                      <Button
                        onClick={handleSubmitOrder}
                        disabled={isSubmitting}
                        className="flex h-12 w-full items-center justify-center rounded-none bg-primary px-4 text-[10px] font-black uppercase tracking-widest text-primary-foreground shadow-[0_10px_30px_color-mix(in_oklab,var(--primary)_20%,transparent)] hover:bg-primary/80 sm:h-14 sm:w-auto sm:px-8 sm:text-xs"
                      >
                        <span className="truncate">
                          {isSubmitting ? "Feldolgozás…" : "Megrendelés leadása"}
                        </span>
                        <Check className="ml-2 h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                      </Button>
                    ) : (
                      <Button
                        onClick={nextStep}
                        className="flex h-12 w-full items-center justify-center rounded-none border border-border bg-muted px-6 text-xs font-black uppercase tracking-widest text-foreground hover:bg-muted/80 sm:h-14 sm:w-auto sm:px-10"
                      >
                        Folytatás <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
              </RevealStepPanel>
            </div>

            <div className="min-w-0 lg:col-span-4">
              <div className="glass-card -mx-3 border-x-0 border-border p-4 sm:mx-0 sm:rounded-lg sm:border-x sm:p-6 lg:sticky lg:top-40 lg:p-8">
                <div className="flex items-center gap-3 mb-8 border-b border-border pb-4">
                  <Package className="w-5 h-5 text-primary-foreground" />
                  <h3 className="font-heading font-black text-foreground uppercase tracking-tighter">
                    MEGRENDELÉS
                  </h3>
                </div>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar mb-8">
                  {items.map((item: CartItem) => {
                    const breakdown = priceBreakdownFromGross(
                      item.price,
                      item.quantity,
                      clampVatPercent(item.vatPercent ?? DEFAULT_VAT_PERCENT)
                    )
                    return (
                      <div key={item.id} className="flex gap-4">
                        <div className="relative w-16 h-16 bg-muted border border-border flex-none overflow-hidden">
                          <FallbackImage
                            src={item.image}
                            alt={item.name}
                            width={64}
                            height={64}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div className="grow min-w-0">
                          <p className="text-[10px] font-black text-foreground uppercase truncate">{item.name}</p>
                          {item.variantLabel ? (
                            <p className="text-[10px] text-primary-foreground font-black uppercase tracking-widest mt-1">
                              {item.variantLabel}
                            </p>
                          ) : null}
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                            {item.quantity} x {formatHuf(breakdown.unitGross)}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                            Nettó {formatHuf(breakdown.lineNet)} · ÁFA {formatHuf(breakdown.lineVat)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <span>Részösszeg</span>
                    <span>{formatHuf(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <span>Szállítás</span>
                    <span className={cn(selectedShipping ? "text-foreground" : "text-primary-foreground")}>
                      {selectedShipping ? formatHuf(totals.shippingFee) : "VÁLASZTÁS ALATT"}
                    </span>
                  </div>
                  {selectedPayment && totals.paymentFee > 0 && (
                    <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      <span>Fizetési kezelési díj</span>
                      <span>{formatHuf(totals.paymentFee)}</span>
                    </div>
                  )}
                  {totals.discount > 0 && (
                    <div className="flex justify-between text-[10px] font-black text-primary-foreground uppercase tracking-widest">
                      <span>Kedvezmény</span>
                      <span>-{formatHuf(totals.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <span>Nettó összesen</span>
                    <span>{formatHuf(totalBreakdown.net)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <span>ÁFA összesen</span>
                    <span>{formatHuf(totalBreakdown.vat)}</span>
                  </div>
                  <div className="flex justify-between items-end pt-4">
                    <div className="flex flex-col">
                      <p className="text-[10px] font-black text-foreground uppercase tracking-[0.3em] mb-1">
                        Összesen
                      </p>
                      <p className="text-3xl font-black text-foreground tracking-tighter leading-none">
                        {formatHuf(totalBreakdown.gross)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
