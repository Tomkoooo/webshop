"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import { hu } from "date-fns/locale"
import { ArrowLeft } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import { useGuestOrderDetail } from "@wse/core/hooks/useGuestOrderDetail"
import { formatOrderNumberLabel } from "@wse/core/lib/order-number"
import {
  formatHuf,
  priceBreakdownFromGross,
  totalsBreakdownForOrderSnapshot,
  clampVatPercent,
  DEFAULT_VAT_PERCENT,
} from "@wse/core/lib/pricing"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { mediaImageSrc } from "@wse/core/lib/images"
import { authLoginPath } from "@wse/core/lib/auth-redirect"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"

export default function GuestOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const { data: session, status } = useSession()
  const { order: orderRaw, loading, forbidden, token } = useGuestOrderDetail(orderId)
  const order = orderRaw as {
    _id: string
    status: string
    createdAt: string
    total: number
    subtotal: number
    shippingFee: number
    paymentFee: number
    claimedToAccount?: boolean
    invoiceStatus?: string
    invoiceId?: string
    items: Array<{ name: string; price: number; quantity: number; vatPercent?: number; product?: { images?: string[] } }>
    shippingAddress: { name: string; zip: string; city: string; street: string }
    billingInfo: { name: string; zip: string; city: string; street: string }
  } | null

  React.useEffect(() => {
    if (!order?.claimedToAccount) return
    router.replace(`/profile/orders/${orderId}`)
  }, [order?.claimedToAccount, orderId, router])

  if (loading) {
    return (
      <main className="min-h-screen bg-background pt-32 pb-20 px-6">
        <div className="container mx-auto flex justify-center py-20">
          <LoadingSpinner />
        </div>
      </main>
    )
  }

  if (forbidden || !token) {
    return (
      <main className="min-h-screen bg-background pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-lg text-center">
          <h1 className="mb-4 text-xl font-black uppercase tracking-[0.2em] text-foreground">Link lejárt</h1>
          <p className="mb-8 text-sm text-muted-foreground">
            A rendelés megtekintéséhez használd a visszaigazoló e-mailben kapott linket, vagy jelentkezz be ugyanazzal
            az e-mail címmel, amellyel rendeltél.
          </p>
          <Button asChild className="rounded-none font-black uppercase tracking-widest text-xs">
            <Link href={authLoginPath("/profile/orders")}>Bejelentkezés</Link>
          </Button>
        </div>
      </main>
    )
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-background pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-lg text-center">
          <h1 className="mb-4 text-xl font-black uppercase tracking-[0.2em] text-foreground">Rendelés nem található</h1>
          <Link href="/shop" className="text-xs font-bold uppercase tracking-widest text-primary-foreground hover:underline">
            Vissza a webshopba
          </Link>
        </div>
      </main>
    )
  }

  const totalBreakdown = totalsBreakdownForOrderSnapshot(order)
  const invoiceHref = `/api/orders/guest/${orderId}/invoice?token=${encodeURIComponent(token)}`
  const loginHref = authLoginPath(`/orders/guest/${orderId}?token=${encodeURIComponent(token)}`)

  return (
    <main className="min-h-screen bg-background pt-32 pb-20 px-6">
      <div className="container mx-auto max-w-4xl space-y-10">
        {status === "unauthenticated" ? (
          <div className="rounded-xl border border-primary-foreground/30 bg-primary/5 p-4 text-sm text-foreground">
            <p className="mb-3 font-medium">
              Jelentkezz be Google-fiókkal ugyanazzal az e-mail címmel, hogy a rendelés a profilodban is megjelenjen.
            </p>
            <Button asChild size="sm" className="rounded-none font-black uppercase tracking-widest text-[10px]">
              <Link href={loginHref}>Rendelés hozzárendelése fiókhoz</Link>
            </Button>
          </div>
        ) : session?.user ? (
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Bejelentkezve: {session.user.email}
          </p>
        ) : null}

        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <Link
              href="/shop"
              className="mb-4 flex items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary-foreground"
            >
              <ArrowLeft className="mr-2 h-3 w-3" /> Webshop
            </Link>
            <h1 className="text-xl font-black uppercase tracking-[0.2em] text-foreground">
              Rendelés: <span className="text-muted-foreground">{formatOrderNumberLabel(order._id)}</span>
            </h1>
          </div>
          <div className="text-right">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Dátum</p>
            <p className="text-sm font-black uppercase tracking-widest text-foreground">
              {format(new Date(order.createdAt), "yyyy. MM. dd. HH:mm", { locale: hu })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-primary-foreground">Státusz</h2>
            <p className="inline-block rounded-lg border border-border bg-muted/40 p-4 text-sm font-bold uppercase tracking-widest text-foreground">
              {order.status === "pending" && "Függőben"}
              {order.status === "processing" && "Feldolgozás alatt"}
              {order.status === "shipped" && "Kiszállítva"}
              {order.status === "delivered" && "Átvéve"}
              {order.status === "cancelled" && "Törölve"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Szállítás</p>
              <p className="text-xs font-bold text-foreground">{order.shippingAddress.name}</p>
              <p className="text-xs text-neutral-400">
                {order.shippingAddress.zip} {order.shippingAddress.city}
              </p>
              <p className="text-xs text-neutral-400">{order.shippingAddress.street}</p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Számlázás</p>
              <p className="text-xs font-bold text-foreground">{order.billingInfo.name}</p>
              <p className="text-xs text-neutral-400">
                {order.billingInfo.zip} {order.billingInfo.city}
              </p>
              <p className="text-xs text-neutral-400">{order.billingInfo.street}</p>
            </div>
          </div>

          <div className="space-y-4 md:col-span-2">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-primary-foreground">Számla</h2>
            <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-4 text-sm font-bold uppercase tracking-widest text-foreground">
              <p>Állapot: {order.invoiceStatus || "pending"}</p>
              <p>Számlaszám: {order.invoiceId || "-"}</p>
              <a href={invoiceHref} target="_blank" rel="noreferrer">
                <Button className="mt-2 h-10 rounded-none border border-primary-foreground/35 bg-transparent text-[10px] font-black uppercase tracking-widest text-primary-foreground hover:bg-primary/10">
                  Számla letöltése
                </Button>
              </a>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-primary-foreground">Termékek</h2>
          <div className="divide-y divide-border rounded-xl border border-border">
            {order.items.map((item: any, i: number) => {
              const breakdown = priceBreakdownFromGross(
                item.price,
                item.quantity,
                clampVatPercent(item.vatPercent ?? DEFAULT_VAT_PERCENT)
              )
              return (
                <div key={i} className="flex gap-6 p-6">
                  <FallbackImage
                    src={mediaImageSrc(item.product?.images?.[0])}
                    alt={item.name}
                    width={64}
                    height={64}
                    className="h-16 w-16 object-cover"
                  />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-foreground">{item.name}</h3>
                    <p className="text-xs font-bold tracking-widest text-neutral-500">
                      {item.quantity} db × {formatHuf(breakdown.unitGross)} bruttó
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="font-black uppercase tracking-[0.2em] text-foreground">Összesen</span>
            <span className="text-2xl font-black text-foreground">{formatHuf(order.total)}</span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Nettó {formatHuf(totalBreakdown.net)} · ÁFA {formatHuf(totalBreakdown.vat)}
          </p>
        </div>
      </div>
    </main>
  )
}
