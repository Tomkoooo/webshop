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
import { User, MapPin, CreditCard, Truck, Calendar } from "lucide-react"
import { FoxpostShipmentPanel } from "@wse/core/components/admin/foxpost/FoxpostShipmentPanel"
import { OrderContactEditor } from "@wse/core/components/admin/OrderContactEditor"
import { OrderItemsEditor } from "@wse/core/components/admin/OrderItemsEditor"
import { StandardShippingLabelPanel } from "@wse/core/components/admin/StandardShippingLabelPanel"
import { AdminPageScaffold, AdminSection } from "@wse/core/components/admin/AdminPageScaffold"
import { AdminStatusBadge } from "@wse/core/components/admin/AdminStatusBadge"
import { getOrderParcelProvider, getOrderShippingTypeLabel, orderHasParcelShipping } from "@wse/core/lib/parcel-locker"
import { getOrderParcelDeliveryDisplay } from "@wse/core/lib/parcel-locker-checkout-display"
import {
  isFoxpostParcelManagerEnabled,
  isGlsParcelManagerEnabled,
} from "@wse/core/lib/parcel-feature-flags"
import Link from "next/link"
import { Button } from "@wse/core/components/ui/button"
import { Card, CardContent } from "@wse/core/components/ui/card"
import { format } from "date-fns"
import { hu } from "date-fns/locale"
import { formatOrderNumberLabel } from "@wse/core/lib/order-number"
import { formatHuf, totalsBreakdownForOrderSnapshot } from "@wse/core/lib/pricing"
import { canEditOrderItems } from "@wse/core/lib/order-items-edit"
import { isAdminDeletedOrder } from "@wse/core/lib/admin-orders-filters"
import { adminFieldLabel, adminIconWell, adminInputClass } from "@wse/core/lib/admin-ui"
import { cn } from "@wse/core/lib/utils"

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
      <AdminPageScaffold
        backHref="/admin/orders"
        backLabel="Vissza a rendelésekhez"
        title="Rendelés nem található"
      >
        <Button asChild>
          <Link href="/admin/orders">Vissza a listához</Link>
        </Button>
      </AdminPageScaffold>
    )
  }

  const orderStatusLabels: Record<string, string> = {
    pending: "Függőben",
    processing: "Feldolgozás alatt",
    shipped: "Feladva",
    delivered: "Kézbesítve",
    cancelled: "Törölve",
  }

  return (
    <AdminPageScaffold
      backHref="/admin/orders"
      backLabel="Vissza a rendelésekhez"
      title="Rendelés részletei"
      description={
        <span className="flex flex-wrap items-center gap-4">
          <span className="font-medium">{formatOrderNumberLabel(order._id)}</span>
          <span className="hidden h-4 w-px bg-border sm:block" />
          <span className="inline-flex items-center gap-2">
            <Calendar className="size-4" />
            {format(new Date(order.createdAt), "yyyy. MMMM dd. HH:mm", { locale: hu })}
          </span>
        </span>
      }
      actions={
        <AdminStatusBadge
          status={order.status}
          label={orderStatusLabels[order.status] ?? order.status}
        />
      }
      className="pb-20"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <AdminSection title="Állapot frissítése">
            <Card className="shadow-sm">
              <CardContent className="space-y-6 pt-6">
                <OrderStatusButtons
                  orderId={order._id.toString()}
                  currentStatus={order.status}
                />
                {!isDeletedOrder ? (
                  <div className="border-t border-border pt-6">
                    <OrderCancelButton orderId={order._id.toString()} />
                  </div>
                ) : order.cancellationReason ? (
                  <div className="border-t border-border pt-6">
                    <p className={adminFieldLabel}>Törlés indoka</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                      {order.cancellationReason}
                    </p>
                  </div>
                ) : null}
                {orderHasParcelShipping(order) ||
                order.glsLabel?.parcelNumber ||
                order.glsLabel?.lastError ||
                order.foxpostShipment?.clFoxId ||
                order.foxpostShipment?.lastError ? (
                  <div className="space-y-4 border-t border-border pt-6">
                    <h3 className="text-sm font-medium text-foreground">Csomagpont szállítás</h3>
                    {!parcelManagerEnabled ? (
                      <p className="text-sm text-muted-foreground">
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
                  <div className="space-y-4 border-t border-border pt-6">
                    <h3 className="text-sm font-medium text-foreground">Webshop szállítási címke</h3>
                    <StandardShippingLabelPanel
                      orderId={order._id.toString()}
                      standardShippingLabel={order.standardShippingLabel}
                      onUpdated={() => undefined}
                    />
                  </div>
                ) : null}

                <div className="space-y-4 border-t border-border pt-6">
                  <h3 className="text-sm font-medium text-foreground">Számla kezelés</h3>
                  <dl className="space-y-1 text-sm text-muted-foreground">
                    <div>
                      <dt className="inline">Számlaszám: </dt>
                      <dd className="inline text-foreground">{order.invoiceId || "—"}</dd>
                    </div>
                    <div>
                      <dt className="inline">Számla mód: </dt>
                      <dd className="inline text-foreground">{order.invoiceMode || "none"}</dd>
                    </div>
                    <div>
                      <dt className="inline">Számla státusz: </dt>
                      <dd className="inline text-foreground">{order.invoiceStatus || "pending"}</dd>
                    </div>
                    {order.invoiceLastError ? (
                      <p className="text-sm text-rose-600">Hiba: {order.invoiceLastError}</p>
                    ) : null}
                  </dl>

                  <form
                    action={updateOrderInvoiceData.bind(null, order._id.toString())}
                    className="grid grid-cols-1 gap-3 md:grid-cols-2"
                  >
                    <div className="space-y-1.5">
                      <label className={adminFieldLabel} htmlFor="invoiceId">
                        Számlaszám
                      </label>
                      <input
                        id="invoiceId"
                        name="invoiceId"
                        defaultValue={order.invoiceId || ""}
                        placeholder="Számlaszám"
                        className={adminInputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={adminFieldLabel} htmlFor="invoiceExternalId">
                        Külső azonosító
                      </label>
                      <input
                        id="invoiceExternalId"
                        name="invoiceExternalId"
                        defaultValue={order.invoiceExternalId || ""}
                        placeholder="Opcionális"
                        className={adminInputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={adminFieldLabel} htmlFor="invoiceIssuedAt">
                        Kiállítás dátuma
                      </label>
                      <input
                        id="invoiceIssuedAt"
                        name="invoiceIssuedAt"
                        defaultValue={
                          order.invoiceIssuedAt
                            ? new Date(order.invoiceIssuedAt).toISOString().slice(0, 10)
                            : ""
                        }
                        type="date"
                        className={adminInputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={adminFieldLabel} htmlFor="invoiceStatus">
                        Számla státusz
                      </label>
                      <select
                        id="invoiceStatus"
                        name="invoiceStatus"
                        defaultValue={order.invoiceStatus || "manual"}
                        className={adminInputClass}
                      >
                        <option value="pending">pending</option>
                        <option value="issued">issued</option>
                        <option value="failed">failed</option>
                        <option value="manual">manual</option>
                        <option value="reversed">reversed</option>
                      </select>
                    </div>
                    <Button type="submit" className="md:col-span-2">
                      Számla adatok mentése
                    </Button>
                  </form>

                  <form
                    action={uploadManualInvoicePdf.bind(null, order._id.toString())}
                    className="flex flex-col gap-3 md:flex-row md:items-center"
                  >
                    <input type="file" name="file" accept=".pdf,application/pdf" required className="text-sm" />
                    <Button type="submit" variant="outline">
                      Manuális számla PDF feltöltése
                    </Button>
                  </form>

                  <div className="flex flex-wrap gap-3">
                    <form action={resendOrderInvoiceEmail.bind(null, order._id.toString())}>
                      <Button type="submit" variant="outline">
                        Számla email újraküldése
                      </Button>
                    </form>
                    <a href={`/api/admin/orders/${order._id.toString()}/invoice`} target="_blank" rel="noreferrer">
                      <Button type="button" variant="outline">
                        Számla PDF letöltése
                      </Button>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AdminSection>

          <AdminSection title="Rendelt tételek">
            <Card className="shadow-sm">
              <CardContent className="pt-6">
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
                  <div className="mt-6 space-y-2 border-t border-border pt-6 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Nettó összesen</span>
                      <span className="tabular-nums text-foreground">{formatHuf(totalBreakdown.net)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>ÁFA összesen</span>
                      <span className="tabular-nums text-foreground">{formatHuf(totalBreakdown.vat)}</span>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </AdminSection>
        </div>

        <div className="space-y-6">
          <AdminSection title="Vásárló adatai">
            <Card className="shadow-sm">
              <CardContent className="space-y-6 pt-6">
                {isDeletedOrder ? (
                  <div className="flex gap-4">
                    <div className={cn(adminIconWell, "h-fit shrink-0")}>
                      <User className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className={adminFieldLabel}>Számlázási név</p>
                      <p className="text-lg font-semibold text-foreground">{order.billingInfo.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{order.billingInfo.email}</p>
                      <p className="text-sm text-muted-foreground">{order.billingInfo.phone}</p>
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
                  <p className="text-sm text-muted-foreground">Adószám: {order.billingInfo.taxNumber}</p>
                ) : null}

                <div className="flex gap-4">
                  <div className={cn(adminIconWell, "h-fit shrink-0")}>
                    <MapPin className="size-5 text-primary" />
                  </div>
                  <div>
                    {parcelDelivery ? (
                      <>
                        <p className={adminFieldLabel}>{parcelDelivery.title}</p>
                        {parcelDelivery.lines.map((line) => (
                          <p key={line} className="mt-1 text-sm text-muted-foreground first:mt-0">
                            {line}
                          </p>
                        ))}
                        {parcelDelivery.idLine ? (
                          <p className="mt-2 text-xs text-muted-foreground">{parcelDelivery.idLine}</p>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <p className={adminFieldLabel}>Szállítási cím</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {order.shippingAddress.zip} {order.shippingAddress.city}
                        </p>
                        <p className="text-sm text-muted-foreground">{order.shippingAddress.street}</p>
                        {order.shippingAddress.comment ? (
                          <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground italic">
                            &quot;{order.shippingAddress.comment}&quot;
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className={cn(adminIconWell, "h-fit shrink-0")}>
                    <Truck className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className={adminFieldLabel}>Módszerek</p>
                    <div className="mt-2 flex flex-col gap-2 text-sm text-foreground">
                      <div className="flex items-center gap-2">
                        <CreditCard className="size-3.5 text-muted-foreground" />
                        <span>Fizetés: Online</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck className="size-3.5 text-muted-foreground" />
                        <span>
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
              </CardContent>
            </Card>
          </AdminSection>
        </div>
      </div>
    </AdminPageScaffold>
  )
}
