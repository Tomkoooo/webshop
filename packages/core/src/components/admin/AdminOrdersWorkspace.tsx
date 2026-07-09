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
import { AdminOrderStatusBadge } from "@wse/core/components/admin/AdminOrderStatusBadge"
import { AdminOrdersExportLink } from "@wse/core/components/admin/AdminOrdersExportLink"
import { Button } from "@wse/core/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@wse/core/components/ui/card"
import { Checkbox } from "@wse/core/components/ui/checkbox"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import { Tabs, TabsList, TabsTrigger } from "@wse/core/components/ui/tabs"
import { AdminPageScaffold } from "@wse/core/components/admin/AdminPageScaffold"
import { AdminOrdersFilterPanel } from "@wse/core/components/admin/AdminOrdersFilterPanel"
import { ADMIN_ORDER_STATUS_OPTIONS } from "@wse/core/lib/admin-orders-filter-ui"
import {
  adminAlertDanger,
  adminAlertInfo,
  adminCard,
  adminCardPadding,
  adminTableWrap,
} from "@wse/core/lib/admin-ui"
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

const STATUSES = ADMIN_ORDER_STATUS_OPTIONS
type OrderStatusValue = (typeof STATUSES)[number]["value"]

function getStatusLabel(status: string) {
  return STATUSES.find((s) => s.value === status)?.label ?? status
}

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
    <AdminPageScaffold
      title="Rendelések"
      description="Keresés, státusz frissítés és címkekezelés. A csomagoló nézetek csak raktári munkafolyamathoz kellenek."
      className={cn(
        isNavigating && "opacity-60",
        selectedCount > 0 && "pb-28"
      )}
    >
      <AdminOrdersFilterPanel
        draft={draft}
        setDraft={setDraft}
        appliedFilters={filters}
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
        <div className={adminAlertDanger}>
          <span className="font-semibold">Törölt rendelések</span>
          <span className="text-rose-800/80">
            {" "}
            — csak megtekintés és státusz módosítás. Csoportosítás, munkamegosztás és címke műveletek nem érhetők el.
          </span>
        </div>
      )}

      <StatsBar stats={stats} deletedFilter={data.deletedFilter} />

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
        <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80 md:left-[var(--sidebar-width,16rem)]">
          <div className="mx-auto max-w-7xl px-6 py-4">
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
    </AdminPageScaffold>
  )
}

function StatsBar({
  stats,
  deletedFilter,
}: {
  stats: AdminOrdersWorkspaceData["stats"]
  deletedFilter: AdminOrdersWorkspaceData["deletedFilter"]
}) {
  const items: { label: string; value: string | number; tone?: "default" | "warning" | "success" }[] = [
    {
      label: deletedFilter === "deleted" ? "Törölt rendelés" : "Megjelenítve",
      value: stats.totalOrders,
    },
  ]

  if (deletedFilter !== "deleted" && stats.needsLabel > 0) {
    items.push({ label: "Címke hiányzik", value: stats.needsLabel, tone: "warning" })
  }
  if (deletedFilter !== "deleted" && stats.statusCounts.processing) {
    items.push({
      label: "Feldolgozás alatt",
      value: stats.statusCounts.processing,
    })
  }
  if (deletedFilter !== "deleted" && stats.hasLabel > 0) {
    items.push({ label: "Címke kész", value: stats.hasLabel, tone: "success" })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "rounded-lg px-3 py-2 text-sm shadow-sm",
            item.tone === "warning" && "bg-amber-500/10 text-amber-900",
            item.tone === "success" && "bg-emerald-500/10 text-emerald-900",
            !item.tone && "bg-muted/40"
          )}
        >
          <span className="text-muted-foreground">{item.label}: </span>
          <span className="font-semibold tabular-nums">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

