import {
  generateOrderGlsLabel,
  getOrderById,
  resendOrderInvoiceEmail,
  updateOrderInvoiceData,
  uploadManualInvoicePdf,
} from "@wse/core/actions/admin-orders"
import { OrderStatusButtons } from "@wse/core/components/admin/OrderStatusButtons"
import { OrderCancelButton } from "@wse/core/components/admin/OrderCancelButton"
import { ArrowLeft, User, MapPin, CreditCard, Truck, Calendar } from "lucide-react"
import {
  OrderParcelPanel,
} from "@wse/core/components/admin/OrderParcelPanel"
import { FoxpostShipmentPanel } from "@wse/core/components/admin/foxpost/FoxpostShipmentPanel"
import { OrderContactEditor } from "@wse/core/components/admin/OrderContactEditor"
import { OrderItemsEditor } from "@wse/core/components/admin/OrderItemsEditor"
import { StandardShippingLabelPanel } from "@wse/core/components/admin/StandardShippingLabelPanel"
import { getOrderParcelProvider, getOrderShippingTypeLabel, orderHasParcelShipping } from "@wse/core/lib/parcel-locker"
import { getOrderParcelDeliveryDisplay } from "@wse/core/lib/parcel-locker-checkout-display"
import {
  isFoxpostParcelManagerEnabled,
  isGlsParcelManagerEnabled,
} from "@wse/core/lib/parcel-feature-flags"
import Link from "next/link"
import { Button } from "@wse/core/components/ui/button"
import { cn } from "@wse/core/lib/utils"
import { format } from "date-fns"
import { hu } from "date-fns/locale"
import { formatOrderNumberLabel } from "@wse/core/lib/order-number"
import { formatHuf, totalsBreakdownForOrderSnapshot } from "@wse/core/lib/pricing"
import { canEditOrderItems } from "@wse/core/lib/order-items-edit"
import { isAdminDeletedOrder } from "@wse/core/lib/admin-orders-filters"

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getOrderById(id)
  const [glsManagerEnabled, foxpostManagerEnabled] = await Promise.all([
    isGlsParcelManagerEnabled(),
    isFoxpostParcelManagerEnabled(),
  ])
  const parcelManagerEnabled = glsManagerEnabled || foxpostManagerEnabled
  const parcelProvider = order ? getOrderParcelProvider(order) : null
  const parcelDelivery = order ? getOrderParcelDeliveryDisplay(order) : null
  const totalBreakdown = order ? totalsBreakdownForOrderSnapshot(order) : null
  const isDeletedOrder = order ? isAdminDeletedOrder(order.status) : false
  const itemsEditable = order ? canEditOrderItems(order) : false
  const invoiceIssued = order
    ? Boolean(order.invoiceId?.trim()) && order.invoiceStatus !== "reversed"
    : false

  if (!order) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-white space-y-4">
        <h1 className="text-3xl font-black italic uppercase tracking-tighter">Rendelés nem található</h1>
        <Link href="/admin/orders">
          <Button variant="krausz">VISSZA A LISTÁHOZ</Button>
        </Link>
      </div>
    )
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "pending": return "text-amber-500 border-amber-500/20 bg-amber-500/5"
      case "processing": return "text-blue-500 border-blue-500/20 bg-blue-500/5"
      case "shipped": return "text-purple-500 border-purple-500/20 bg-purple-500/5"
      case "delivered": return "text-emerald-500 border-emerald-500/20 bg-emerald-500/5"
      case "cancelled": return "text-rose-500 border-rose-500/20 bg-rose-500/5"
      default: return "text-neutral-500 border-white/10 bg-white/5"
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <Link href="/admin/orders" className="group flex items-center gap-2 text-neutral-500 hover:text-white transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Vissza a rendelésekhez</span>
          </Link>
          <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight mb-2 uppercase italic text-white leading-[0.9]">
            Rendelés <span className="admin-headline-accent">Részletei</span>
          </h1>
          <div className="flex items-center gap-4 text-white/40 italic">
            <span className="text-lg font-bold uppercase tracking-tight admin-text-accent">{formatOrderNumberLabel(order._id)}</span>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{format(new Date(order.createdAt), "yyyy. MMMM dd. HH:mm", { locale: hu })}</span>
            </div>
          </div>
        </div>

        <div className={cn(
          "px-6 py-3 border font-black uppercase tracking-[0.3em] text-sm shadow-xl",
          getStatusStyle(order.status)
        )}>
          {order.status.toUpperCase()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Form and Items */}
        <div className="lg:col-span-2 space-y-8">
          {/* Status Update Card */}
          <div className="bg-white/5 border border-white/10 p-8 rounded-none relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -rotate-45 translate-x-16 -translate-y-16 pointer-events-none group-hover:bg-white/10 transition-colors" />
            <h2 className="text-xl font-bold mb-6 italic uppercase tracking-wider flex items-center gap-2">
              <div className="w-1.5 h-6 admin-section-marker rounded-full" />
              Állapot Frissítése
            </h2>
            <OrderStatusButtons
              orderId={order._id.toString()}
              currentStatus={order.status}
            />
            {!isDeletedOrder ? (
              <div className="mt-6 border-t border-white/10 pt-6">
                <OrderCancelButton orderId={order._id.toString()} />
              </div>
            ) : order.cancellationReason ? (
              <div className="mt-6 border-t border-white/10 pt-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Törlés indoka
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-300">
                  {order.cancellationReason}
                </p>
              </div>
            ) : null}
            {orderHasParcelShipping(order) ||
            order.glsLabel?.parcelNumber ||
            order.glsLabel?.lastError ||
            order.foxpostShipment?.clFoxId ||
            order.foxpostShipment?.lastError ? (
              <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-neutral-300">
                  Csomagpont szállítás
                </h3>
                {!parcelManagerEnabled ? (
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                    A csomag/címke kezelő ki van kapcsolva (Beállítások → feature flag-ek).
                  </p>
                ) : null}
                {parcelProvider === "gls" ? (
                  <OrderParcelPanel
                    parcelManagerEnabled={glsManagerEnabled}
                    provider="gls"
                    orderId={order._id.toString()}
                    glsParcelPoint={order.glsParcelPoint}
                    glsLabel={order.glsLabel}
                    generateGlsAction={async () => {
                      "use server"
                      return generateOrderGlsLabel(order._id.toString())
                    }}
                    generateFoxpostAction={async () => {
                      "use server"
                      return { success: true }
                    }}
                  />
                ) : null}
                {parcelProvider === "foxpost" ? (
                  <FoxpostShipmentPanel
                    source="live"
                    orderId={order._id.toString()}
                    parcelManagerEnabled={foxpostManagerEnabled}
                    foxpostParcelPoint={order.foxpostParcelPoint}
                    foxpostShipment={order.foxpostShipment}
                  />
                ) : null}
              </div>
            ) : null}

            {!isDeletedOrder && !orderHasParcelShipping(order) ? (
              <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-neutral-300">
                  Webshop szállítási címke
                </h3>
                <StandardShippingLabelPanel
                  orderId={order._id.toString()}
                  standardShippingLabel={order.standardShippingLabel}
                  onUpdated={() => undefined}
                />
              </div>
            ) : null}

            <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-neutral-300">Számla kezelés</h3>
              <div className="text-[11px] font-black uppercase tracking-[0.15em] text-neutral-300 space-y-1">
                <p>Invoice ID: <span className="text-white">{order.invoiceId || "-"}</span></p>
                <p>Invoice mód: <span className="text-white">{order.invoiceMode || "none"}</span></p>
                <p>Invoice státusz: <span className="text-white">{order.invoiceStatus || "pending"}</span></p>
                {order.invoiceLastError ? <p className="text-rose-400">HIBA: {order.invoiceLastError}</p> : null}
              </div>

              <form action={updateOrderInvoiceData.bind(null, order._id.toString())} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input name="invoiceId" defaultValue={order.invoiceId || ""} placeholder="Számlaszám" className="h-11 bg-black border border-white/10 px-3 text-white text-xs uppercase tracking-widest" />
                <input name="invoiceExternalId" defaultValue={order.invoiceExternalId || ""} placeholder="Külső invoice azonosító (opcionális)" className="h-11 bg-black border border-white/10 px-3 text-white text-xs" />
                <input name="invoiceIssuedAt" defaultValue={order.invoiceIssuedAt ? new Date(order.invoiceIssuedAt).toISOString().slice(0, 10) : ""} type="date" className="h-11 bg-black border border-white/10 px-3 text-white text-xs" />
                <select name="invoiceStatus" defaultValue={order.invoiceStatus || "manual"} className="h-11 bg-black border border-white/10 px-3 text-white text-xs uppercase tracking-widest">
                  <option value="pending">pending</option>
                  <option value="issued">issued</option>
                  <option value="failed">failed</option>
                  <option value="manual">manual</option>
                  <option value="reversed">reversed</option>
                </select>
                <Button className="h-11 rounded-none bg-primary hover:bg-primary/80 text-white text-[10px] font-black uppercase tracking-widest md:col-span-2">
                  Számla adatok mentése
                </Button>
              </form>

              <form action={uploadManualInvoicePdf.bind(null, order._id.toString())} className="flex flex-col md:flex-row gap-3 md:items-center">
                <input type="file" name="file" accept=".pdf,application/pdf" required className="text-xs text-neutral-300" />
                <Button className="h-11 rounded-none admin-action-outline text-[10px] font-black uppercase tracking-widest">
                  Manuális számla PDF feltöltése
                </Button>
              </form>

              <div className="flex flex-wrap gap-3">
                <form action={resendOrderInvoiceEmail.bind(null, order._id.toString())}>
                  <Button className="h-11 rounded-none border border-white/15 bg-transparent hover:bg-white/5 text-white text-[10px] font-black uppercase tracking-widest">
                    Számla email újraküldése
                  </Button>
                </form>
                <a href={`/api/admin/orders/${order._id.toString()}/invoice`} target="_blank" rel="noreferrer">
                  <Button className="h-11 rounded-none admin-action-outline text-[10px] font-black uppercase tracking-widest">
                    Számla PDF letöltése
                  </Button>
                </a>
              </div>
            </div>
          </div>

          {/* Items Card */}
          <div className="bg-white/5 border border-white/10 p-8 rounded-none">
            <h2 className="text-xl font-bold mb-6 italic uppercase tracking-wider flex items-center gap-2">
              <div className="w-1.5 h-6 admin-section-marker rounded-full" />
              Rendelt Tételek
            </h2>
            <OrderItemsEditor
              orderId={order._id.toString()}
              items={order.items}
              subtotal={order.subtotal}
              shippingFee={order.shippingFee}
              discount={order.discount}
              total={order.total}
              editable={itemsEditable}
              invoiceIssued={invoiceIssued}
            />
            {totalBreakdown ? (
              <div className="mt-6 space-y-3 border-t border-white/5 pt-6">
                <div className="flex justify-between text-neutral-500 text-sm font-bold uppercase italic">
                  <span>Nettó összesen:</span>
                  <span>{formatHuf(totalBreakdown.net)}</span>
                </div>
                <div className="flex justify-between text-neutral-500 text-sm font-bold uppercase italic">
                  <span>ÁFA összesen:</span>
                  <span>{formatHuf(totalBreakdown.vat)}</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Right Column - Customer Info */}
        <div className="space-y-8">
          {/* Customer Info Card */}
          <div className="bg-white/5 border border-white/10 p-8 rounded-none relative overflow-hidden">
            <div className="absolute top-0 right-0 w-px h-full bg-linear-to-b from-transparent via-accent/20 to-transparent" />
            <h2 className="text-xl font-bold mb-8 italic uppercase tracking-wider flex items-center gap-2">
              <div className="w-1.5 h-6 admin-section-marker rounded-full" />
              Vásárló adatai
            </h2>
            
            <div className="space-y-8">
              {isDeletedOrder ? (
                <div className="flex gap-4">
                  <div className="p-3 admin-icon-well rounded-none grow-0 h-fit">
                    <User className="w-5 h-5 admin-icon-accent" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-1">Számlázási Név</p>
                    <p className="text-lg font-bold text-white uppercase italic leading-none">{order.billingInfo.name}</p>
                    <p className="text-neutral-500 text-xs mt-2">{order.billingInfo.email}</p>
                    <p className="text-neutral-500 text-xs">{order.billingInfo.phone}</p>
                  </div>
                </div>
              ) : (
                <OrderContactEditor
                  orderId={order._id.toString()}
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
                />
              )}

              {order.billingInfo.type === "company" && order.billingInfo.taxNumber ? (
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  Adószám: {order.billingInfo.taxNumber}
                </p>
              ) : null}

              <div className="flex gap-4">
                <div className="p-3 admin-icon-well rounded-none grow-0 h-fit">
                  <MapPin className="w-5 h-5 admin-icon-accent" />
                </div>
                <div>
                  {parcelDelivery ? (
                    <>
                      <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-1">
                        {parcelDelivery.title}
                      </p>
                      {parcelDelivery.lines.map((line) => (
                        <p key={line} className="text-neutral-400 text-sm mt-1 first:mt-0">
                          {line}
                        </p>
                      ))}
                      {parcelDelivery.idLine ? (
                        <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest mt-2">
                          {parcelDelivery.idLine}
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-1">
                        Szállítási Cím
                      </p>
                      <p className="text-neutral-400 text-sm mt-1">
                        {order.shippingAddress.zip} {order.shippingAddress.city}
                      </p>
                      <p className="text-neutral-400 text-sm">{order.shippingAddress.street}</p>
                      {order.shippingAddress.comment ? (
                        <div className="mt-4 p-3 bg-black/40 border-l-2 border-white/30 text-neutral-400 text-xs italic">
                          &quot;{order.shippingAddress.comment}&quot;
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <div className="p-3 admin-icon-well rounded-none grow-0 h-fit">
                  <Truck className="w-5 h-5 admin-icon-accent" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-1">Módszerek</p>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-white/80">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span className="text-xs font-black uppercase tracking-tight">Fizetés: Online</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/80">
                      <Truck className="w-3.5 h-3.5" />
                      <span className="text-xs font-black uppercase tracking-tight">
                        Szállítás:{" "}
                        {parcelDelivery?.providerLabel
                          ? parcelDelivery.lines[0]
                            ? `${parcelDelivery.providerLabel} — ${parcelDelivery.lines[0]}`
                            : parcelDelivery.providerLabel
                          : getOrderShippingTypeLabel(order) === "Standard"
                            ? "Futár"
                            : getOrderShippingTypeLabel(order)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
