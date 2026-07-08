"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Reveal } from "@wse/core/components/motion/css-reveal"
import { CheckCircle, AlertTriangle, ArrowRight } from "lucide-react"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import { Button } from "@wse/core/components/ui/button"
import { useCartStore } from "@wse/core/store/useCartStore"
import { formatOrderNumberLabel } from "@wse/core/lib/order-number"
import { guestOrderPath } from "@wse/core/lib/order-guest-access"
import { authLoginPath } from "@wse/core/lib/auth-redirect"
import { firePurchaseOnce } from "@wse/core/lib/analytics/track"
import { updateSnapshotTransactionId } from "@wse/core/lib/analytics/checkout-snapshot"

function buildOrderViewHref(
  orderId: string,
  guestToken: string | null,
  isAuthenticated: boolean
): string {
  if (isAuthenticated) return `/profile/orders/${orderId}?recent=1`
  if (guestToken) return guestOrderPath(orderId, guestToken)
  return authLoginPath(`/profile/orders/${orderId}?recent=1`)
}

function buildOrdersListHref(guestToken: string | null, isAuthenticated: boolean): string {
  if (isAuthenticated) return "/profile/orders?recent=1"
  if (guestToken) return authLoginPath("/profile/orders")
  return authLoginPath("/profile/orders")
}

