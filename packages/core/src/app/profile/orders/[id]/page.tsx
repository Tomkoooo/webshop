"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { useUserOrderDetail } from "@wse/core/hooks/useUserOrderDetail"
import Link from "next/link"
import { format } from "date-fns"
import { hu } from "date-fns/locale"
import { toast } from "sonner"
import { ArrowLeft, Star } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import { formatOrderNumberLabel } from "@wse/core/lib/order-number"
import { formatHuf, priceBreakdownFromGross, totalsBreakdownForOrderSnapshot, clampVatPercent, DEFAULT_VAT_PERCENT } from "@wse/core/lib/pricing"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { mediaImageSrc } from "@wse/core/lib/images"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"

export default function OrderDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const orderId = params.id as string
  const { order: orderRaw, loading } = useUserOrderDetail(orderId)
  const order = orderRaw as any

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <h2 className="mb-4 text-xl font-black uppercase tracking-[0.2em] text-foreground">
          A rendelés nem található
        </h2>
        <Link href="/profile/orders" className="text-primary-foreground font-black uppercase tracking-widest text-xs hover:underline">
          <ArrowLeft className="w-4 h-4 inline mr-2" /> Vissza a rendelésekhez
        </Link>
      </div>
    )
  }
  const totalBreakdown = totalsBreakdownForOrderSnapshot(order)

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <Link
            href="/profile/orders"
            className="mb-4 flex items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary-foreground"
          >
            <ArrowLeft className="mr-2 h-3 w-3" /> Vissza
          </Link>
          <h2 className="text-xl font-black uppercase tracking-[0.2em] text-foreground">
            Rendelés: <span className="text-muted-foreground">{formatOrderNumberLabel(order._id)}</span>
          </h2>
        </div>
        <div className="text-right">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Dátum</p>
          <p className="text-sm font-black uppercase tracking-widest text-foreground">
            {format(new Date(order.createdAt), "yyyy. MM. dd. HH:mm", { locale: hu })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-sm font-black text-primary-foreground uppercase tracking-[0.2em]">Státusz</h3>
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
            <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Szállítás</p>
            <p className="text-xs font-bold text-foreground">{order.shippingAddress.name}</p>
            <p className="text-xs text-neutral-400">{order.shippingAddress.zip} {order.shippingAddress.city}</p>
            <p className="text-xs text-neutral-400">{order.shippingAddress.street}</p>
            {order.shippingMethod && <p className="text-primary-foreground text-xs font-black uppercase tracking-widest mt-2">{order.shippingMethod.name}</p>}
          </div>
          <div className="space-y-2">
            <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Számlázás</p>
            <p className="text-xs font-bold text-foreground">{order.billingInfo.name}</p>
            <p className="text-xs text-neutral-400">{order.billingInfo.zip} {order.billingInfo.city}</p>
            <p className="text-xs text-neutral-400">{order.billingInfo.street}</p>
            {order.billingInfo.type === "company" && <p className="text-xs text-neutral-400">Adószám: {order.billingInfo.taxNumber}</p>}
            {order.paymentMethod && <p className="text-primary-foreground text-xs font-black uppercase tracking-widest mt-2">{order.paymentMethod.name}</p>}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-black text-primary-foreground uppercase tracking-[0.2em]">Számla</h3>
          <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-4 text-sm font-bold uppercase tracking-widest text-foreground">
            <p>Állapot: {order.invoiceStatus || "pending"}</p>
            <p>Számlaszám: {order.invoiceId || "-"}</p>
            {order.invoiceIssuedAt ? (
              <p>Kiadva: {format(new Date(order.invoiceIssuedAt), "yyyy. MM. dd.", { locale: hu })}</p>
            ) : null}
            <div className="pt-2">
              <a href={order.invoiceDownloadUrl || `/api/user/orders/${order._id}/invoice`} target="_blank" rel="noreferrer">
                <Button className="h-10 rounded-none border border-primary-foreground/35 bg-transparent text-primary-foreground hover:bg-primary/10 uppercase tracking-widest text-[10px] font-black">
                  Számla letöltése
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-sm font-black text-primary-foreground uppercase tracking-[0.2em]">Termékek</h3>
        <div className="divide-y divide-border rounded-xl border border-border">
          {order.items.map((item: any, i: number) => {
            const breakdown = priceBreakdownFromGross(
              item.price,
              item.quantity,
              clampVatPercent(item.vatPercent ?? DEFAULT_VAT_PERCENT)
            )
            return (
            <div key={i} className="p-6 flex flex-col md:flex-row justify-between md:items-center gap-6">
              <div className="flex items-center gap-6 flex-1">
                <FallbackImage src={mediaImageSrc(item.product?.images?.[0])} alt={item.name} width={64} height={64} className="w-16 h-16 object-cover" />
                <div>
                  <h4 className="mb-1 text-sm font-black uppercase tracking-widest text-foreground">
                    {item.product ? (
                      <Link href={`/products/${item.product.slug}`} className="hover:text-primary-foreground transition-colors">
                        {item.name}
                      </Link>
                    ) : (
                      item.name
                    )}
                  </h4>
                  <p className="text-xs text-neutral-500 font-bold tracking-widest">{item.quantity} db x {formatHuf(breakdown.unitGross)} bruttó</p>
                  <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">
                    Nettó {formatHuf(breakdown.lineNet)} · ÁFA {formatHuf(breakdown.lineVat)} ({breakdown.vatPercent}%)
                  </p>
                  {item.variantLabel ? (
                    <p className="text-[10px] text-primary-foreground font-black uppercase tracking-widest mt-1">
                      {item.variantLabel}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Product Review logic for processed orders */}
              {order.status !== "pending" && item.product && (
                <div className="mt-4 w-full border-t border-border pt-4 md:mt-0 md:w-auto md:border-t-0 md:pt-0">
                  <ReviewForm productId={item.product._id} userId={session?.user?.id} existingRatings={item.product.ratings} />
                </div>
              )}
            </div>
            )
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-6">
        <div className="flex justify-between items-center text-sm font-bold text-neutral-400">
          <span>Részösszeg</span>
          <span>{formatHuf(order.subtotal)}</span>
        </div>
        <div className="flex justify-between items-center text-sm font-bold text-neutral-400">
          <span>Nettó összesen</span>
          <span>{formatHuf(totalBreakdown.net)}</span>
        </div>
        <div className="flex justify-between items-center text-sm font-bold text-neutral-400">
          <span>ÁFA összesen</span>
          <span>{formatHuf(totalBreakdown.vat)}</span>
        </div>
        <div className="flex justify-between items-center text-sm font-bold text-neutral-400">
          <span>Szállítási költség</span>
          <span>{formatHuf(order.shippingFee)}</span>
        </div>
        <div className="flex justify-between items-center text-sm font-bold text-neutral-400">
          <span>Kezelési költség</span>
          <span>{formatHuf(order.paymentFee)}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between items-center text-sm font-bold text-primary-foreground">
            <span>Kedvezmény (-{formatHuf(order.discount)})</span>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="font-black uppercase tracking-[0.2em] text-foreground">Összesen</span>
          <span className="text-2xl font-black text-foreground">{formatHuf(order.total)}</span>
        </div>
      </div>
    </div>
  )
}

function ReviewForm({ productId, userId, existingRatings }: { productId: string, userId: string | undefined, existingRatings: any[] }) {
  const existingReview = existingRatings?.find(r => r.user === userId)
  const [rating, setRating] = React.useState(existingReview?.rating || 0)
  const [comment, setComment] = React.useState(existingReview?.comment || "")
  const [hoveredRating, setHoveredRating] = React.useState(0)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Kérjük, válassz csillagot az értékeléshez!")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/user/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, comment })
      })

      if (res.ok) {
        toast.success("Értékelés sikeresen elküldve!")
        setIsOpen(false)
      } else {
        const err = await res.json()
        toast.error(err.error || "Hiba történt")
      }
    } catch {
      toast.error("Hálózati hiba")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (existingReview && !isOpen) {
    return (
      <div className="text-right">
        <div className="flex items-center gap-1 mb-1 justify-end">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} className={`w-3 h-3 ${star <= existingReview.rating ? "fill-primary text-primary-foreground" : "text-neutral-700"}`} />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="text-[10px] font-black uppercase tracking-widest text-muted-foreground underline transition-colors hover:text-foreground"
        >
          Értékelés módosítása
        </button>
      </div>
    )
  }

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="h-10 rounded-lg border border-primary-foreground/35 bg-transparent px-6 font-black uppercase tracking-widest text-[10px] text-primary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        Értékelem
      </Button>
    )
  }

  return (
    <div className="min-w-[300px] space-y-4 rounded-lg border border-border bg-muted/40 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-widest text-foreground">Értékelés:</span>
        <div className="flex items-center gap-1 cursor-pointer">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className={`w-5 h-5 transition-colors ${
                star <= (hoveredRating || rating) ? "fill-primary text-primary-foreground" : "text-neutral-700"
              }`}
            />
          ))}
        </div>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Néhány szó a termékről (opcionális)..."
        className="h-20 w-full resize-none rounded-lg border border-border bg-background p-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      />
      <div className="flex gap-2">
        <Button 
          onClick={() => setIsOpen(false)}
          className="h-10 flex-1 rounded-lg border border-border bg-transparent font-black uppercase tracking-widest text-[10px] text-foreground hover:bg-muted"
        >
          Mégse
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="h-10 flex-1 rounded-lg bg-primary font-black uppercase tracking-widest text-[10px] text-primary-foreground hover:bg-primary/90"
        >
          {isSubmitting ? "..." : "Küldés"}
        </Button>
      </div>
    </div>
  )
}
