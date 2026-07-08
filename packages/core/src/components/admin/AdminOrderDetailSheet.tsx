"use client"

import { useCallback, useEffect, useState, useTransition, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { hu } from "date-fns/locale"
import { Calendar, CreditCard, ExternalLink, MapPin, Truck, User } from "lucide-react"
import { toast } from "sonner"
import {
  generateOrderGlsLabel,
  getOrderById,
  resendOrderInvoiceEmail,
  updateOrderInvoiceData,
  uploadManualInvoicePdf,
} from "@wse/core/actions/admin-orders"
import { OrderStatusButtons } from "@wse/core/components/admin/OrderStatusButtons"
import { OrderCancelButton } from "@wse/core/components/admin/OrderCancelButton"
import { OrderParcelPanel } from "@wse/core/components/admin/OrderParcelPanel"
import { OrderContactEditor } from "@wse/core/components/admin/OrderContactEditor"
import { OrderItemsEditor } from "@wse/core/components/admin/OrderItemsEditor"
import { StandardShippingLabelPanel } from "@wse/core/components/admin/StandardShippingLabelPanel"
import { FoxpostShipmentPanel } from "@wse/core/components/admin/foxpost/FoxpostShipmentPanel"
import { Button } from "@wse/core/components/ui/button"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@wse/core/components/ui/sheet"
import { cn } from "@wse/core/lib/utils"
import { formatOrderNumberLabel } from "@wse/core/lib/order-number"
import { formatHuf, totalsBreakdownForOrderSnapshot } from "@wse/core/lib/pricing"
import { canEditOrderItems } from "@wse/core/lib/order-items-edit"
import {
  getOrderParcelProvider,
  getOrderShippingTypeLabel,
  orderHasParcelShipping,
} from "@wse/core/lib/parcel-locker"
import { isAdminDeletedOrder } from "@wse/core/lib/admin-orders-filters"
import { getOrderParcelDeliveryDisplay } from "@wse/core/lib/parcel-locker-checkout-display"

type AdminOrderDetail = NonNullable<Awaited<ReturnType<typeof getOrderById>>>

type AdminOrderDetailSheetProps = {
  orderId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  glsManagerEnabled: boolean
  foxpostManagerEnabled: boolean
  onOrderUpdated?: () => void
}

function getStatusStyle(status: string) {
  switch (status) {
    case "pending":
      return "text-amber-500 border-amber-500/20 bg-amber-500/5"
    case "processing":
      return "text-blue-500 border-blue-500/20 bg-blue-500/5"
    case "shipped":
      return "text-purple-500 border-purple-500/20 bg-purple-500/5"
    case "delivered":
      return "text-emerald-500 border-emerald-500/20 bg-emerald-500/5"
    case "cancelled":
      return "text-rose-500 border-rose-500/20 bg-rose-500/5"
    default:
      return "text-neutral-500 border-white/10 bg-white/5"
  }
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-neutral-300">
      <div className="admin-section-marker h-4 w-1 rounded-full" />
      {children}
    </h3>
  )
}