function CheckoutSuccessPageContent() {
  const searchParams = useSearchParams()
  const { status: sessionStatus } = useSession()
  const tempOrderId = searchParams.get("tempOrderId")
  const sessionId = searchParams.get("session_id")
  const initialOrderId = searchParams.get("orderId")
  const initialGuestToken = searchParams.get("guestToken")
  const clearCart = useCartStore((state: { clearCart: () => void }) => state.clearCart)
  const [status, setStatus] = React.useState<"processing" | "success" | "error">(() => {
    if (!tempOrderId) return "success"
    if (!sessionId) return "error"
    return "processing"
  })
  const [orderId, setOrderId] = React.useState<string | null>(initialOrderId)
  const [guestToken, setGuestToken] = React.useState<string | null>(initialGuestToken)

  const isAuthenticated = sessionStatus === "authenticated"

  React.useEffect(() => {
    if (!tempOrderId) return
    if (!sessionId) return
    let stopped = false
    let attempts = 0

    const checkStatus = async () => {
      attempts += 1
      try {
        const params = new URLSearchParams({ tempOrderId, session_id: sessionId })
        const res = await fetch(`/api/checkout/stripe/status?${params.toString()}`)
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.error || "Status fetch failed")
        }
        const data = await res.json()

        if (stopped) return

        if (data?.finalized) {
          clearCart()
          if (data.orderId) setOrderId(data.orderId)
          if (data.guestAccessToken) setGuestToken(data.guestAccessToken)
          setStatus("success")
          return
        }

        if (data?.status === "failed" || data?.status === "expired") {
          setStatus("error")
          return
        }

        if (attempts > 40) {
          setStatus("error")
          return
        }

        setTimeout(checkStatus, 2000)
      } catch {
        if (stopped) return
        if (attempts > 40) {
          setStatus("error")
          return
        }
        setTimeout(checkStatus, 2000)
      }
    }

    checkStatus()
    return () => {
      stopped = true
    }
  }, [tempOrderId, sessionId, clearCart])

  React.useEffect(() => {
    if (status !== "success") return
    const purchaseId = orderId ?? initialOrderId
    if (purchaseId) {
      updateSnapshotTransactionId(purchaseId)
      firePurchaseOnce(purchaseId)
      return
    }
    if (tempOrderId) firePurchaseOnce(tempOrderId)
  }, [status, orderId, initialOrderId, tempOrderId])

  const isStripeFlow = Boolean(tempOrderId)
  const orderViewHref = orderId ? buildOrderViewHref(orderId, guestToken, isAuthenticated) : null
  const ordersListHref = buildOrdersListHref(guestToken, isAuthenticated)
  const followUpCopy = isAuthenticated
    ? "A rendelés állapotáról e-mail értesítést kapsz, és a profilodban követheted a rendelésed állapotát."
    : "A rendelés állapotáról e-mail értesítést kapsz. A visszaigazoló e-mailben találod a rendelés megtekintéséhez szükséges linket; később ugyanazzal az e-mail címmel bejelentkezve a fiókodhoz is hozzárendelheted."

  const successActions = (
    <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch mb-8">
      <Link href="/shop" className="grow sm:grow-0">
        <Button className="w-full bg-emerald-600 text-white hover:bg-emerald-500 h-16 px-10 font-black uppercase tracking-widest text-xs rounded-none">
          Vissza a webshopba
        </Button>
      </Link>
      {orderId && orderViewHref ? (
        <Link href={orderViewHref} className="grow sm:grow-0">
          <Button
            variant="outline"
            className="w-full border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 h-16 px-10 font-black uppercase tracking-widest text-xs rounded-none"
          >
            Rendelés megtekintése
          </Button>
        </Link>
      ) : null}
    </div>
  )

  return (
    <main className="min-h-screen bg-black pt-40 pb-20 px-6">
      <div className="container mx-auto max-w-2xl text-center">
        <Reveal mode="mount" className="glass-card p-16 border-white/5">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-10">
            {status === "processing" ? (
              <div className="w-full h-full bg-primary/20 rounded-full flex items-center justify-center">
                <LoadingSpinner size="xl" />
              </div>
            ) : status === "error" ? (
              <div className="w-full h-full bg-amber-500/15 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-12 h-12 text-amber-400" />
              </div>
            ) : (
              <div className="w-full h-full bg-emerald-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-14 h-14 text-emerald-400" strokeWidth={2} aria-hidden />
              </div>
            )}
          </div>

          {status === "processing" && isStripeFlow && (
            <>
              <h1 className="text-4xl md:text-5xl font-heading font-black text-white mb-6 uppercase tracking-tighter italic">
                FIZETÉS <span className="text-primary-foreground">ELLENŐRZÉSE</span>
              </h1>
              <p className="text-neutral-400 text-lg mb-12 max-w-md mx-auto font-medium">
                A fizetés visszaigazolása folyamatban van. Kérjük, maradj az oldalon, ne zárd be a böngészőt.
              </p>
            </>
          )}

          {status === "success" && isStripeFlow && (
            <>
              <h1 className="text-4xl md:text-5xl font-heading font-black text-white mb-6 uppercase tracking-tighter italic">
                SIKERES <span className="text-emerald-400">FIZETÉS</span>
              </h1>
              <p className="text-neutral-200 text-lg mb-6 max-w-lg mx-auto font-medium leading-relaxed">
                <span className="text-emerald-400 font-black">Sikeres fizetés,</span> a rendelésed azonosítója:
              </p>
              {orderId ? (
                <p className="text-white font-mono text-xl tracking-tight mb-8 break-all px-2">
                  {formatOrderNumberLabel(orderId)}
                </p>
              ) : (
                <p className="text-neutral-500 text-sm mb-8">Az azonosító pillanatokon belül megjelenik.</p>
              )}
              <p className="text-neutral-400 text-base mb-10 max-w-lg mx-auto font-medium leading-relaxed">{followUpCopy}</p>
              {successActions}
              {isAuthenticated ? (
                <Link
                  href={ordersListHref}
                  className="text-neutral-500 hover:text-neutral-300 text-sm font-bold uppercase tracking-widest transition-colors inline-block mb-8"
                >
                  Összes rendeléseim →
                </Link>
              ) : null}
            </>
          )}

          {status === "success" && !isStripeFlow && (
            <>
              <h1 className="text-4xl md:text-5xl font-heading font-black text-white mb-6 uppercase tracking-tighter italic">
                KÖSZÖNJÜK A <span className="text-emerald-400">RENDELÉST!</span>
              </h1>
              {orderId ? (
                <p className="text-white font-mono text-lg tracking-tight mb-6 break-all px-2">
                  {formatOrderNumberLabel(orderId)}
                </p>
              ) : null}
              <p className="text-neutral-400 text-lg mb-10 max-w-md mx-auto font-medium leading-relaxed">
                Rendelésedet rögzítettük és hamarosan feldolgozzuk. {followUpCopy}
              </p>
              {successActions}
            </>
          )}

          {status === "error" && isStripeFlow && (
            <>
              <h1 className="text-4xl md:text-5xl font-heading font-black text-white mb-6 uppercase tracking-tighter italic">
                NEM <span className="text-amber-400">SÍKERÜLT</span>
              </h1>
              <p className="text-neutral-400 text-lg mb-6 max-w-md mx-auto font-medium leading-relaxed">
                A fizetés nem fejeződött be biztonságosan, vagy nem sikerült rögzítenünk a rendelést. Bankkártyás
                tranzakciód előfordulhat, hogy megjelent — ha kérdésed van, vedd fel velünk a kapcsolatot, és közösen
                rendezünk mindent.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
                <Link href="/#contact">
                  <Button className="w-full bg-primary text-white hover:bg-primary/90 h-16 px-10 font-black uppercase tracking-widest text-xs rounded-none">
                    Üzenet küldése (kapcsolat)
                  </Button>
                </Link>
                <Link href="/shop">
                  <Button
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/10 h-16 px-10 font-black uppercase tracking-widest text-xs rounded-none"
                  >
                    Vissza a webshopba
                    <ArrowRight className="ml-2 w-4 h-4 inline" />
                  </Button>
                </Link>
              </div>
            </>
          )}
        </Reveal>
      </div>
    </main>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <React.Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-black pt-40">
          <LoadingSpinner size="lg" />
        </main>
      }
    >
      <CheckoutSuccessPageContent />
    </React.Suspense>
  )
}
