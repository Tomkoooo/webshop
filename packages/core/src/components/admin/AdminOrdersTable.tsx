"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Calendar, Download, Eye, Package, Printer, Tag, User } from "lucide-react"
import { format } from "date-fns"
import { hu } from "date-fns/locale"
import { bulkGenerateParcelLabels, bulkUpdateOrderStatuses } from "@wse/core/actions/admin-orders"
import { AdminDataTable, type AdminDataTableColumn } from "@wse/core/components/admin/AdminDataTable"
import { AdminOrderStatusBadge } from "@wse/core/components/admin/AdminOrderStatusBadge"
import { AdminPanel } from "@wse/core/components/admin/AdminPanel"
import { Button } from "@wse/core/components/ui/button"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import { adminFilterInput } from "@wse/core/lib/admin-ui"
import { cn } from "@wse/core/lib/utils"
import { formatOrderNumberLabel } from "@wse/core/lib/order-number"
import { formatHuf, totalsBreakdownForOrderSnapshot } from "@wse/core/lib/pricing"
import { getOrderShippingTypeLabel, orderNeedsParcelLabel } from "@wse/core/lib/parcel-locker"
import { getOrderDeliveryLocationHint } from "@wse/core/lib/parcel-locker-checkout-display"
import type { FoxpostParcelPoint } from "@wse/core/lib/foxpost"
import type { GlsParcelPoint } from "@wse/core/lib/gls"

const STATUSES = [
  { value: "pending", label: "Függőben" },
  { value: "processing", label: "Feldolgozás alatt" },
  { value: "shipped", label: "Szállítva" },
  { value: "delivered", label: "Kézbesítve" },
  { value: "cancelled", label: "Törölve" },
] as const

type OrderStatusValue = (typeof STATUSES)[number]["value"]

type AdminOrder = {
  _id: string
  createdAt: string | Date
  status: string
  billingInfo: {
    name?: string
  }
  shippingAddress?: {
    city?: string
  }
  items: Array<{
    name?: string
    price: number
    quantity: number
    vatPercent?: number
  }>
  subtotal: number
  shippingFee: number
  paymentFee: number
  total: number
  discount?: number
  invoiceId?: string
  invoiceStatus?: string
  glsParcelPoint?: GlsParcelPoint | null
  foxpostParcelPoint?: FoxpostParcelPoint | null
  glsLabel?: {
    parcelNumber?: string
    labelDataBase64?: string
  } | null
  foxpostShipment?: {
    clFoxId?: string
    labelDataBase64?: string
  } | null
}

type AdminOrdersTableProps = {
  orders: AdminOrder[]
  glsManagerEnabled?: boolean
  foxpostManagerEnabled?: boolean
  exportQuery?: string
}

function parseFilename(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null
  const match = contentDisposition.match(/filename="([^"]+)"/i)
  return match?.[1] ?? null
}

async function readZipExportError(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    try {
      const body = (await response.json()) as { error?: string }
      if (body.error) return body.error
    } catch {
      // fall through
    }
  }
  return `A címke export sikertelen (HTTP ${response.status}).`
}

