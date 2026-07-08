"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { format } from "date-fns"
import { hu } from "date-fns/locale"
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Boxes,
  Calendar,
  Download,
  Eye,
  Filter,
  Layers,
  Package,
  Printer,
  RotateCcw,
  Search,
  Tag,
  Truck,
  Users,
  X,
} from "lucide-react"
import { bulkGenerateParcelLabels, bulkGenerateStandardShippingLabels, bulkUpdateOrderStatuses } from "@wse/core/actions/admin-orders"
import type { AdminOrdersWorkspaceData } from "@wse/core/actions/admin-orders"
import { AdminOrderDetailSheet } from "@wse/core/components/admin/AdminOrderDetailSheet"
import { AdminOrdersExportLink } from "@wse/core/components/admin/AdminOrdersExportLink"
import { Button } from "@wse/core/components/ui/button"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import { cn } from "@wse/core/lib/utils"
import { formatHuf } from "@wse/core/lib/pricing"
import type { AdminOrderFilters } from "@wse/core/lib/admin-orders-filters"
import { isAdminDeletedOrder } from "@wse/core/lib/admin-orders-filters"
import {
  splitShippingSectionsIntoBatches,
  WORKSPACE_SORT_OPTIONS,
  type AdminOrderSummary,
  type OrderShippingMixSection,
  type WorkspaceSortKey,
} from "@wse/core/lib/admin-orders-workspace"
import type { OrderShippingTypeFilter } from "@wse/core/lib/parcel-locker"

type WorkspaceView = "list" | "mix" | "assign"

type AdminOrdersWorkspaceProps = {
  data: AdminOrdersWorkspaceData
  filters: AdminOrderFilters
  products: { id: string; name: string }[]
  glsManagerEnabled: boolean
  foxpostManagerEnabled: boolean
  exportQuery: string
  view: WorkspaceView
  assignStart?: number
  assignEnd?: number
}

const STATUSES = [
  { value: "pending", label: "Függőben" },
  { value: "processing", label: "Feldolgozás alatt" },
  { value: "shipped", label: "Szállítva" },
  { value: "delivered", label: "Kézbesítve" },
  { value: "cancelled", label: "Törölve" },
] as const

type OrderStatusValue = (typeof STATUSES)[number]["value"]

const FILTER_KEYS: (keyof AdminOrderFilters)[] = [
  "q",
  "status",
  "invoiceStatus",
  "shippingType",
  "productId",
  "dateFrom",
  "dateTo",
  "updatedFrom",
  "updatedTo",
  "statusChangedOn",
  "statusChangedFrom",
  "statusChangedTo",
  "foxpostLabelOn",
  "foxpostLabelFrom",
  "foxpostLabelTo",
  "glsLabelOn",
  "glsLabelFrom",
  "glsLabelTo",
  "unitsMin",
  "unitsMax",
  "kindsMin",
  "kindsMax",
  "totalMin",
  "totalMax",
  "labelState",
  "billingType",
  "mix",
  "sort",
  "deletedFilter",
]

function getStatusStyle(status: string) {
  switch (status) {
    case "pending":
      return "bg-amber-500/10 border-amber-500 text-amber-500"
    case "processing":
      return "bg-blue-500/10 border-blue-500 text-blue-500"
    case "shipped":
      return "bg-purple-500/10 border-purple-500 text-purple-500"
    case "delivered":
      return "bg-emerald-500/10 border-emerald-500 text-emerald-500"
    case "cancelled":
      return "bg-rose-500/10 border-rose-500 text-rose-500"
    default:
      return "bg-white/5 border-white/10 text-neutral-500"
  }
}

function getStatusLabel(status: string) {
  return STATUSES.find((s) => s.value === status)?.label ?? status
}

const inputClass =
  "h-10 w-full bg-black border border-white/10 px-3 text-sm text-white placeholder:text-neutral-600 rounded-none focus:border-primary/60 focus:outline-none"
const labelClass = "text-[9px] font-black uppercase tracking-widest text-neutral-500 mb-1 block"

function parseFilename(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null
  const match = contentDisposition.match(/filename="([^"]+)"/i)
  return match?.[1] ?? null
}