function ViewTabs({
  view,
  setView,
  mixCount,
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
    { id: "list", label: "Rendeléslista", icon: Package, hint: `${orderCount} db` },
    ...(isDeletedView
      ? []
      : [
          {
            id: "mix" as const,
            label: "Azonos kosár",
            icon: Layers,
            hint: `${mixCount} csoport`,
          },
          { id: "assign" as const, label: "Felosztás", icon: Users, hint: "csapatnak" },
        ]),
  ]
  return (
    <div className="space-y-2">
      <Tabs value={view} onValueChange={(value) => setView(value as WorkspaceView)}>
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-2 px-4 py-2">
                <Icon className="size-4" />
                {tab.label}
                <span className="text-muted-foreground text-xs">({tab.hint})</span>
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>
      {view === "mix" ? (
        <p className="text-muted-foreground text-sm">
          Ugyanazt a kosár-összetételt tartalmazó rendelések csoportja — tömeges címkezéshez és csomagoláshoz.
        </p>
      ) : null}
      {view === "assign" ? (
        <p className="text-muted-foreground text-sm">
          A szűrt rendelések felosztása dolgozók között párhuzamos feldolgozáshoz.
        </p>
      ) : null}
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
    <div className={cn(adminAlertInfo, "flex flex-col gap-3 md:flex-row md:items-center md:justify-between")}>
      <div className="flex items-start gap-3">
        <Layers className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-semibold">Termék-mix szűrő aktív</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {orderCount} rendelés ebben a mixben
            {shippingType && shippingType !== "all" ? ` · ${shippingType} szállítás` : ""}
            {" · "}mix #{mixKey}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            A státusz és címke állapot szűrők csak ezen a mixen belül érvényesek. Pl. válaszd a „Címke hiányzik”
            opciót, majd kattints a Szűrés gombra.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={onSelectAllFiltered}
          className="h-9 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/80"
        >
          <Boxes className="mr-2 h-4 w-4" />
          Mix összes kijelölése ({orderCount})
        </Button>
        <Button type="button" variant="outline" onClick={onClear} className="h-9">
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
    <div className={cn(adminCard, adminCardPadding, "flex flex-col gap-3 md:flex-row md:items-center md:justify-between")}>
      <p className="text-sm text-muted-foreground">
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
          className="h-9"
        >
          Látható kijelölése ({visibleCount})
        </Button>
        {showScopeButtons ? (
          <Button
            type="button"
            variant="outline"
            onClick={onSelectAllFiltered}
            disabled={allFilteredSelected}
            className="h-9"
          >
            Összes szűrt találat ({filteredCount})
          </Button>
        ) : null}
        {selectedCount > 0 ? (
          <Button type="button" variant="outline" onClick={onClear} className="h-9">
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
    <div className={cn(adminAlertInfo, "flex flex-col gap-3 md:flex-row md:items-center md:justify-between")}>
      <div className="flex items-center gap-3">
        <Users className="size-5 text-primary" />
        <div>
          <p className="text-sm font-semibold">
            Munkacsomag{shippingLabel ? `: ${shippingLabel}` : ""} — rendelések {range.start + 1}–{range.end}
          </p>
          <p className="text-muted-foreground text-xs">
            {count} rendelés ebben a tartományban
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={onSelectBatch}
          className="h-9 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-primary/80"
        >
          Csomag kijelölése
        </Button>
        <Button type="button" variant="outline" onClick={() => onNavigate(clearHref)} className="h-9">
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
        <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {selectedCount}
        </span>
        <span className="text-sm text-foreground">rendelés kijelölve</span>
        <button type="button" onClick={onClear} className="text-muted-foreground hover:text-foreground" aria-label="Kijelölés törlése">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={bulkStatus}
          onChange={(e) => setBulkStatus(e.target.value as OrderStatusValue)}
          disabled={busy}
          className="h-10 rounded-md bg-background px-3 text-sm shadow-sm ring-1 ring-border/60 disabled:opacity-50"
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
          className="h-10 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-primary/80"
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
            className="h-10 text-amber-900 hover:bg-amber-500/10"
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
            className="h-10 text-emerald-800 hover:bg-emerald-500/10"
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
            className="h-10 text-emerald-800 hover:bg-emerald-500/10"
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
            className="h-10"
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
        "flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground",
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
    <div className={adminTableWrap}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] text-left text-sm">
          <thead>
            <tr className="border-0 bg-muted/30">
              <th className="px-4 py-4">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  disabled={orders.length === 0}
                  className="h-4 w-4 rounded-md border-border bg-background accent-primary"
                  aria-label="Összes kijelölése"
                />
              </th>
              <th className="px-4 py-4">
                <SortHeader label="Azonosító / Dátum" ascKey="oldest" descKey="newest" current={sort} onSort={onSort} />
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Vásárló</th>
              <th className="px-4 py-3">
                <SortHeader label="Tételek" ascKey="units_asc" descKey="units_desc" current={sort} onSort={onSort} />
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Szállítás</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Állapot</th>
              <th className="px-4 py-4">
                <SortHeader label="Összeg" ascKey="total_asc" descKey="total_desc" current={sort} onSort={onSort} align="right" />
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Művelet</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr className="border-0">
                <td colSpan={8} className="px-6 py-16 text-center text-muted-foreground">
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
                      "cursor-pointer border-0 transition-colors hover:bg-muted/40",
                      isSelected && "bg-primary/5"
                    )}
                    onClick={() => onOpenOrder(order.id)}
                  >
                    <td className="px-4 py-4 align-top" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggle(order.id)}
                        className="h-4 w-4 rounded-md border-border bg-background accent-primary"
                        aria-label={`${order.orderNumber} kijelölése`}
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="text-sm font-medium">{order.orderNumber}</p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {format(new Date(order.createdAt), "yyyy. MM. dd. HH:mm", { locale: hu })}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="text-sm font-medium">{order.customerName}</p>
                      {order.deliveryHint ? (
                        <p className="text-muted-foreground text-xs">{order.deliveryHint}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 align-top text-sm tabular-nums">
                      {order.totalUnits} db
                      <span className="text-muted-foreground"> · {order.itemKinds} tétel</span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="text-sm">{order.shippingLabel}</p>
                      {order.isGeneratingLabel ? (
                        <p className="text-xs text-blue-600">Címke generálás…</p>
                      ) : order.labelError ? (
                        <p className="line-clamp-1 text-xs text-rose-600" title={order.labelError}>
                          {order.labelError}
                        </p>
                      ) : order.needsLabel ? (
                        <p className="text-xs text-amber-600">Címke hiányzik</p>
                      ) : order.hasLabel ? (
                        <p className="text-xs text-emerald-600">Címke kész</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <AdminOrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      <span className="text-base font-semibold tabular-nums">{formatHuf(order.gross)}</span>
                      {order.discount > 0 && (
                        <p className="mt-0.5 flex items-center justify-end gap-1 text-xs text-primary">
                          <Tag className="size-3" /> kedvezmény
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right align-top" onClick={(e) => e.stopPropagation()}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onOpenOrder(order.id)}
                        className="size-9 text-muted-foreground hover:text-foreground"
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
      <div className="rounded-xl bg-muted/40 p-12 text-center text-muted-foreground shadow-sm">
        <Layers className="mx-auto mb-4 size-12 opacity-10" />
        Nincs csoportosítható rendelés.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        Először szállítási mód szerint, azon belül azonos kosár-mix szerint. Így a Foxpost/GLS címkézés és a
        webshop szállítás külön munkafolyamatban kezelhető.
      </p>

      {sections.map((section) => {
        const sectionOrderIds = section.mixGroups.flatMap((group) => group.orderIds)
        const laneStyle =
          section.shippingType === "standard"
            ? "bg-muted/40"
            : section.shippingType === "foxpost"
              ? "bg-amber-500/5"
              : "bg-blue-500/5"

        return (
          <section key={section.key} className={cn("rounded-xl p-4 shadow-sm md:p-5", laneStyle)}>
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-lg",
                    section.canAutoLabel
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-foreground"
                  )}
                >
                  <Truck className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{section.label}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-md bg-background/80 px-2 py-1 shadow-sm">
                      {section.orderCount} rendelés
                    </span>
                    <span className="rounded-md bg-background/80 px-2 py-1 shadow-sm">
                      {section.totalUnits} db
                    </span>
                    <span className="rounded-md bg-background/80 px-2 py-1 shadow-sm">
                      {section.mixGroups.length} mix csoport
                    </span>
                    {section.canAutoLabel ? (
                      <>
                        <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-emerald-900">
                          {section.hasLabel} címkés
                        </span>
                        <span className="rounded-md bg-amber-500/10 px-2 py-1 text-amber-900">
                          {section.needsLabel} címke hiányzik
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="rounded-md bg-amber-500/10 px-2 py-1 text-amber-900">
                          {section.needsLabel} címke hiányzik
                        </span>
                        <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-emerald-900">
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
                  className="h-9 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/80"
                >
                  <Boxes className="mr-2 h-4 w-4" />
                  Sáv kijelölése
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onNavigate(buildShippingHref(section.shippingType))}
                  className="h-9"
                >
                  Sáv szűrése
                </Button>
                {section.canAutoLabel && parcelManagerEnabled && section.needsLabel > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isGeneratingLabels}
                    onClick={() => void onGenerateLabels(sectionOrderIds)}
                    className="h-9 text-amber-900 hover:bg-amber-500/10"
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
                    className="h-9 text-amber-900 hover:bg-amber-500/10"
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
                    className="h-9 text-emerald-800 hover:bg-emerald-500/10"
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
              <p className="text-sm text-muted-foreground">Nincs mix csoport ebben a szállítási sávban.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
                {section.mixGroups.map((group, idx) => (
                  <div key={`${section.key}-${group.key}`} className="flex flex-col rounded-lg bg-background/60 p-4 shadow-sm">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-md bg-primary/15 text-xs font-semibold text-primary">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-2xl font-semibold leading-none">{group.orderCount}</p>
                          <p className="text-xs text-muted-foreground">azonos kosár</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{group.totalUnits} db</p>
                        <p className="text-xs text-muted-foreground">{group.kinds} tételféle</p>
                      </div>
                    </div>

                    <div className="mb-3 flex-1 space-y-1 border-y border-border/50 py-3">
                      {group.lines.map((line) => (
                        <div key={line.key} className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-foreground">{line.label}</span>
                          <span className="font-semibold text-foreground">{line.quantity}×</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={() => onSelectGroup(group.orderIds)}
                        className="h-9 flex-1 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/80"
                      >
                        <Boxes className="mr-2 h-4 w-4" /> Mix kijelölése
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onNavigate(buildMixHref(group.key, section.shippingType))}
                        className="h-9"
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
        <p className="text-xs text-muted-foreground">
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
      <div className="flex flex-col gap-3 rounded-xl bg-muted/40 p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Párhuzamos munkamegosztás</p>
          <p className="text-sm text-muted-foreground">
            A {totalOrders} szűrt rendelés szállítási sávonként külön osztva {employeeCount} dolgozóra. Minden
            sávban külön munkafolyamat (webshop manuális / Foxpost / GLS címke).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Dolgozók / sáv</span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setEmployeeCount(Math.max(1, employeeCount - 1))}
            >
              −
            </Button>
            <input
              type="number"
              min={1}
              value={employeeCount}
              onChange={(e) => setEmployeeCount(Math.max(1, Number(e.target.value) || 1))}
              className="h-10 w-16 rounded-md bg-background text-center text-sm font-medium shadow-sm ring-1 ring-border/60"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setEmployeeCount(employeeCount + 1)}
            >
              +
            </Button>
          </div>
        </div>
      </div>

      {assignSections.length === 0 ? (
        <div className="rounded-xl bg-muted/40 p-12 text-center text-muted-foreground shadow-sm">
          Nincs szétosztható rendelés a jelenlegi szűrővel.
        </div>
      ) : (
        assignSections.map((section) => {
          const laneStyle =
            section.shippingType === "standard"
              ? "bg-muted/40"
              : section.shippingType === "foxpost"
                ? "bg-amber-500/5"
                : "bg-blue-500/5"

          return (
            <section key={section.key} className={cn("rounded-xl p-4 shadow-sm md:p-5", laneStyle)}>
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-lg",
                      section.canAutoLabel
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-foreground"
                    )}
                  >
                    <Truck className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{section.label}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-md bg-background/80 px-2 py-1 shadow-sm">
                        {section.orderCount} rendelés
                      </span>
                      <span className="rounded-md bg-background/80 px-2 py-1 shadow-sm">
                        {section.mixGroups.length} mix csoport
                      </span>
                      <span className="rounded-md bg-background/80 px-2 py-1 shadow-sm">
                        {section.batches.filter((batch) => batch.orderCount > 0).length} aktív csomag
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {section.orderCount === 0 ? (
                <p className="text-sm text-muted-foreground">Nincs rendelés ebben a sávban.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {section.batches.map((batch) => (
                    <div
                      key={`${section.key}-${batch.index}`}
                      className={cn(
                        "flex flex-col rounded-lg bg-background/60 p-4 shadow-sm",
                        batch.orderCount === 0 && "opacity-40"
                      )}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex size-8 items-center justify-center rounded-md bg-primary/15 text-xs font-semibold text-primary">
                            {batch.index + 1}
                          </span>
                          <p className="text-sm font-medium">{batch.index + 1}. dolgozó</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          #{batch.start + 1}–{batch.end}
                        </span>
                      </div>
                      <div className="mb-4 flex gap-4">
                        <div>
                          <p className="text-2xl font-semibold leading-none">{batch.orderCount}</p>
                          <p className="text-xs text-muted-foreground">rendelés</p>
                        </div>
                        <div>
                          <p className="text-2xl font-semibold leading-none">{batch.totalUnits}</p>
                          <p className="text-xs text-muted-foreground">db összesen</p>
                        </div>
                      </div>
                      <div className="mt-auto flex flex-wrap gap-2">
                        <Button
                          type="button"
                          disabled={batch.orderCount === 0}
                          onClick={() =>
                            onNavigate(buildBatchHref(section.shippingType, batch.start, batch.end))
                          }
                          className="h-9 flex-1 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-40"
                        >
                          Megnyitás
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={batch.orderCount === 0}
                          onClick={() => onSelectBatch(batch.orderIds)}
                          className="h-9 disabled:opacity-40"
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