export function AdminOrdersTable({
  orders,
  glsManagerEnabled = false,
  foxpostManagerEnabled = false,
  exportQuery = "",
}: AdminOrdersTableProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState<OrderStatusValue>("processing")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isGeneratingLabels, setIsGeneratingLabels] = useState(false)
  const [isDownloadingLabelsZip, setIsDownloadingLabelsZip] = useState(false)

  const parcelManagerEnabled = glsManagerEnabled || foxpostManagerEnabled

  const visibleOrderIds = useMemo(() => orders.map((order) => String(order._id)), [orders])
  const selectedVisibleIds = useMemo(
    () => visibleOrderIds.filter((orderId) => selectedIds.has(orderId)),
    [selectedIds, visibleOrderIds]
  )
  const selectedCount = selectedVisibleIds.length
  const allVisibleSelected = visibleOrderIds.length > 0 && selectedCount === visibleOrderIds.length
  const partiallySelected = selectedCount > 0 && !allVisibleSelected
  const busy = isUpdating || isGeneratingLabels

  const toggleOrder = (orderId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(orderId)) {
        next.delete(orderId)
      } else {
        next.add(orderId)
      }
      return next
    })
  }

  const toggleAllVisible = () => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (allVisibleSelected) {
        visibleOrderIds.forEach((orderId) => next.delete(orderId))
      } else {
        visibleOrderIds.forEach((orderId) => next.add(orderId))
      }
      return next
    })
  }

  const handleBulkGenerateLabels = async () => {
    if (selectedVisibleIds.length === 0 || isGeneratingLabels || !parcelManagerEnabled) return

    setIsGeneratingLabels(true)
    try {
      const result = await bulkGenerateParcelLabels(selectedVisibleIds, { skipExisting: true })
      setSelectedIds((current) => {
        const next = new Set(current)
        selectedVisibleIds.forEach((orderId) => next.delete(orderId))
        return next
      })
      router.refresh()

      const parts = [`${result.successCount} címke elkészült`]
      if (result.skippedCount > 0) parts.push(`${result.skippedCount} kihagyva`)
      if (result.failedCount > 0) parts.push(`${result.failedCount} sikertelen`)
      if (result.failedCount > 0) {
        toast.error(parts.join(", ") + ".")
      } else {
        toast.success(parts.join(", ") + ".")
      }
    } catch (error) {
      console.error("Bulk parcel label generation failed:", error)
      toast.error("A címkék tömeges generálása sikertelen. Próbálja újra.")
    } finally {
      setIsGeneratingLabels(false)
    }
  }

  const handleDownloadSelectedLabelsZip = async () => {
    if (selectedVisibleIds.length === 0 || isDownloadingLabelsZip) return

    setIsDownloadingLabelsZip(true)
    try {
      const params = new URLSearchParams(exportQuery)
      params.set("ids", selectedVisibleIds.join(","))
      const response = await fetch(`/api/admin/orders/export-labels?${params.toString()}`, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(await readZipExportError(response))
      }

      const blob = await response.blob()
      if (blob.size < 4) {
        throw new Error("A címke ZIP üres.")
      }

      const filename =
        parseFilename(response.headers.get("content-disposition")) || "cimkek.zip"
      const objectUrl = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = objectUrl
      anchor.download = filename
      anchor.rel = "noopener"
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(objectUrl)

      toast.success("Címke ZIP letöltve.")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "A címke ZIP letöltése nem sikerült."
      toast.error(message)
    } finally {
      setIsDownloadingLabelsZip(false)
    }
  }

  const handleBulkUpdate = async () => {
    if (selectedVisibleIds.length === 0 || isUpdating) return

    setIsUpdating(true)
    try {
      const result = await bulkUpdateOrderStatuses(selectedVisibleIds, bulkStatus)
      setSelectedIds((current) => {
        const next = new Set(current)
        selectedVisibleIds.forEach((orderId) => next.delete(orderId))
        return next
      })
      router.refresh()

      const label = STATUSES.find((status) => status.value === bulkStatus)?.label ?? bulkStatus
      const skippedText = result.skippedCount > 0 ? ` ${result.skippedCount} már ezen a státuszon volt.` : ""
      const missingText = result.missingCount > 0 ? ` ${result.missingCount} rendelés nem található.` : ""
      toast.success(`${result.updatedCount} rendelés státusza frissítve: ${label}.${skippedText}${missingText}`)
    } catch (error) {
      console.error("Bulk order status update failed:", error)
      toast.error("A kijelölt rendelések frissítése sikertelen. Próbálja újra.")
    } finally {
      setIsUpdating(false)
    }
  }

  const columns = useMemo((): AdminDataTableColumn<AdminOrder>[] => {
    return [
      {
        id: "select",
        header: (
          <input
            type="checkbox"
            checked={allVisibleSelected}
            aria-checked={partiallySelected ? "mixed" : allVisibleSelected}
            disabled={orders.length === 0 || busy}
            onChange={toggleAllVisible}
            className="h-4 w-4 rounded-md accent-primary disabled:opacity-40"
            aria-label="Összes látható rendelés kijelölése"
            title="Összes látható rendelés kijelölése"
          />
        ),
        headerClassName: "w-12",
        className: "w-12",
        cell: (order) => {
          const orderId = String(order._id)
          return (
            <input
              type="checkbox"
              checked={selectedIds.has(orderId)}
              disabled={busy}
              onChange={() => toggleOrder(orderId)}
              onClick={(event) => event.stopPropagation()}
              className="h-4 w-4 rounded-md accent-primary disabled:opacity-40"
              aria-label={`${formatOrderNumberLabel(order._id)} rendelés kijelölése`}
            />
          )
        },
      },
      {
        id: "id",
        header: "Azonosító / Dátum",
        cell: (order) => (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">{formatOrderNumberLabel(order._id)}</span>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="size-3" />
              <span className="text-xs">
                {format(new Date(order.createdAt), "yyyy. LLLL dd. HH:mm", { locale: hu })}
              </span>
            </div>
          </div>
        ),
      },
      {
        id: "customer",
        header: "Vásárló",
        cell: (order) => (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <User className="size-3 text-muted-foreground" />
              <span className="text-sm font-medium">{order.billingInfo.name}</span>
            </div>
            {getOrderDeliveryLocationHint(order) ? (
              <span className="text-xs text-muted-foreground">{getOrderDeliveryLocationHint(order)}</span>
            ) : null}
          </div>
        ),
      },
      {
        id: "items",
        header: "Termékek",
        cell: (order) => {
          const totalUnits = order.items.reduce((sum, item) => sum + item.quantity, 0)
          return (
            <div className="flex items-center gap-2 text-sm tabular-nums">
              <Package className="size-4 text-muted-foreground" />
              <span>
                {totalUnits} db
                <span className="text-muted-foreground"> · {order.items.length} tétel</span>
              </span>
            </div>
          )
        },
      },
      {
        id: "shipping",
        header: "Szállítás",
        cell: (order) => (
          <div className="flex flex-col gap-1">
            <span className="text-sm">{getOrderShippingTypeLabel(order)}</span>
            {orderNeedsParcelLabel(order) ? (
              <span className="text-xs text-amber-700">Címke hiányzik</span>
            ) : null}
          </div>
        ),
      },
      {
        id: "status",
        header: "Állapot",
        cell: (order) => <AdminOrderStatusBadge status={order.status} />,
      },
      {
        id: "invoice",
        header: "Számla",
        cell: (order) => (
          <div className="space-y-0.5 text-xs">
            <p className={order.invoiceId ? "font-medium text-emerald-800" : "text-muted-foreground"}>
              {order.invoiceId ? "Van számla" : "Nincs számla"}
            </p>
            {order.invoiceId ? <p className="text-muted-foreground">{order.invoiceId}</p> : null}
            {order.invoiceStatus ? (
              <p className="text-muted-foreground">{order.invoiceStatus}</p>
            ) : null}
          </div>
        ),
      },
      {
        id: "total",
        header: "Összeg",
        cell: (order) => {
          const breakdown = totalsBreakdownForOrderSnapshot(order)
          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-base font-semibold tabular-nums">{formatHuf(breakdown.gross)}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                Nettó {formatHuf(breakdown.net)} · ÁFA {formatHuf(breakdown.vat)}
              </span>
              {Number(order.discount || 0) > 0 ? (
                <div className="mt-0.5 flex items-center gap-1 text-xs text-primary">
                  <Tag className="size-3" />
                  <span>Kedvezményes</span>
                </div>
              ) : null}
            </div>
          )
        },
      },
      {
        id: "actions",
        header: <span className="sr-only">Műveletek</span>,
        headerClassName: "text-right",
        className: "text-right",
        cell: (order) => (
          <Link href={`/admin/orders/${order._id}`} onClick={(event) => event.stopPropagation()}>
            <Button variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-foreground" title="Megtekintés">
              <Eye className="size-4" />
            </Button>
          </Link>
        ),
      },
    ]
  }, [
    allVisibleSelected,
    busy,
    orders.length,
    partiallySelected,
    selectedIds,
    toggleAllVisible,
    toggleOrder,
  ])

  return (
    <div className="space-y-4">
      <AdminPanel
        title="Tömeges státusz módosítás"
        description={
          selectedCount > 0
            ? `${selectedCount} rendelés kijelölve`
            : "Jelöljön ki rendeléseket a listából."
        }
        actions={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={bulkStatus}
              onChange={(event) => setBulkStatus(event.target.value as OrderStatusValue)}
              disabled={selectedCount === 0 || busy}
              className={cn(adminFilterInput, "min-w-48 disabled:opacity-50")}
            >
              {STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            <Button
              type="button"
              disabled={selectedCount === 0 || busy}
              onClick={() => void handleBulkUpdate()}
            >
              {isUpdating ? <LoadingSpinner size="xs" className="mr-2 shrink-0" /> : null}
              Státusz frissítése
            </Button>
          </div>
        }
      >
        <span className="sr-only">Tömeges státusz módosítás</span>
      </AdminPanel>

      {parcelManagerEnabled ? (
        <AdminPanel
          title="Tömeges címke kezelés"
          description="Csak a hiányzó GLS/Foxpost címkék készülnek. A ZIP a már generált PDF-eket tartalmazza."
          actions={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                disabled={selectedCount === 0 || busy || isDownloadingLabelsZip}
                onClick={() => void handleBulkGenerateLabels()}
              >
                {isGeneratingLabels ? (
                  <LoadingSpinner size="xs" className="mr-2 shrink-0" />
                ) : (
                  <Printer className="mr-2 size-4" />
                )}
                Címkék generálása (kijelöltek)
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={selectedCount === 0 || isDownloadingLabelsZip || busy}
                onClick={() => void handleDownloadSelectedLabelsZip()}
              >
                {isDownloadingLabelsZip ? (
                  <LoadingSpinner size="xs" className="mr-2 shrink-0" />
                ) : (
                  <Download className="mr-2 size-4" />
                )}
                Címkék ZIP (kijelöltek)
              </Button>
            </div>
          }
        >
          <span className="sr-only">Tömeges címke kezelés</span>
        </AdminPanel>
      ) : null}

      <AdminDataTable
        columns={columns}
        rows={orders}
        getRowKey={(order) => String(order._id)}
        emptyMessage="Még nem érkezett rendelés."
        rowClassName={(order) =>
          cn("border-0", selectedIds.has(String(order._id)) && "bg-primary/5")
        }
        className="min-w-[980px]"
      />
    </div>
  )
}