export function AdminOrderDetailSheet({
  orderId,
  open,
  onOpenChange,
  glsManagerEnabled,
  foxpostManagerEnabled,
  onOrderUpdated,
}: AdminOrderDetailSheetProps) {
  const router = useRouter()
  const [order, setOrder] = useState<AdminOrderDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const parcelManagerEnabled = glsManagerEnabled || foxpostManagerEnabled

  const reloadOrder = useCallback(async () => {
    if (!orderId) return
    setLoading(true)
    setError(null)
    try {
      const data = await getOrderById(orderId)
      if (!data) {
        setError("A rendelés nem található.")
        setOrder(null)
      } else {
        setOrder(data)
      }
    } catch {
      setError("Nem sikerült betölteni a rendelést.")
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  const handleUpdated = useCallback(() => {
    startTransition(async () => {
      await reloadOrder()
      router.refresh()
      onOrderUpdated?.()
    })
  }, [reloadOrder, router, onOrderUpdated])

  useEffect(() => {
    if (open && orderId) {
      void reloadOrder()
    }
    if (!open) {
      setOrder(null)
      setError(null)
    }
  }, [open, orderId, reloadOrder])

  const orderIdStr = order?._id?.toString?.() ?? orderId ?? ""
  const isDeletedOrder = order ? isAdminDeletedOrder(order.status) : false
  const parcelProvider = order ? getOrderParcelProvider(order) : null
  const parcelDelivery = order ? getOrderParcelDeliveryDisplay(order) : null
  const totalBreakdown = order ? totalsBreakdownForOrderSnapshot(order) : null
  const itemsEditable = order ? canEditOrderItems(order) : false
  const invoiceIssued = order
    ? Boolean(order.invoiceId?.trim()) && order.invoiceStatus !== "reversed"
    : false

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col gap-0 overflow-hidden border-l border-white/10 p-0 sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl"
      >
        <SheetHeader className="shrink-0 border-b border-white/10 bg-black/60 px-6 py-5 pr-16">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <SheetTitle className="text-2xl uppercase italic">
                {order ? formatOrderNumberLabel(order._id) : "Rendelés betöltése"}
              </SheetTitle>
              <SheetDescription className="mt-1 flex flex-wrap items-center gap-2 text-neutral-400">
                {order ? (
                  <>
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(order.createdAt), "yyyy. MMMM dd. HH:mm", { locale: hu })}
                  </>
                ) : (
                  "Részletek és műveletek"
                )}
              </SheetDescription>
            </div>
            {order ? (
              <span
                className={cn(
                  "shrink-0 border px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em]",
                  getStatusStyle(order.status)
                )}
              >
                {order.status}
              </span>
            ) : null}
          </div>
          {orderIdStr ? (
            <Link
              href={`/admin/orders/${orderIdStr}`}
              className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white"
            >
              <ExternalLink className="h-3 w-3" />
              Teljes oldal megnyitása
            </Link>
          ) : null}
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {loading && !order ? (
            <div className="flex h-40 items-center justify-center">
              <LoadingSpinner size="md" />
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <p className="text-sm font-bold italic text-rose-400">{error}</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => void reloadOrder()}
                className="mt-4 h-10 rounded-none border-white/10 text-[10px] font-black uppercase tracking-widest"
              >
                Újrapróbálás
              </Button>
            </div>
          ) : order ? (
            <div className={cn("space-y-6 pb-8", (loading || isPending) && "opacity-70")}>
              <section className="border border-white/10 bg-white/5 p-5">
                <SectionTitle>Állapot frissítése</SectionTitle>
                <OrderStatusButtons
                  orderId={orderIdStr}
                  currentStatus={order.status}
                  onUpdated={handleUpdated}
                />
                {!isDeletedOrder ? (
                  <div className="mt-4 border-t border-white/5 pt-4">
                    <OrderCancelButton orderId={orderIdStr} onCancelled={handleUpdated} />
                  </div>
                ) : order.cancellationReason ? (
                  <div className="mt-4 border-t border-white/5 pt-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                      Törlés indoka
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-300">
                      {order.cancellationReason}
                    </p>
                  </div>
                ) : null}
              </section>

              {(orderHasParcelShipping(order) ||
                order.glsLabel?.parcelNumber ||
                order.glsLabel?.lastError ||
                order.foxpostShipment?.clFoxId ||
                order.foxpostShipment?.lastError) && (
                <section className="border border-white/10 bg-white/5 p-5">
                  <SectionTitle>Csomagpont szállítás</SectionTitle>
                  {isDeletedOrder ? (
                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">
                      Törölt rendelés — címke generálás nem elérhető.
                    </p>
                  ) : !parcelManagerEnabled ? (
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                      A csomag/címke kezelő ki van kapcsolva.
                    </p>
                  ) : null}
                  {!isDeletedOrder && parcelProvider === "gls" ? (
                    <OrderParcelPanel
                      parcelManagerEnabled={glsManagerEnabled}
                      provider="gls"
                      orderId={orderIdStr}
                      glsParcelPoint={order.glsParcelPoint}
                      glsLabel={order.glsLabel}
                      generateGlsAction={() => generateOrderGlsLabel(orderIdStr)}
                      generateFoxpostAction={async () => ({ success: true })}
                      onUpdated={handleUpdated}
                    />
                  ) : null}
                  {!isDeletedOrder && parcelProvider === "foxpost" ? (
                    <FoxpostShipmentPanel
                      source="live"
                      orderId={orderIdStr}
                      parcelManagerEnabled={foxpostManagerEnabled}
                      foxpostParcelPoint={order.foxpostParcelPoint}
                      foxpostShipment={order.foxpostShipment}
                      onUpdated={handleUpdated}
                    />
                  ) : null}
                </section>
              )}

              {!isDeletedOrder && !orderHasParcelShipping(order) ? (
                <section className="border border-white/10 bg-white/5 p-5">
                  <SectionTitle>Webshop szállítási címke</SectionTitle>
                  <StandardShippingLabelPanel
                    orderId={orderIdStr}
                    standardShippingLabel={order.standardShippingLabel}
                    onUpdated={handleUpdated}
                  />
                </section>
              ) : null}

              <section className="border border-white/10 bg-white/5 p-5">
                <SectionTitle>Rendelt tételek</SectionTitle>
                <OrderItemsEditor
                  orderId={orderIdStr}
                  items={order.items}
                  subtotal={order.subtotal}
                  shippingFee={order.shippingFee}
                  discount={order.discount}
                  total={order.total}
                  editable={itemsEditable}
                  invoiceIssued={invoiceIssued}
                  onSaved={handleUpdated}
                />
                {totalBreakdown ? (
                  <div className="mt-4 space-y-2 border-t border-white/5 pt-4 text-sm text-neutral-500">
                    <div className="flex justify-between">
                      <span>Nettó</span>
                      <span>{formatHuf(totalBreakdown.net)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ÁFA</span>
                      <span>{formatHuf(totalBreakdown.vat)}</span>
                    </div>
                  </div>
                ) : null}
              </section>

              <section className="border border-white/10 bg-white/5 p-5">
                <SectionTitle>Vásárló adatai</SectionTitle>
                {isDeletedOrder ? (
                  <div className="space-y-5">
                    <div className="flex gap-3">
                      <User className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600">
                          Számlázási név
                        </p>
                        <p className="font-bold uppercase italic text-white">{order.billingInfo.name}</p>
                        <p className="mt-1 text-xs text-neutral-500">{order.billingInfo.email}</p>
                        <p className="text-xs text-neutral-500">{order.billingInfo.phone}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600">
                          Kapcsolattartó
                        </p>
                        <p className="font-bold text-white">{order.shippingAddress.name}</p>
                        <p className="text-xs text-neutral-500">{order.shippingAddress.email}</p>
                        <p className="text-xs text-neutral-500">{order.shippingAddress.phone}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <OrderContactEditor
                      key={orderIdStr}
                      orderId={orderIdStr}
                      billingInfo={{
                        name: order.billingInfo.name,
                        email: order.billingInfo.email,
                        phone: order.billingInfo.phone,
                      }}
                      shippingAddress={{
                        name: order.shippingAddress.name,
                        email: order.shippingAddress.email,
                        phone: order.shippingAddress.phone,
                      }}
                      onSaved={handleUpdated}
                    />
                    {order.billingInfo.type === "company" && order.billingInfo.taxNumber ? (
                      <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                        Adószám: {order.billingInfo.taxNumber}
                      </p>
                    ) : null}
                  </>
                )}

                <div className="mt-6 space-y-5 border-t border-white/5 pt-6">
                  <div className="flex gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
                    <div>
                      {parcelDelivery ? (
                        <>
                          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600">
                            {parcelDelivery.title}
                          </p>
                          {parcelDelivery.lines.map((line) => (
                            <p key={line} className="text-sm text-neutral-400">
                              {line}
                            </p>
                          ))}
                          {parcelDelivery.idLine ? (
                            <p className="mt-1 text-[10px] text-neutral-600">{parcelDelivery.idLine}</p>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600">
                            Szállítási cím
                          </p>
                          <p className="text-sm text-neutral-400">
                            {order.shippingAddress.zip} {order.shippingAddress.city}
                          </p>
                          <p className="text-sm text-neutral-400">{order.shippingAddress.street}</p>
                        </>
                      )}
                      {order.shippingAddress.comment ? (
                        <p className="mt-2 border-l-2 border-white/20 pl-2 text-xs italic text-neutral-500">
                          &quot;{order.shippingAddress.comment}&quot;
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Truck className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
                    <div className="space-y-1 text-xs font-black uppercase tracking-tight text-white/80">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-3.5 w-3.5" />
                        Fizetés: Online
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck className="h-3.5 w-3.5" />
                        Szállítás:{" "}
                        {parcelDelivery?.providerLabel ?? getOrderShippingTypeLabel(order)}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="border border-white/10 bg-white/5 p-5">
                <SectionTitle>Számla kezelés</SectionTitle>
                <div className="mb-4 space-y-1 text-[11px] font-black uppercase tracking-widest text-neutral-400">
                  <p>
                    Invoice ID: <span className="text-white">{order.invoiceId || "-"}</span>
                  </p>
                  <p>
                    Státusz: <span className="text-white">{order.invoiceStatus || "pending"}</span>
                  </p>
                  {order.invoiceLastError ? (
                    <p className="text-rose-400">Hiba: {order.invoiceLastError}</p>
                  ) : null}
                </div>

                <form
                  action={async (formData) => {
                    try {
                      await updateOrderInvoiceData(orderIdStr, formData)
                      toast.success("Számla adatok mentve.")
                      handleUpdated()
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Mentés sikertelen.")
                    }
                  }}
                  className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                >
                  <input
                    name="invoiceId"
                    defaultValue={order.invoiceId || ""}
                    placeholder="Számlaszám"
                    className="h-10 border border-white/10 bg-black px-3 text-xs uppercase tracking-widest text-white"
                  />
                  <input
                    name="invoiceExternalId"
                    defaultValue={order.invoiceExternalId || ""}
                    placeholder="Külső azonosító"
                    className="h-10 border border-white/10 bg-black px-3 text-xs text-white"
                  />
                  <input
                    name="invoiceIssuedAt"
                    defaultValue={
                      order.invoiceIssuedAt
                        ? new Date(order.invoiceIssuedAt).toISOString().slice(0, 10)
                        : ""
                    }
                    type="date"
                    className="h-10 border border-white/10 bg-black px-3 text-xs text-white"
                  />
                  <select
                    name="invoiceStatus"
                    defaultValue={order.invoiceStatus || "manual"}
                    className="h-10 border border-white/10 bg-black px-3 text-xs uppercase tracking-widest text-white"
                  >
                    <option value="pending">pending</option>
                    <option value="issued">issued</option>
                    <option value="failed">failed</option>
                    <option value="manual">manual</option>
                    <option value="reversed">reversed</option>
                  </select>
                  <Button
                    type="submit"
                    className="h-10 rounded-none bg-primary text-[10px] font-black uppercase tracking-widest sm:col-span-2"
                  >
                    Számla adatok mentése
                  </Button>
                </form>

                <form
                  action={async (formData) => {
                    try {
                      await uploadManualInvoicePdf(orderIdStr, formData)
                      toast.success("Számla PDF feltöltve.")
                      handleUpdated()
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Feltöltés sikertelen.")
                    }
                  }}
                  className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center"
                >
                  <input
                    type="file"
                    name="file"
                    accept=".pdf,application/pdf"
                    required
                    className="text-xs text-neutral-400"
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    className="h-10 shrink-0 rounded-none border-white/10 text-[10px] font-black uppercase tracking-widest"
                  >
                    PDF feltöltése
                  </Button>
                </form>

                <div className="mt-3 flex flex-wrap gap-2">
                  <form
                    action={async () => {
                      try {
                        await resendOrderInvoiceEmail(orderIdStr)
                        toast.success("Számla email elküldve.")
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Küldés sikertelen.")
                      }
                    }}
                  >
                    <Button
                      type="submit"
                      variant="outline"
                      className="h-10 rounded-none border-white/10 text-[10px] font-black uppercase tracking-widest"
                    >
                      Email újraküldése
                    </Button>
                  </form>
                  <a href={`/api/admin/orders/${orderIdStr}/invoice`} target="_blank" rel="noreferrer">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 rounded-none border-white/10 text-[10px] font-black uppercase tracking-widest"
                    >
                      PDF letöltése
                    </Button>
                  </a>
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