export function AdminOrdersWorkspace({
  data,
  filters,
  products,
  glsManagerEnabled,
  foxpostManagerEnabled,
  exportQuery,
  view,
  assignStart,
  assignEnd,
}: AdminOrdersWorkspaceProps) {
  const router = useRouter()
  const [isNavigating, startNavigation] = useTransition()
  const parcelManagerEnabled = glsManagerEnabled || foxpostManagerEnabled

  const { orders, mixGroups, shippingMixSections, stats } = data
  const isDeletedView = data.deletedFilter === "deleted"
  const effectiveView: WorkspaceView = isDeletedView && view !== "list" ? "list" : view

  const [draft, setDraft] = useState<AdminOrderFilters>(filters)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState<OrderStatusValue>("processing")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isGeneratingLabels, setIsGeneratingLabels] = useState(false)
  const [isDownloadingZip, setIsDownloadingZip] = useState(false)
  const [employeeCount, setEmployeeCount] = useState(4)
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => {
    setDraft(filters)
  }, [filters])

  const openOrderDetail = useCallback((orderId: string) => {
    setDetailOrderId(orderId)
    setDetailOpen(true)
  }, [])

  const buildHref = (overrides: Partial<Record<string, string | undefined>>) => {
    const params = new URLSearchParams()
    for (const key of FILTER_KEYS) {
      const value = filters[key]
      if (value && value !== "all") params.set(key, value)
    }
    if (view !== "list") params.set("view", view)
    if (assignStart != null) params.set("assignStart", String(assignStart))
    if (assignEnd != null) params.set("assignEnd", String(assignEnd))
    for (const [key, value] of Object.entries(overrides)) {
      if (value == null || value === "" || value === "all") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    }
    const qs = params.toString()
    return qs ? `/admin/orders?${qs}` : "/admin/orders"
  }

  const navigate = (href: string) => {
    startNavigation(() => router.push(href))
  }

  const applyFilters = () => {
    const overrides: Record<string, string | undefined> = {}
    for (const key of FILTER_KEYS) {
      overrides[key] = (draft[key] as string | undefined) || undefined
    }
    if (!overrides.mix && filters.mix) {
      overrides.mix = filters.mix
    }
    if (!overrides.shippingType && filters.shippingType && filters.shippingType !== "all") {
      overrides.shippingType = filters.shippingType
    }
    if (overrides.deletedFilter === "deleted") {
      overrides.view = undefined
      overrides.mix = undefined
    }
    // a fresh search resets any focused employee batch
    overrides.assignStart = undefined
    overrides.assignEnd = undefined
    navigate(
      buildHref({
        ...overrides,
        view:
          overrides.deletedFilter === "deleted"
            ? undefined
            : effectiveView === "list"
              ? undefined
              : effectiveView,
      })
    )
  }

  const resetFilters = () => {
    setDraft({})
    navigate(effectiveView === "list" ? "/admin/orders" : `/admin/orders?view=${effectiveView}`)
  }

  const setView = (next: WorkspaceView) => {
    if (isDeletedView && next !== "list") return
    navigate(buildHref({ view: next === "list" ? undefined : next }))
  }

  const setSort = (sort: WorkspaceSortKey) => {
    setDraft((d) => ({ ...d, sort }))
    navigate(buildHref({ sort }))
  }

  // The list view honors an optional employee batch slice from the URL.
  const focusedRange = useMemo(() => {
    if (assignStart == null && assignEnd == null) return null
    const start = Math.max(0, assignStart ?? 0)
    const end = Math.min(orders.length, assignEnd ?? orders.length)
    return { start, end }
  }, [assignStart, assignEnd, orders.length])

  const visibleOrders = useMemo(() => {
    if (view === "list" && focusedRange) {
      return orders.slice(focusedRange.start, focusedRange.end)
    }
    return orders
  }, [orders, view, focusedRange])

  const toggleOne = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectMany = (ids: string[], additive = false) => {
    setSelectedIds((current) => {
      const next = additive ? new Set(current) : new Set<string>()
      ids.forEach((id) => next.add(id))
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const visibleOrderIds = useMemo(() => visibleOrders.map((order) => order.id), [visibleOrders])
  const allFilteredOrderIds = useMemo(() => orders.map((order) => order.id), [orders])
  const selectedVisibleCount = useMemo(
    () => visibleOrderIds.filter((id) => selectedIds.has(id)).length,
    [visibleOrderIds, selectedIds]
  )
  const allVisibleSelected =
    visibleOrderIds.length > 0 && selectedVisibleCount === visibleOrderIds.length
  const allFilteredSelected =
    allFilteredOrderIds.length > 0 && allFilteredOrderIds.every((id) => selectedIds.has(id))

  const selectedCount = selectedIds.size

  const selectedOrders = useMemo(
    () => orders.filter((order) => selectedIds.has(order.id)),
    [orders, selectedIds]
  )
  const selectionHasParcel = selectedOrders.some(
    (order) => order.shippingType === "gls" || order.shippingType === "foxpost"
  )
  const selectionHasStandard = selectedOrders.some((order) => order.shippingType === "standard")
  const selectionStandardNeedsLabel = selectedOrders.some(
    (order) => order.shippingType === "standard" && order.needsLabel && !order.isGeneratingLabel
  )
  const selectionStandardHasLabel = selectedOrders.some(
    (order) => order.shippingType === "standard" && order.hasLabel && !order.isGeneratingLabel
  )
  const selectionHasLabels = selectedOrders.some((order) => order.hasLabel || order.isGeneratingLabel)
  const showParcelLabelActions = !isDeletedView && parcelManagerEnabled && selectionHasParcel
  const showStandardGenerateMissing = !isDeletedView && selectionStandardNeedsLabel
  const showStandardRegenerate = !isDeletedView && selectionStandardHasLabel
  const showLabelDownload = !isDeletedView && selectedCount > 0

  const handleBulkStatus = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0 || isUpdating) return
    setIsUpdating(true)
    try {
      const result = await bulkUpdateOrderStatuses(ids, bulkStatus)
      clearSelection()
      router.refresh()
      const label = getStatusLabel(bulkStatus)
      const skipped = result.skippedCount > 0 ? ` ${result.skippedCount} változatlan.` : ""
      toast.success(`${result.updatedCount} rendelés státusza: ${label}.${skipped}`)
    } catch {
      toast.error("A státusz frissítése sikertelen.")
    } finally {
      setIsUpdating(false)
    }
  }

  const runBulkLabels = async (ids: string[]) => {
    if (isDeletedView) return
    const eligible = ids.filter((id) => {
      const order = orders.find((entry) => entry.id === id)
      return order && !isAdminDeletedOrder(order.status)
    })
    if (eligible.length === 0 || isGeneratingLabels || !parcelManagerEnabled) return

    setIsGeneratingLabels(true)
    try {
      const result = await bulkGenerateParcelLabels(eligible, { skipExisting: true })
      router.refresh()
      const parts = [`${result.successCount} címke kész`]
      if (result.skippedCount > 0) parts.push(`${result.skippedCount} kihagyva`)
      if (result.failedCount > 0) parts.push(`${result.failedCount} hiba`)
      if (result.failedCount > 0) toast.error(parts.join(", "))
      else toast.success(parts.join(", "))
    } catch {
      toast.error("A címkék generálása sikertelen.")
    } finally {
      setIsGeneratingLabels(false)
    }
  }

  const runBulkStandardLabels = async (ids: string[], options?: { skipExisting?: boolean }) => {
    if (isDeletedView) return
    const skipExisting = options?.skipExisting !== false
    const eligible = ids.filter((id) => {
      const order = orders.find((entry) => entry.id === id)
      if (!order || isAdminDeletedOrder(order.status) || order.shippingType !== "standard") return false
      if (skipExisting) return order.needsLabel && !order.isGeneratingLabel
      return order.hasLabel && !order.isGeneratingLabel
    })
    if (eligible.length === 0 || isGeneratingLabels) return

    setIsGeneratingLabels(true)
    try {
      const result = await bulkGenerateStandardShippingLabels(eligible, { skipExisting })
      router.refresh()
      const actionLabel = skipExisting ? "szállítási címke kész" : "címke újragenerálva"
      const parts = [`${result.successCount} ${actionLabel}`]
      if (result.skippedCount > 0) parts.push(`${result.skippedCount} kihagyva`)
      if (result.failedCount > 0) parts.push(`${result.failedCount} hiba`)
      if (result.failedCount > 0) toast.error(parts.join(", "))
      else toast.success(parts.join(", "))
    } catch {
      toast.error("A szállítási címkék generálása sikertelen.")
    } finally {
      setIsGeneratingLabels(false)
    }
  }

  const handleBulkParcelLabels = async () => {
    await runBulkLabels(Array.from(selectedIds))
  }

  const handleBulkStandardLabels = async () => {
    await runBulkStandardLabels(Array.from(selectedIds), { skipExisting: true })
  }

  const handleBulkRegenerateStandardLabels = async () => {
    await runBulkStandardLabels(Array.from(selectedIds), { skipExisting: false })
  }

  const handleDownloadZip = async () => {
    if (isDeletedView) return
    const ids = Array.from(selectedIds).filter((id) => {
      const order = orders.find((entry) => entry.id === id)
      return order && !isAdminDeletedOrder(order.status)
    })
    if (ids.length === 0 || isDownloadingZip) return
    setIsDownloadingZip(true)
    try {
      const params = new URLSearchParams(exportQuery)
      params.set("ids", ids.join(","))
      const response = await fetch(`/api/admin/orders/export-labels?${params.toString()}`, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const blob = await response.blob()
      if (blob.size < 4) throw new Error("A címke ZIP üres.")
      const filename = parseFilename(response.headers.get("content-disposition")) || "cimkek.zip"
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      toast.success("Címke ZIP letöltve.")
    } catch {
      toast.error("A címke ZIP letöltése sikertelen.")
    } finally {
      setIsDownloadingZip(false)
    }
  }

  return (
    <div
      className={cn(
        "space-y-6 animate-in fade-in duration-500",
        isNavigating && "opacity-60",
        selectedCount > 0 && "pb-28"
      )}
    >
      <WorkspaceHeader />

      <FilterBar
        draft={draft}
        setDraft={setDraft}
        products={products}
        onApply={applyFilters}
        onReset={resetFilters}
        isNavigating={isNavigating}
      />

      <div className="flex justify-end">
        <AdminOrdersExportLink
          exportQuery={exportQuery}
          labelsZipEnabled={glsManagerEnabled || foxpostManagerEnabled}
          selectedOrderIds={Array.from(selectedIds)}
        />
      </div>

      {isDeletedView && (
        <div className="border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <span className="font-black uppercase tracking-widest text-rose-300">Törölt rendelések</span>
          <span className="text-rose-200/80">
            {" "}
            — csak megtekintés és státusz módosítás. Csoportosítás, munkamegosztás és címke műveletek nem érhetők el.
          </span>
        </div>
      )}

      <StatsBar
        stats={stats}
        totalPool={data.totalPool}
        totalDeleted={data.totalDeleted}
        deletedFilter={data.deletedFilter}
      />

      <ViewTabs
        view={effectiveView}
        setView={setView}
        mixCount={mixGroups.length}
        shippingLaneCount={shippingMixSections.length}
        orderCount={orders.length}
        isDeletedView={isDeletedView}
      />

      {filters.mix && !isDeletedView && (
        <MixFilterBanner
          orderCount={orders.length}
          mixKey={filters.mix}
          shippingType={filters.shippingType}
          onClear={() => navigate(buildHref({ mix: undefined }))}
          onSelectAllFiltered={() => selectMany(allFilteredOrderIds)}
        />
      )}

      {effectiveView === "list" && visibleOrderIds.length > 0 && !isDeletedView && (
        <SelectionToolbar
          visibleCount={visibleOrderIds.length}
          filteredCount={allFilteredOrderIds.length}
          selectedCount={selectedCount}
          selectedVisibleCount={selectedVisibleCount}
          allVisibleSelected={allVisibleSelected}
          allFilteredSelected={allFilteredSelected}
          onSelectVisible={() => selectMany(visibleOrderIds)}
          onSelectAllFiltered={() => selectMany(allFilteredOrderIds)}
          onClear={clearSelection}
        />
      )}

      {focusedRange && effectiveView === "list" && !isDeletedView && (
        <FocusBanner
          range={focusedRange}
          count={visibleOrders.length}
          shippingLabel={
            filters.shippingType && filters.shippingType !== "all"
              ? orders.find((order) => order.shippingType === filters.shippingType)?.shippingLabel
              : undefined
          }
          onSelectBatch={() => selectMany(visibleOrders.map((o) => o.id))}
          clearHref={buildHref({
            assignStart: undefined,
            assignEnd: undefined,
            shippingType: undefined,
          })}
          onNavigate={navigate}
        />
      )}

      {effectiveView === "list" && (
        <ListView
          orders={visibleOrders}
          selectedIds={selectedIds}
          onToggle={toggleOne}
          onToggleAll={() => {
            if (allVisibleSelected) {
              setSelectedIds((current) => {
                const next = new Set(current)
                visibleOrderIds.forEach((id) => next.delete(id))
                return next
              })
            } else {
              selectMany(visibleOrderIds, true)
            }
          }}
          sort={(filters.sort as WorkspaceSortKey) || "newest"}
          onSort={setSort}
          onOpenOrder={openOrderDetail}
        />
      )}

      {effectiveView === "mix" && !isDeletedView && (
        <MixView
          sections={shippingMixSections}
          onSelectGroup={(ids) => selectMany(ids)}
          buildMixHref={(mixKey, shippingType) =>
            buildHref({
              mix: mixKey,
              shippingType,
              view: undefined,
            })
          }
          buildShippingHref={(shippingType) =>
            buildHref({ shippingType, mix: undefined, view: undefined })
          }
          onNavigate={navigate}
          parcelManagerEnabled={parcelManagerEnabled}
          onGenerateLabels={runBulkLabels}
          onGenerateStandardLabels={runBulkStandardLabels}
          isGeneratingLabels={isGeneratingLabels}
        />
      )}

      {effectiveView === "assign" && !isDeletedView && (
        <AssignView
          sections={shippingMixSections}
          orders={orders}
          employeeCount={employeeCount}
          setEmployeeCount={setEmployeeCount}
          buildBatchHref={(shippingType, start, end) =>
            buildHref({
              shippingType,
              view: undefined,
              assignStart: String(start),
              assignEnd: String(end),
            })
          }
          onSelectBatch={(ids) => selectMany(ids)}
          onNavigate={navigate}
        />
      )}

      <AdminOrderDetailSheet
        orderId={detailOrderId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        glsManagerEnabled={glsManagerEnabled}
        foxpostManagerEnabled={foxpostManagerEnabled}
        onOrderUpdated={() => router.refresh()}
      />

      {selectedCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-primary/40 bg-black/95 shadow-2xl backdrop-blur lg:left-72">
          <div className="mx-auto max-w-7xl px-6 py-4 md:px-10">
            <BulkActionBar
              selectedCount={selectedCount}
              bulkStatus={bulkStatus}
              setBulkStatus={setBulkStatus}
              onApplyStatus={handleBulkStatus}
              onGenerateParcelLabels={handleBulkParcelLabels}
              onGenerateStandardLabels={handleBulkStandardLabels}
              onRegenerateStandardLabels={handleBulkRegenerateStandardLabels}
              onDownloadZip={handleDownloadZip}
              onClear={clearSelection}
              isUpdating={isUpdating}
              isGeneratingLabels={isGeneratingLabels}
              isDownloadingZip={isDownloadingZip}
              showParcelLabelActions={showParcelLabelActions}
              showStandardGenerateMissing={showStandardGenerateMissing}
              showStandardRegenerate={showStandardRegenerate}
              showLabelDownload={showLabelDownload}
              selectionHasLabels={selectionHasLabels}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function WorkspaceHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight mb-2 uppercase italic text-white leading-[0.9]">
          Rendelés <span className="admin-headline-accent">Munkatér</span>
        </h1>
        <p className="text-white/40 font-medium italic">
          Okos szűrők, termék-mix csoportosítás és párhuzamos munkamegosztás egy helyen.
        </p>
      </div>
    </div>
  )
}

function FilterBar({
  draft,
  setDraft,
  products,
  onApply,
  onReset,
  isNavigating,
}: {
  draft: AdminOrderFilters
  setDraft: React.Dispatch<React.SetStateAction<AdminOrderFilters>>
  products: { id: string; name: string }[]
  onApply: () => void
  onReset: () => void
  isNavigating: boolean
}) {
  const set = (key: keyof AdminOrderFilters, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }))

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onApply()
      }}
      className="space-y-4 border border-white/10 bg-white/5 p-4"
    >
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-400">
        <Filter className="h-3.5 w-3.5 text-primary" />
        Okos szűrők
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
        <input
          value={draft.q || ""}
          onChange={(e) => set("q", e.target.value)}
          placeholder="Keresés: azonosító, név, email, telefon, város, termék..."
          className={cn(inputClass, "h-12 pl-10")}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <div>
          <label className={labelClass}>Rendelés készlet</label>
          <select
            value={draft.deletedFilter === "deleted" ? "deleted" : "active"}
            onChange={(e) => {
              const next = e.target.value
              setDraft((d) => ({
                ...d,
                deletedFilter: next === "deleted" ? "deleted" : undefined,
                status: next === "deleted" ? "cancelled" : d.status === "cancelled" ? "all" : d.status,
                mix: next === "deleted" ? undefined : d.mix,
              }))
            }}
            className={inputClass}
          >
            <option value="active">Aktív rendelések</option>
            <option value="deleted">Csak töröltek</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Termék</label>
          <select value={draft.productId || "all"} onChange={(e) => set("productId", e.target.value)} className={inputClass}>
            <option value="all">Minden termék</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Státusz</label>
          <select
            value={draft.deletedFilter === "deleted" ? "cancelled" : draft.status || "all"}
            onChange={(e) => set("status", e.target.value)}
            disabled={draft.deletedFilter === "deleted"}
            className={inputClass}
          >
            {draft.deletedFilter === "deleted" ? (
              <option value="cancelled">Törölve</option>
            ) : (
              <>
                <option value="all">Minden státusz</option>
                {STATUSES.filter((status) => status.value !== "cancelled").map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>
        <div>
          <label className={labelClass}>Szállítás</label>
          <select value={draft.shippingType || "all"} onChange={(e) => set("shippingType", e.target.value)} className={inputClass}>
            <option value="all">Minden szállítás</option>
            <option value="gls">GLS csomagpont</option>
            <option value="foxpost">Foxpost</option>
            <option value="standard">Standard</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Címke állapot</label>
          <select value={draft.labelState || "all"} onChange={(e) => set("labelState", e.target.value)} className={inputClass}>
            <option value="all">Mindegy</option>
            <option value="needs">Címke hiányzik</option>
            <option value="generating">Címke generálás alatt</option>
            <option value="error">Címke generálási hiba</option>
            <option value="has">Van címke</option>
            <option value="none">Nincs csomagküldés</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Számla</label>
          <select value={draft.invoiceStatus || "all"} onChange={(e) => set("invoiceStatus", e.target.value)} className={inputClass}>
            <option value="all">Minden számla</option>
            <option value="pending">Pending</option>
            <option value="issued">Issued</option>
            <option value="failed">Failed</option>
            <option value="manual">Manual</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Vásárló típus</label>
          <select value={draft.billingType || "all"} onChange={(e) => set("billingType", e.target.value)} className={inputClass}>
            <option value="all">Mindegy</option>
            <option value="personal">Magánszemély</option>
            <option value="company">Cég</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <NumberRange label="Darabszám (db)" minKey="unitsMin" maxKey="unitsMax" draft={draft} set={set} />
        <NumberRange label="Tételféle" minKey="kindsMin" maxKey="kindsMax" draft={draft} set={set} />
        <NumberRange label="Összeg (Ft)" minKey="totalMin" maxKey="totalMax" draft={draft} set={set} step={1000} />
        <div>
          <label className={labelClass}>Rendelés – tól</label>
          <input type="date" value={draft.dateFrom || ""} onChange={(e) => set("dateFrom", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Rendelés – ig</label>
          <input type="date" value={draft.dateTo || ""} onChange={(e) => set("dateTo", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Utoljára módosítva – tól</label>
          <input type="date" value={draft.updatedFrom || ""} onChange={(e) => set("updatedFrom", e.target.value)} className={inputClass} />
          <p className="mt-1 text-[9px] italic text-neutral-600">Bármilyen mező (címke, kapcsolat, tétel…)</p>
        </div>
        <div>
          <label className={labelClass}>Utoljára módosítva – ig</label>
          <input type="date" value={draft.updatedTo || ""} onChange={(e) => set("updatedTo", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Státusz átállítás napja</label>
          <input type="date" value={draft.statusChangedOn || ""} onChange={(e) => set("statusChangedOn", e.target.value)} className={inputClass} />
          <p className="mt-1 text-[9px] italic text-neutral-600">
            Státuszváltás napja (statusHistory). Régi rendeléseknél futtasd a backfill scriptet.
          </p>
        </div>
        <div>
          <label className={labelClass}>Státusz átállítás – tól</label>
          <input type="date" value={draft.statusChangedFrom || ""} onChange={(e) => set("statusChangedFrom", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Státusz átállítás – ig</label>
          <input type="date" value={draft.statusChangedTo || ""} onChange={(e) => set("statusChangedTo", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Foxpost címke napja</label>
          <input type="date" value={draft.foxpostLabelOn || ""} onChange={(e) => set("foxpostLabelOn", e.target.value)} className={inputClass} />
          <p className="mt-1 text-[9px] italic text-neutral-600">
            Tömeges címkegenerálás napja (foxpostShipment.generatedAt)
          </p>
        </div>
        <div>
          <label className={labelClass}>Foxpost címke – tól</label>
          <input type="date" value={draft.foxpostLabelFrom || ""} onChange={(e) => set("foxpostLabelFrom", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Foxpost címke – ig</label>
          <input type="date" value={draft.foxpostLabelTo || ""} onChange={(e) => set("foxpostLabelTo", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>GLS címke napja</label>
          <input type="date" value={draft.glsLabelOn || ""} onChange={(e) => set("glsLabelOn", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Rendezés</label>
          <select value={draft.sort || "newest"} onChange={(e) => set("sort", e.target.value)} className={inputClass}>
            {WORKSPACE_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="submit"
          disabled={isNavigating}
          className="h-10 rounded-none bg-primary px-6 text-[10px] font-black uppercase tracking-widest text-white hover:bg-primary/80"
        >
          {isNavigating ? <LoadingSpinner size="xs" className="mr-2" /> : <Filter className="mr-2 h-4 w-4" />}
          Szűrés
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          className="h-10 rounded-none border-white/10 px-4 text-[10px] font-black uppercase tracking-widest text-neutral-300"
        >
          <RotateCcw className="mr-2 h-3.5 w-3.5" />
          Törlés
        </Button>
        {draft.mix && (
          <span className="inline-flex items-center gap-2 border border-primary/40 bg-primary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary">
            <Layers className="h-3 w-3" /> Mix szűrő aktív
            <button type="button" onClick={() => set("mix", "")} className="hover:text-white">
              <X className="h-3 w-3" />
            </button>
          </span>
        )}
      </div>
    </form>
  )
}

function NumberRange({
  label,
  minKey,
  maxKey,
  draft,
  set,
  step,
}: {
  label: string
  minKey: keyof AdminOrderFilters
  maxKey: keyof AdminOrderFilters
  draft: AdminOrderFilters
  set: (key: keyof AdminOrderFilters, value: string) => void
  step?: number
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={0}
          step={step}
          value={(draft[minKey] as string) || ""}
          onChange={(e) => set(minKey, e.target.value)}
          placeholder="min"
          className={cn(inputClass, "px-2 text-center")}
        />
        <span className="text-neutral-600">–</span>
        <input
          type="number"
          min={0}
          step={step}
          value={(draft[maxKey] as string) || ""}
          onChange={(e) => set(maxKey, e.target.value)}
          placeholder="max"
          className={cn(inputClass, "px-2 text-center")}
        />
      </div>
    </div>
  )
}

function StatsBar({
  stats,
  totalPool,
  totalDeleted,
  deletedFilter,
}: {
  stats: AdminOrdersWorkspaceData["stats"]
  totalPool: number
  totalDeleted: number
  deletedFilter: AdminOrdersWorkspaceData["deletedFilter"]
}) {
  const poolLabel = deletedFilter === "deleted" ? "Törölt" : "Aktív"
  return (
    <div className="flex flex-wrap gap-2 text-sm">
      <StatChip label={`Találat (${poolLabel})`} value={`${stats.totalOrders} / ${totalPool}`} />
      {deletedFilter !== "deleted" && totalDeleted > 0 ? (
        <StatChip
          label="Törölve (rejtett)"
          value={totalDeleted}
          accent="text-rose-300"
          border="border-rose-500/20 bg-rose-500/5"
        />
      ) : null}
      <StatChip label="Összes db" value={stats.totalUnits.toLocaleString("hu-HU")} accent="text-white" />
      {deletedFilter !== "deleted" ? (
        <>
          <StatChip label="Szállítási sáv" value={stats.shippingLanes} accent="text-primary" />
          <StatChip label="Mix csoport" value={stats.mixGroups} accent="text-primary" />
        </>
      ) : null}
      <StatChip label="Címke kész" value={stats.hasLabel} accent="text-emerald-300" border="border-emerald-500/20 bg-emerald-500/5" />
      <StatChip label="Címke hiányzik" value={stats.needsLabel} accent="text-amber-300" border="border-amber-500/20 bg-amber-500/5" />
      {STATUSES.map((status) =>
        stats.statusCounts[status.value] ? (
          <StatChip key={status.value} label={status.label} value={stats.statusCounts[status.value]} />
        ) : null
      )}
    </div>
  )
}

function StatChip({
  label,
  value,
  accent = "text-white",
  border = "border-white/10 bg-black/40",
}: {
  label: string
  value: string | number
  accent?: string
  border?: string
}) {
  return (
    <div className={cn("border px-4 py-2", border)}>
      <span className="text-neutral-500">{label}:</span>{" "}
      <span className={cn("font-black", accent)}>{value}</span>
    </div>
  )
}

function ViewTabs({
  view,
  setView,
  mixCount,
  shippingLaneCount,
  orderCount,
  isDeletedView,
}: {
  view: WorkspaceView
  setView: (view: WorkspaceView) => void
  mixCount: number
  shippingLaneCount: number
  orderCount: number
  isDeletedView: boolean
}) {
  const tabs: { id: WorkspaceView; label: string; icon: typeof Package; hint: string }[] = [
    { id: "list", label: "Lista", icon: Package, hint: `${orderCount} rendelés` },
    ...(isDeletedView
      ? []
      : [
          {
            id: "mix" as const,
            label: "Termék-mix",
            icon: Layers,
            hint: `${shippingLaneCount} szállítás · ${mixCount} mix`,
          },
          { id: "assign" as const, label: "Munkamegosztás", icon: Users, hint: "párhuzamos" },
        ]),
  ]
  return (
    <div className="flex flex-wrap gap-2 border-b border-white/10">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const active = view === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setView(tab.id)}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors",
              active
                ? "border-primary text-white"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
            <span className="text-neutral-600">({tab.hint})</span>
          </button>
        )
      })}
    </div>
  )
}

function MixFilterBanner({
  orderCount,
  mixKey,
  shippingType,
  onClear,
  onSelectAllFiltered,
}: {
  orderCount: number
  mixKey: string
  shippingType?: string
  onClear: () => void
  onSelectAllFiltered: () => void
}) {
  return (
    <div className="flex flex-col gap-3 border border-primary/40 bg-primary/10 p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-3">
        <Layers className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-white">Termék-mix szűrő aktív</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-primary/80">
            {orderCount} rendelés ebben a mixben
            {shippingType && shippingType !== "all" ? ` · ${shippingType} szállítás` : ""}
            {" · "}mix #{mixKey}
          </p>
          <p className="mt-2 text-xs italic text-neutral-400">
            A státusz és címke állapot szűrők csak ezen a mixen belül érvényesek. Pl. válaszd a „Címke hiányzik”
            opciót, majd kattints a Szűrés gombra.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={onSelectAllFiltered}
          className="h-9 rounded-none bg-primary px-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-primary/80"
        >
          <Boxes className="mr-2 h-4 w-4" />
          Mix összes kijelölése ({orderCount})
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onClear}
          className="h-9 rounded-none border-white/20 px-3 text-[10px] font-black uppercase tracking-widest text-neutral-200"
        >
          <X className="mr-1 h-3.5 w-3.5" /> Mix törlése
        </Button>
      </div>
    </div>
  )
}

function SelectionToolbar({
  visibleCount,
  filteredCount,
  selectedCount,
  selectedVisibleCount,
  allVisibleSelected,
  allFilteredSelected,
  onSelectVisible,
  onSelectAllFiltered,
  onClear,
}: {
  visibleCount: number
  filteredCount: number
  selectedCount: number
  selectedVisibleCount: number
  allVisibleSelected: boolean
  allFilteredSelected: boolean
  onSelectVisible: () => void
  onSelectAllFiltered: () => void
  onClear: () => void
}) {
  const showScopeButtons = filteredCount > visibleCount

  return (
    <div className="flex flex-col gap-3 border border-white/10 bg-black/40 p-3 md:flex-row md:items-center md:justify-between">
      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
        Kijelölés: {selectedCount} rendelés
        {showScopeButtons
          ? ` · látható ${selectedVisibleCount}/${visibleCount} · szűrt találat ${filteredCount}`
          : ` · ${filteredCount} szűrt találat`}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onSelectVisible}
          disabled={allVisibleSelected}
          className="h-9 rounded-none border-white/10 px-3 text-[10px] font-black uppercase tracking-widest text-neutral-200 disabled:opacity-40"
        >
          Látható kijelölése ({visibleCount})
        </Button>
        {showScopeButtons ? (
          <Button
            type="button"
            variant="outline"
            onClick={onSelectAllFiltered}
            disabled={allFilteredSelected}
            className="h-9 rounded-none border-primary/40 px-3 text-[10px] font-black uppercase tracking-widest text-primary disabled:opacity-40"
          >
            Összes szűrt találat ({filteredCount})
          </Button>
        ) : null}
        {selectedCount > 0 ? (
          <Button
            type="button"
            variant="outline"
            onClick={onClear}
            className="h-9 rounded-none border-white/10 px-3 text-[10px] font-black uppercase tracking-widest text-neutral-400"
          >
            Kijelölés törlése
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function FocusBanner({
  range,
  count,
  shippingLabel,
  onSelectBatch,
  clearHref,
  onNavigate,
}: {
  range: { start: number; end: number }
  count: number
  shippingLabel?: string
  onSelectBatch: () => void
  clearHref: string
  onNavigate: (href: string) => void
}) {
  return (
    <div className="flex flex-col gap-3 border border-primary/40 bg-primary/10 p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <Users className="h-5 w-5 text-primary" />
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-white">
            Munkacsomag{shippingLabel ? `: ${shippingLabel}` : ""} — rendelések {range.start + 1}–{range.end}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
            {count} rendelés ebben a tartományban
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={onSelectBatch}
          className="h-9 rounded-none bg-primary px-4 text-[10px] font-black uppercase tracking-widest text-white hover:bg-primary/80"
        >
          Csomag kijelölése
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onNavigate(clearHref)}
          className="h-9 rounded-none border-white/20 px-4 text-[10px] font-black uppercase tracking-widest text-neutral-200"
        >
          <X className="mr-1 h-3.5 w-3.5" /> Teljes lista
        </Button>
      </div>
    </div>
  )
}

function BulkActionBar({
  selectedCount,
  bulkStatus,
  setBulkStatus,
  onApplyStatus,
  onGenerateParcelLabels,
  onGenerateStandardLabels,
  onRegenerateStandardLabels,
  onDownloadZip,
  onClear,
  isUpdating,
  isGeneratingLabels,
  isDownloadingZip,
  showParcelLabelActions,
  showStandardGenerateMissing,
  showStandardRegenerate,
  showLabelDownload,
  selectionHasLabels,
}: {
  selectedCount: number
  bulkStatus: OrderStatusValue
  setBulkStatus: (status: OrderStatusValue) => void
  onApplyStatus: () => void
  onGenerateParcelLabels: () => void
  onGenerateStandardLabels: () => void
  onRegenerateStandardLabels: () => void
  onDownloadZip: () => void
  onClear: () => void
  isUpdating: boolean
  isGeneratingLabels: boolean
  isDownloadingZip: boolean
  showParcelLabelActions: boolean
  showStandardGenerateMissing: boolean
  showStandardRegenerate: boolean
  showLabelDownload: boolean
  selectionHasLabels: boolean
}) {
  const busy = isUpdating || isGeneratingLabels || isDownloadingZip
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center bg-primary text-sm font-black text-white">
          {selectedCount}
        </span>
        <span className="text-[10px] font-black uppercase tracking-widest text-white">rendelés kijelölve</span>
        <button type="button" onClick={onClear} className="text-neutral-500 hover:text-white" aria-label="Kijelölés törlése">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={bulkStatus}
          onChange={(e) => setBulkStatus(e.target.value as OrderStatusValue)}
          disabled={busy}
          className="h-10 rounded-none border border-white/10 bg-black px-3 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50"
        >
          {STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <Button
          type="button"
          onClick={onApplyStatus}
          disabled={busy}
          className="h-10 rounded-none bg-primary px-4 text-[10px] font-black uppercase tracking-widest text-white hover:bg-primary/80"
        >
          {isUpdating ? <LoadingSpinner size="xs" className="mr-2" /> : null}
          Státusz
        </Button>
        {showParcelLabelActions ? (
          <Button
            type="button"
            variant="outline"
            onClick={onGenerateParcelLabels}
            disabled={busy}
            className="h-10 rounded-none border-amber-500/30 px-4 text-[10px] font-black uppercase tracking-widest text-amber-400 hover:bg-amber-500/10"
          >
            {isGeneratingLabels ? <LoadingSpinner size="xs" className="mr-2" /> : <Printer className="mr-2 h-4 w-4" />}
            Csomagcímkék
          </Button>
        ) : null}
        {showStandardGenerateMissing ? (
          <Button
            type="button"
            variant="outline"
            onClick={onGenerateStandardLabels}
            disabled={busy}
            className="h-10 rounded-none border-emerald-500/30 px-4 text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/10"
          >
            {isGeneratingLabels ? <LoadingSpinner size="xs" className="mr-2" /> : <Tag className="mr-2 h-4 w-4" />}
            PDF címkék
          </Button>
        ) : null}
        {showStandardRegenerate ? (
          <Button
            type="button"
            variant="outline"
            onClick={onRegenerateStandardLabels}
            disabled={busy}
            className="h-10 rounded-none border-emerald-500/30 px-4 text-[10px] font-black uppercase tracking-widest text-emerald-300 hover:bg-emerald-500/10"
          >
            {isGeneratingLabels ? <LoadingSpinner size="xs" className="mr-2" /> : <RotateCcw className="mr-2 h-4 w-4" />}
            PDF újragenerálás
          </Button>
        ) : null}
        {showLabelDownload ? (
          <Button
            type="button"
            variant="outline"
            onClick={onDownloadZip}
            disabled={busy}
            className="h-10 rounded-none border-white/10 px-4 text-[10px] font-black uppercase tracking-widest text-white"
            title={selectionHasLabels ? undefined : "A kijelölésben még nincs letölthető címke"}
          >
            {isDownloadingZip ? <LoadingSpinner size="xs" className="mr-2" /> : <Download className="mr-2 h-4 w-4" />}
            Címkék ZIP
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function MixChips({ order }: { order: AdminOrderSummary }) {
  return (
    <div className="flex flex-wrap gap-1">
      {order.items.slice(0, 4).map((item, idx) => (
        <span
          key={idx}
          className="border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] font-bold text-neutral-300"
        >
          {item.quantity}× {item.name.length > 22 ? `${item.name.slice(0, 22)}…` : item.name}
          {item.variantLabel ? ` (${item.variantLabel})` : ""}
        </span>
      ))}
      {order.items.length > 4 && (
        <span className="border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] font-bold text-neutral-500">
          +{order.items.length - 4}
        </span>
      )}
    </div>
  )
}

function SortHeader({
  label,
  ascKey,
  descKey,
  current,
  onSort,
  align = "left",
}: {
  label: string
  ascKey: WorkspaceSortKey
  descKey: WorkspaceSortKey
  current: WorkspaceSortKey
  onSort: (sort: WorkspaceSortKey) => void
  align?: "left" | "right"
}) {
  const next = current === descKey ? ascKey : descKey
  return (
    <button
      type="button"
      onClick={() => onSort(next)}
      className={cn(
        "flex items-center gap-1 font-black uppercase tracking-widest text-[10px] text-neutral-500 hover:text-white",
        align === "right" && "ml-auto"
      )}
    >
      {label}
      {current === descKey ? (
        <ArrowDownWideNarrow className="h-3 w-3 text-primary" />
      ) : current === ascKey ? (
        <ArrowUpNarrowWide className="h-3 w-3 text-primary" />
      ) : null}
    </button>
  )
}

function ListView({
  orders,
  selectedIds,
  onToggle,
  onToggleAll,
  sort,
  onSort,
  onOpenOrder,
}: {
  orders: AdminOrderSummary[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
  onToggleAll: () => void
  sort: WorkspaceSortKey
  onSort: (sort: WorkspaceSortKey) => void
  onOpenOrder: (orderId: string) => void
}) {
  const allSelected = orders.length > 0 && orders.every((o) => selectedIds.has(o.id))

  return (
    <div className="overflow-hidden border border-white/10 bg-white/5 text-white shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] text-left">
          <thead>
            <tr className="border-b border-white/5 bg-white/5">
              <th className="px-4 py-4">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  disabled={orders.length === 0}
                  className="h-4 w-4 rounded-none border-white/20 bg-black accent-primary"
                  aria-label="Összes kijelölése"
                />
              </th>
              <th className="px-4 py-4">
                <SortHeader label="Azonosító / Dátum" ascKey="oldest" descKey="newest" current={sort} onSort={onSort} />
              </th>
              <th className="px-4 py-4 font-black uppercase tracking-widest text-[10px] text-neutral-500">Vásárló</th>
              <th className="px-4 py-4 font-black uppercase tracking-widest text-[10px] text-neutral-500">Termék-mix</th>
              <th className="px-4 py-4">
                <SortHeader label="Db / Tétel" ascKey="units_asc" descKey="units_desc" current={sort} onSort={onSort} />
              </th>
              <th className="px-4 py-4 font-black uppercase tracking-widest text-[10px] text-neutral-500">Szállítás</th>
              <th className="px-4 py-4 font-black uppercase tracking-widest text-[10px] text-neutral-500">Állapot</th>
              <th className="px-4 py-4">
                <SortHeader label="Összeg" ascKey="total_asc" descKey="total_desc" current={sort} onSort={onSort} align="right" />
              </th>
              <th className="px-4 py-4 text-right font-black uppercase tracking-widest text-[10px] text-neutral-500">Művelet</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-20 text-center italic text-white/20">
                  <Package className="mx-auto mb-4 h-12 w-12 opacity-10" />
                  Nincs a szűrőnek megfelelő rendelés.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const isSelected = selectedIds.has(order.id)
                return (
                  <tr
                    key={order.id}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-white/5",
                      isSelected && "bg-primary/5"
                    )}
                    onClick={() => onOpenOrder(order.id)}
                  >
                    <td className="px-4 py-4 align-top" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggle(order.id)}
                        className="h-4 w-4 rounded-none border-white/20 bg-black accent-primary"
                        aria-label={`${order.orderNumber} kijelölése`}
                      />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className="font-heading text-sm font-black uppercase tracking-wider text-white hover:text-primary">
                        {order.orderNumber}
                      </span>
                      <div className="mt-1 flex items-center gap-1 text-neutral-500">
                        <Calendar className="h-3 w-3" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {format(new Date(order.createdAt), "yyyy.MM.dd HH:mm", { locale: hu })}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p className="text-sm font-bold italic text-white">{order.customerName}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600">{order.deliveryHint || "—"}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <MixChips order={order} />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-neutral-700" />
                        <span className="text-sm font-black tracking-widest text-white">{order.totalUnits} db</span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">{order.itemKinds} tételféle</span>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-300">{order.shippingLabel}</span>
                      {order.isGeneratingLabel && (
                        <p className="text-[9px] font-black uppercase tracking-widest text-blue-400">Generálás alatt</p>
                      )}
                      {order.labelError && !order.isGeneratingLabel && (
                        <p
                          className="mt-1 line-clamp-2 text-[9px] font-bold leading-snug text-rose-400"
                          title={order.labelError}
                        >
                          {order.labelError}
                        </p>
                      )}
                      {order.hasLabel && !order.isGeneratingLabel && !order.labelError && (
                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Címke kész</p>
                      )}
                      {order.needsLabel && !order.isGeneratingLabel && !order.labelError && (
                        <p className="text-[9px] font-black uppercase tracking-widest text-amber-400">Címke hiányzik</p>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className={cn("inline-block border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest", getStatusStyle(order.status))}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top text-right">
                      <span className="text-base font-black tracking-tighter text-white">{formatHuf(order.gross)}</span>
                      {order.discount > 0 && (
                        <p className="flex items-center justify-end gap-1 text-[8px] font-black uppercase tracking-widest text-highlight">
                          <Tag className="h-3 w-3" /> kedvezmény
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right align-top" onClick={(e) => e.stopPropagation()}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onOpenOrder(order.id)}
                        className="h-10 w-10 rounded-none border border-transparent text-neutral-500 hover:border-white/30 hover:bg-white/10 hover:text-white"
                        title="Részletek megnyitása"
                      >
                        <Eye className="h-5 w-5" />
                      </Button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MixView({
  sections,
  onSelectGroup,
  buildMixHref,
  buildShippingHref,
  onNavigate,
  parcelManagerEnabled,
  onGenerateLabels,
  onGenerateStandardLabels,
  isGeneratingLabels,
}: {
  sections: OrderShippingMixSection[]
  onSelectGroup: (ids: string[]) => void
  buildMixHref: (mixKey: string, shippingType: OrderShippingTypeFilter) => string
  buildShippingHref: (shippingType: OrderShippingTypeFilter) => string
  onNavigate: (href: string) => void
  parcelManagerEnabled: boolean
  onGenerateLabels: (orderIds: string[]) => void | Promise<void>
  onGenerateStandardLabels: (orderIds: string[], options?: { skipExisting?: boolean }) => void | Promise<void>
  isGeneratingLabels: boolean
}) {
  const totalMixGroups = sections.reduce((sum, section) => sum + section.mixGroups.length, 0)

  if (sections.length === 0) {
    return (
      <div className="border border-white/10 bg-white/5 p-12 text-center italic text-white/30">
        <Layers className="mx-auto mb-4 h-12 w-12 opacity-10" />
        Nincs csoportosítható rendelés.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <p className="text-sm font-medium italic text-white/40">
        Először szállítási mód szerint, azon belül azonos kosár-mix szerint. Így a Foxpost/GLS címkézés és a
        webshop szállítás külön munkafolyamatban kezelhető.
      </p>

      {sections.map((section) => {
        const sectionOrderIds = section.mixGroups.flatMap((group) => group.orderIds)
        const laneStyle =
          section.shippingType === "standard"
            ? "border-white/15 bg-white/5"
            : section.shippingType === "foxpost"
              ? "border-amber-500/30 bg-amber-500/5"
              : "border-blue-500/30 bg-blue-500/5"

        return (
          <section key={section.key} className={cn("border p-4 md:p-5", laneStyle)}>
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center border",
                    section.canAutoLabel
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-white/20 bg-black/40 text-neutral-300"
                  )}
                >
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-wider text-white">{section.label}</h2>
                  <p className="mt-1 text-sm italic text-neutral-400">{section.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest">
                    <span className="border border-white/10 bg-black/40 px-2 py-1 text-white">
                      {section.orderCount} rendelés
                    </span>
                    <span className="border border-white/10 bg-black/40 px-2 py-1 text-white">
                      {section.totalUnits} db
                    </span>
                    <span className="border border-white/10 bg-black/40 px-2 py-1 text-neutral-300">
                      {section.mixGroups.length} mix csoport
                    </span>
                    {section.canAutoLabel ? (
                      <>
                        <span className="border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-emerald-300">
                          {section.hasLabel} címkés
                        </span>
                        <span className="border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-amber-300">
                          {section.needsLabel} címke hiányzik
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-amber-300">
                          {section.needsLabel} címke hiányzik
                        </span>
                        <span className="border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-emerald-300">
                          {section.hasLabel} címkés
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => onSelectGroup(sectionOrderIds)}
                  className="h-9 rounded-none bg-primary px-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-primary/80"
                >
                  <Boxes className="mr-2 h-4 w-4" />
                  Sáv kijelölése
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onNavigate(buildShippingHref(section.shippingType))}
                  className="h-9 rounded-none border-white/10 px-3 text-[10px] font-black uppercase tracking-widest text-neutral-300"
                >
                  Sáv szűrése
                </Button>
                {section.canAutoLabel && parcelManagerEnabled && section.needsLabel > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isGeneratingLabels}
                    onClick={() => void onGenerateLabels(sectionOrderIds)}
                    className="h-9 rounded-none border-amber-500/30 px-3 text-[10px] font-black uppercase tracking-widest text-amber-300 hover:bg-amber-500/10"
                  >
                    {isGeneratingLabels ? (
                      <LoadingSpinner size="xs" className="mr-2" />
                    ) : (
                      <Printer className="mr-2 h-4 w-4" />
                    )}
                    Hiányzó címkék ({section.needsLabel})
                  </Button>
                ) : null}
                {!section.canAutoLabel && section.needsLabel > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isGeneratingLabels}
                    onClick={() => void onGenerateStandardLabels(sectionOrderIds, { skipExisting: true })}
                    className="h-9 rounded-none border-amber-500/30 px-3 text-[10px] font-black uppercase tracking-widest text-amber-300 hover:bg-amber-500/10"
                  >
                    {isGeneratingLabels ? (
                      <LoadingSpinner size="xs" className="mr-2" />
                    ) : (
                      <Printer className="mr-2 h-4 w-4" />
                    )}
                    PDF címkék ({section.needsLabel})
                  </Button>
                ) : null}
                {!section.canAutoLabel && section.hasLabel > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isGeneratingLabels}
                    onClick={() => void onGenerateStandardLabels(sectionOrderIds, { skipExisting: false })}
                    className="h-9 rounded-none border-emerald-500/30 px-3 text-[10px] font-black uppercase tracking-widest text-emerald-300 hover:bg-emerald-500/10"
                  >
                    {isGeneratingLabels ? (
                      <LoadingSpinner size="xs" className="mr-2" />
                    ) : (
                      <RotateCcw className="mr-2 h-4 w-4" />
                    )}
                    PDF újragenerálás ({section.hasLabel})
                  </Button>
                ) : null}
              </div>
            </div>

            {section.mixGroups.length === 0 ? (
              <p className="text-sm italic text-neutral-500">Nincs mix csoport ebben a szállítási sávban.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
                {section.mixGroups.map((group, idx) => (
                  <div key={`${section.key}-${group.key}`} className="flex flex-col border border-white/10 bg-black/30 p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center bg-primary/20 text-[11px] font-black text-primary">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-2xl font-black leading-none text-white">{group.orderCount}</p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500">
                            azonos kosár
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-white">{group.totalUnits} db</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-neutral-600">
                          {group.kinds} tételféle
                        </p>
                      </div>
                    </div>

                    <div className="mb-3 flex-1 space-y-1 border-y border-white/5 py-3">
                      {group.lines.map((line) => (
                        <div key={line.key} className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-neutral-300">{line.label}</span>
                          <span className="font-black text-white">{line.quantity}×</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={() => onSelectGroup(group.orderIds)}
                        className="h-9 flex-1 rounded-none bg-primary px-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-primary/80"
                      >
                        <Boxes className="mr-2 h-4 w-4" /> Mix kijelölése
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onNavigate(buildMixHref(group.key, section.shippingType))}
                        className="h-9 rounded-none border-white/10 px-3 text-[10px] font-black uppercase tracking-widest text-neutral-300"
                      >
                        Szűrés
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )
      })}

      {totalMixGroups === 0 ? null : (
        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600">
          Összesen {sections.length} szállítási sáv · {totalMixGroups} termék-mix csoport
        </p>
      )}
    </div>
  )
}

function AssignView({
  sections,
  orders,
  employeeCount,
  setEmployeeCount,
  buildBatchHref,
  onSelectBatch,
  onNavigate,
}: {
  sections: OrderShippingMixSection[]
  orders: AdminOrderSummary[]
  employeeCount: number
  setEmployeeCount: (count: number) => void
  buildBatchHref: (shippingType: OrderShippingTypeFilter, start: number, end: number) => string
  onSelectBatch: (ids: string[]) => void
  onNavigate: (href: string) => void
}) {
  const assignSections = useMemo(
    () => splitShippingSectionsIntoBatches(sections, orders, employeeCount),
    [sections, orders, employeeCount]
  )
  const totalOrders = orders.length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-white">Párhuzamos munkamegosztás</p>
          <p className="text-[10px] font-bold italic text-neutral-500">
            A {totalOrders} szűrt rendelés szállítási sávonként külön osztva {employeeCount} dolgozóra. Minden
            sávban külön munkafolyamat (webshop manuális / Foxpost / GLS címke).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Dolgozók / sáv</span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEmployeeCount(Math.max(1, employeeCount - 1))}
              className="h-10 w-10 rounded-none border-white/10 text-lg font-black text-white"
            >
              −
            </Button>
            <input
              type="number"
              min={1}
              value={employeeCount}
              onChange={(e) => setEmployeeCount(Math.max(1, Number(e.target.value) || 1))}
              className="h-10 w-16 rounded-none border border-white/10 bg-black text-center text-sm font-black text-white"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setEmployeeCount(employeeCount + 1)}
              className="h-10 w-10 rounded-none border-white/10 text-lg font-black text-white"
            >
              +
            </Button>
          </div>
        </div>
      </div>

      {assignSections.length === 0 ? (
        <div className="border border-white/10 bg-white/5 p-12 text-center italic text-white/30">
          Nincs szétosztható rendelés a jelenlegi szűrővel.
        </div>
      ) : (
        assignSections.map((section) => {
          const laneStyle =
            section.shippingType === "standard"
              ? "border-white/15 bg-white/5"
              : section.shippingType === "foxpost"
                ? "border-amber-500/30 bg-amber-500/5"
                : "border-blue-500/30 bg-blue-500/5"

          return (
            <section key={section.key} className={cn("border p-4 md:p-5", laneStyle)}>
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center border",
                      section.canAutoLabel
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-white/20 bg-black/40 text-neutral-300"
                    )}
                  >
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-wider text-white">{section.label}</h2>
                    <p className="mt-1 text-sm italic text-neutral-400">{section.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest">
                      <span className="border border-white/10 bg-black/40 px-2 py-1 text-white">
                        {section.orderCount} rendelés
                      </span>
                      <span className="border border-white/10 bg-black/40 px-2 py-1 text-white">
                        {section.mixGroups.length} mix csoport
                      </span>
                      <span className="border border-white/10 bg-black/40 px-2 py-1 text-neutral-300">
                        {section.batches.filter((batch) => batch.orderCount > 0).length} aktív csomag
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {section.orderCount === 0 ? (
                <p className="text-sm italic text-neutral-500">Nincs rendelés ebben a sávban.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {section.batches.map((batch) => (
                    <div
                      key={`${section.key}-${batch.index}`}
                      className={cn(
                        "flex flex-col border border-white/10 bg-black/30 p-4",
                        batch.orderCount === 0 && "opacity-40"
                      )}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center bg-primary/20 text-xs font-black text-primary">
                            {batch.index + 1}
                          </span>
                          <p className="text-sm font-black uppercase tracking-widest text-white">
                            {batch.index + 1}. dolgozó
                          </p>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                          #{batch.start + 1}–{batch.end}
                        </span>
                      </div>
                      <div className="mb-4 flex gap-4">
                        <div>
                          <p className="text-2xl font-black leading-none text-white">{batch.orderCount}</p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-neutral-600">rendelés</p>
                        </div>
                        <div>
                          <p className="text-2xl font-black leading-none text-white">{batch.totalUnits}</p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-neutral-600">db összesen</p>
                        </div>
                      </div>
                      <div className="mt-auto flex flex-wrap gap-2">
                        <Button
                          type="button"
                          disabled={batch.orderCount === 0}
                          onClick={() =>
                            onNavigate(buildBatchHref(section.shippingType, batch.start, batch.end))
                          }
                          className="h-9 flex-1 rounded-none bg-primary px-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-primary/80 disabled:opacity-40"
                        >
                          Megnyitás
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={batch.orderCount === 0}
                          onClick={() => onSelectBatch(batch.orderIds)}
                          className="h-9 rounded-none border-white/10 px-3 text-[10px] font-black uppercase tracking-widest text-neutral-300 disabled:opacity-40"
                        >
                          Kijelölés
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )
        })
      )}
    </div>
  )
}
