/**
 * Client-safe helpers for the admin orders workspace.
 *
 * Turns raw order snapshots into lightweight summaries (no base64 label blobs),
 * computes product-mix signatures for packaging grouping, applies data-type aware
 * "smart" filters, sorts, and splits batches for parallel employee processing.
 */
import { formatOrderNumberLabel } from "@wse/core/lib/order-number"
import { totalsBreakdownForOrderSnapshot } from "@wse/core/lib/pricing"
import {
  getOrderShippingTypeLabel,
  getOrderShippingLabelError,
  orderHasAnyShippingLabel,
  orderIsGeneratingShippingLabel,
  orderNeedsAnyShippingLabel,
  type OrderShippingTypeFilter,
} from "@wse/core/lib/parcel-locker"
import { getOrderDeliveryLocationHint } from "@wse/core/lib/parcel-locker-checkout-display"

export type AdminOrderItemSummary = {
  productId?: string
  name: string
  variantLabel?: string
  quantity: number
  price: number
}

export type AdminOrderSummary = {
  id: string
  orderNumber: string
  createdAt: string
  status: string
  customerName: string
  email?: string
  phone?: string
  deliveryHint: string
  items: AdminOrderItemSummary[]
  /** Distinct line items (product variants) on the order. */
  itemKinds: number
  /** Total physical units (sum of quantities). */
  totalUnits: number
  gross: number
  net: number
  vat: number
  discount: number
  invoiceId?: string
  invoiceStatus?: string
  shippingType: OrderShippingTypeFilter
  shippingLabel: string
  hasLabel: boolean
  needsLabel: boolean
  isGeneratingLabel: boolean
  labelError?: string
  billingType?: "personal" | "company"
  mixSignature: string
  mixKey: string
}

export type MixLine = {
  key: string
  label: string
  name: string
  variantLabel?: string
  quantity: number
}

export type OrderMixGroup = {
  key: string
  signature: string
  lines: MixLine[]
  orderIds: string[]
  orderCount: number
  /** Units in a single order of this mix. */
  unitsPerOrder: number
  /** Distinct line items in this mix. */
  kinds: number
  /** Units across every order sharing this mix. */
  totalUnits: number
}

export type OrderShippingMixSection = {
  shippingType: Exclude<OrderShippingTypeFilter, "all">
  key: Exclude<OrderShippingTypeFilter, "all">
  label: string
  description: string
  /** Parcel lanes support automated label generation in admin. */
  canAutoLabel: boolean
  orderCount: number
  totalUnits: number
  needsLabel: number
  hasLabel: number
  mixGroups: OrderMixGroup[]
}

const SHIPPING_MIX_LANE_ORDER: Array<Exclude<OrderShippingTypeFilter, "all">> = [
  "standard",
  "foxpost",
  "gls",
]

const SHIPPING_MIX_LANE_META: Record<
  Exclude<OrderShippingTypeFilter, "all">,
  Pick<OrderShippingMixSection, "label" | "description" | "canAutoLabel">
> = {
  standard: {
    label: "Webshop szállítás",
    description: "PDF szállítási címke generálás — feladó adatok az adminban állíthatók",
    canAutoLabel: false,
  },
  foxpost: {
    label: "Foxpost",
    description: "Automata címke generálás — csomagautomata",
    canAutoLabel: true,
  },
  gls: {
    label: "GLS csomagpont",
    description: "Automata címke generálás — csomagpont",
    canAutoLabel: true,
  },
}

export type WorkspaceSortKey =
  | "newest"
  | "oldest"
  | "units_desc"
  | "units_asc"
  | "kinds_desc"
  | "kinds_asc"
  | "total_desc"
  | "total_asc"
  | "mix"

export const WORKSPACE_SORT_OPTIONS: { value: WorkspaceSortKey; label: string }[] = [
  { value: "newest", label: "Legújabb elöl" },
  { value: "oldest", label: "Legrégebbi elöl" },
  { value: "units_desc", label: "Legtöbb darab" },
  { value: "units_asc", label: "Legkevesebb darab" },
  { value: "kinds_desc", label: "Legtöbb tételféle" },
  { value: "kinds_asc", label: "Legkevesebb tételféle" },
  { value: "total_desc", label: "Legmagasabb összeg" },
  { value: "total_asc", label: "Legalacsonyabb összeg" },
  { value: "mix", label: "Termék-mix szerint" },
]

export type LabelStateFilter = "all" | "needs" | "has" | "generating" | "error" | "none"
export type BillingTypeFilter = "all" | "personal" | "company"

export type WorkspaceFilters = {
  q?: string
  shippingType?: OrderShippingTypeFilter
  unitsMin?: number
  unitsMax?: number
  kindsMin?: number
  kindsMax?: number
  totalMin?: number
  totalMax?: number
  labelState?: LabelStateFilter
  billingType?: BillingTypeFilter
  mix?: string
  sort?: WorkspaceSortKey
}

function slugifyName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function shortHash(input: string): string {
  let hash = 5381
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i)
  }
  return (hash >>> 0).toString(36)
}

type RawOrderItem = {
  product?: unknown
  variantId?: string
  variantLabel?: string
  name?: string
  price?: number
  quantity?: number
  vatPercent?: number
}

function itemLineKey(item: AdminOrderItemSummary): string {
  const base = item.productId || slugifyName(item.name || "")
  const variant = item.variantLabel ? slugifyName(item.variantLabel) : ""
  return variant ? `${base}#${variant}` : base
}

/** Order-independent signature of the product mix (incl. quantities). */
export function computeOrderMix(items: AdminOrderItemSummary[]): {
  signature: string
  key: string
  lines: MixLine[]
} {
  const buckets = new Map<string, MixLine>()
  for (const item of items) {
    const key = itemLineKey(item)
    const existing = buckets.get(key)
    if (existing) {
      existing.quantity += item.quantity
    } else {
      buckets.set(key, {
        key,
        label: item.variantLabel ? `${item.name} (${item.variantLabel})` : item.name,
        name: item.name,
        variantLabel: item.variantLabel,
        quantity: item.quantity,
      })
    }
  }

  const lines = Array.from(buckets.values()).sort((a, b) => a.key.localeCompare(b.key))
  const signature = lines.map((line) => `${line.key}=${line.quantity}`).join("|") || "empty"
  return { signature, key: shortHash(signature), lines }
}

function toItemSummary(item: RawOrderItem): AdminOrderItemSummary {
  return {
    productId:
      item.product != null && typeof item.product !== "object"
        ? String(item.product)
        : item.product && typeof item.product === "object" && "_id" in item.product
          ? String((item.product as { _id?: unknown })._id ?? "")
          : undefined,
    name: item.name || "Ismeretlen termék",
    variantLabel: item.variantLabel || undefined,
    quantity: Number(item.quantity) || 0,
    price: Number(item.price) || 0,
  }
}

type RawOrder = {
  _id: unknown
  createdAt?: unknown
  status?: string
  items?: RawOrderItem[]
  billingInfo?: { name?: string; email?: string; phone?: string; type?: string }
  shippingAddress?: { city?: string }
  glsParcelPoint?: { id?: string; name?: string; contact?: { city?: string } } | null
  foxpostParcelPoint?: { id?: string; name?: string; city?: string } | null
  glsLabel?: { parcelNumber?: string; labelDataBase64?: string; lastError?: string } | null
  foxpostShipment?: { clFoxId?: string; labelDataBase64?: string; lastError?: string } | null
  standardShippingLabel?: { status?: string; labelDataBase64?: string; lastError?: string } | null
  subtotal?: number
  shippingFee?: number
  paymentFee?: number
  total?: number
  discount?: number
  invoiceId?: string
  invoiceStatus?: string
}

function resolveShippingType(order: RawOrder): OrderShippingTypeFilter {
  if (order.glsParcelPoint?.id) return "gls"
  if (order.foxpostParcelPoint?.id) return "foxpost"
  return "standard"
}

function hasParcelLabel(order: RawOrder): boolean {
  return Boolean(
    order.glsLabel?.parcelNumber ||
      order.glsLabel?.labelDataBase64 ||
      order.foxpostShipment?.clFoxId ||
      order.foxpostShipment?.labelDataBase64
  )
}

function hasAnyShippingLabel(order: RawOrder): boolean {
  return hasParcelLabel(order) || orderHasAnyShippingLabel(order)
}

/** Project a raw order snapshot into a lightweight, client-safe summary. */
export function summarizeOrder(order: RawOrder): AdminOrderSummary {
  const rawItems = order.items ?? []
  const items = rawItems.map(toItemSummary)
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0)
  const breakdown = totalsBreakdownForOrderSnapshot({
    items: rawItems.map((item) => ({
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 0,
      vatPercent: item.vatPercent,
    })),
    subtotal: Number(order.subtotal ?? 0),
    shippingFee: Number(order.shippingFee ?? 0),
    paymentFee: Number(order.paymentFee ?? 0),
    total: Number(order.total ?? 0),
  })
  const mix = computeOrderMix(items)
  const billingType =
    order.billingInfo?.type === "company" || order.billingInfo?.type === "personal"
      ? order.billingInfo.type
      : undefined

  return {
    id: String(order._id),
    orderNumber: formatOrderNumberLabel(order._id),
    createdAt: order.createdAt ? new Date(order.createdAt as string).toISOString() : new Date(0).toISOString(),
    status: order.status || "pending",
    customerName: order.billingInfo?.name || order.shippingAddress?.city || "—",
    email: order.billingInfo?.email,
    phone: order.billingInfo?.phone,
    deliveryHint: getOrderDeliveryLocationHint(
      order as Parameters<typeof getOrderDeliveryLocationHint>[0]
    ),
    items,
    itemKinds: items.length,
    totalUnits,
    gross: breakdown.gross,
    net: breakdown.net,
    vat: breakdown.vat,
    discount: Number(order.discount ?? 0),
    invoiceId: order.invoiceId,
    invoiceStatus: order.invoiceStatus,
    shippingType: resolveShippingType(order),
    shippingLabel: getOrderShippingTypeLabel(order),
    hasLabel: hasAnyShippingLabel(order),
    needsLabel: orderNeedsAnyShippingLabel(order),
    isGeneratingLabel: orderIsGeneratingShippingLabel(order),
    labelError: getOrderShippingLabelError(order),
    billingType,
    mixSignature: mix.signature,
    mixKey: mix.key,
  }
}

function inRange(value: number, min?: number, max?: number): boolean {
  if (min != null && value < min) return false
  if (max != null && value > max) return false
  return true
}

/** Apply the in-memory smart filters (numeric ranges, label state, mix, text). */
export function applyWorkspaceFilters(
  orders: AdminOrderSummary[],
  filters: WorkspaceFilters
): AdminOrderSummary[] {
  let result = orders

  const shippingType = filters.shippingType ?? "all"
  if (shippingType !== "all") {
    result = result.filter((order) => order.shippingType === shippingType)
  }

  if (filters.unitsMin != null || filters.unitsMax != null) {
    result = result.filter((order) => inRange(order.totalUnits, filters.unitsMin, filters.unitsMax))
  }
  if (filters.kindsMin != null || filters.kindsMax != null) {
    result = result.filter((order) => inRange(order.itemKinds, filters.kindsMin, filters.kindsMax))
  }
  if (filters.totalMin != null || filters.totalMax != null) {
    result = result.filter((order) => inRange(order.gross, filters.totalMin, filters.totalMax))
  }

  const labelState = filters.labelState ?? "all"
  if (labelState === "needs") {
    result = result.filter((order) => order.needsLabel && !order.isGeneratingLabel)
  } else if (labelState === "has") {
    result = result.filter((order) => order.hasLabel)
  } else if (labelState === "generating") {
    result = result.filter((order) => order.isGeneratingLabel)
  } else if (labelState === "error") {
    result = result.filter((order) => Boolean(order.labelError))
  } else if (labelState === "none") {
    result = result.filter((order) => order.shippingType === "standard")
  }

  const billingType = filters.billingType ?? "all"
  if (billingType !== "all") {
    result = result.filter((order) => order.billingType === billingType)
  }

  if (filters.mix) {
    result = result.filter((order) => order.mixKey === filters.mix)
  }

  const search = String(filters.q || "").trim().toLowerCase()
  if (search) {
    result = result.filter((order) => {
      const haystack = [
        order.orderNumber,
        order.id,
        order.customerName,
        order.email,
        order.phone,
        order.deliveryHint,
        order.invoiceId,
        ...order.items.map((item) => item.name),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return haystack.includes(search)
    })
  }

  return result
}

export function sortWorkspaceOrders(
  orders: AdminOrderSummary[],
  sort: WorkspaceSortKey = "newest"
): AdminOrderSummary[] {
  const copy = [...orders]
  const byNewest = (a: AdminOrderSummary, b: AdminOrderSummary) =>
    b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id)

  switch (sort) {
    case "oldest":
      return copy.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
    case "units_desc":
      return copy.sort((a, b) => b.totalUnits - a.totalUnits || byNewest(a, b))
    case "units_asc":
      return copy.sort((a, b) => a.totalUnits - b.totalUnits || byNewest(a, b))
    case "kinds_desc":
      return copy.sort((a, b) => b.itemKinds - a.itemKinds || byNewest(a, b))
    case "kinds_asc":
      return copy.sort((a, b) => a.itemKinds - b.itemKinds || byNewest(a, b))
    case "total_desc":
      return copy.sort((a, b) => b.gross - a.gross || byNewest(a, b))
    case "total_asc":
      return copy.sort((a, b) => a.gross - b.gross || byNewest(a, b))
    case "mix":
      return copy.sort(
        (a, b) => a.mixSignature.localeCompare(b.mixSignature) || byNewest(a, b)
      )
    case "newest":
    default:
      return copy.sort(byNewest)
  }
}

/** Group orders that share an identical product mix (for batch packaging). */
export function groupOrdersByMix(orders: AdminOrderSummary[]): OrderMixGroup[] {
  const groups = new Map<string, OrderMixGroup>()

  for (const order of orders) {
    const existing = groups.get(order.mixKey)
    if (existing) {
      existing.orderIds.push(order.id)
      existing.orderCount += 1
      existing.totalUnits += order.totalUnits
    } else {
      const { lines } = computeOrderMix(order.items)
      groups.set(order.mixKey, {
        key: order.mixKey,
        signature: order.mixSignature,
        lines,
        orderIds: [order.id],
        orderCount: 1,
        unitsPerOrder: order.totalUnits,
        kinds: order.itemKinds,
        totalUnits: order.totalUnits,
      })
    }
  }

  return Array.from(groups.values()).sort(
    (a, b) => b.orderCount - a.orderCount || b.unitsPerOrder - a.unitsPerOrder
  )
}

/** Product-mix groups nested under shipping lanes (standard / Foxpost / GLS). */
export function groupOrdersByShippingAndMix(
  orders: AdminOrderSummary[]
): OrderShippingMixSection[] {
  const byShipping = new Map<Exclude<OrderShippingTypeFilter, "all">, AdminOrderSummary[]>()

  for (const order of orders) {
    if (order.shippingType === "all") continue
    const bucket = byShipping.get(order.shippingType) ?? []
    bucket.push(order)
    byShipping.set(order.shippingType, bucket)
  }

  return SHIPPING_MIX_LANE_ORDER.filter((shippingType) => byShipping.has(shippingType)).map(
    (shippingType) => {
      const laneOrders = byShipping.get(shippingType) ?? []
      const meta = SHIPPING_MIX_LANE_META[shippingType]
      const mixGroups = groupOrdersByMix(laneOrders)

      return {
        shippingType,
        key: shippingType,
        label: meta.label,
        description: meta.description,
        canAutoLabel: meta.canAutoLabel,
        orderCount: laneOrders.length,
        totalUnits: laneOrders.reduce((sum, order) => sum + order.totalUnits, 0),
        needsLabel: laneOrders.filter((order) => order.needsLabel).length,
        hasLabel: laneOrders.filter((order) => order.hasLabel).length,
        mixGroups,
      }
    }
  )
}

export type WorkspaceBatch = {
  index: number
  start: number
  end: number
  orderIds: string[]
  orderCount: number
  totalUnits: number
}

export type OrderShippingAssignSection = OrderShippingMixSection & {
  batches: WorkspaceBatch[]
}

/** Split each shipping lane into parallel employee batches independently. */
export function splitShippingSectionsIntoBatches(
  sections: OrderShippingMixSection[],
  orders: AdminOrderSummary[],
  employeeCount: number
): OrderShippingAssignSection[] {
  return sections.map((section) => {
    const laneOrders = orders.filter((order) => order.shippingType === section.shippingType)
    return {
      ...section,
      batches: splitIntoBatches(laneOrders, employeeCount),
    }
  })
}

/** Split an ordered id list into N contiguous, near-equal batches for employees. */
export function splitIntoBatches(
  orders: AdminOrderSummary[],
  employeeCount: number
): WorkspaceBatch[] {
  const total = orders.length
  const count = Math.max(1, Math.min(employeeCount, total || 1))
  const base = Math.floor(total / count)
  const remainder = total % count
  const batches: WorkspaceBatch[] = []

  let cursor = 0
  for (let i = 0; i < count; i += 1) {
    const size = base + (i < remainder ? 1 : 0)
    const slice = orders.slice(cursor, cursor + size)
    batches.push({
      index: i,
      start: cursor,
      end: cursor + size,
      orderIds: slice.map((order) => order.id),
      orderCount: slice.length,
      totalUnits: slice.reduce((sum, order) => sum + order.totalUnits, 0),
    })
    cursor += size
  }

  return batches
}

export type WorkspaceStats = {
  totalOrders: number
  totalUnits: number
  totalKinds: number
  needsLabel: number
  hasLabel: number
  mixGroups: number
  shippingLanes: number
  statusCounts: Record<string, number>
}

export function computeWorkspaceStats(
  orders: AdminOrderSummary[],
  mixGroups: OrderMixGroup[],
  shippingMixSections: OrderShippingMixSection[] = []
): WorkspaceStats {
  const statusCounts: Record<string, number> = {}
  let totalUnits = 0
  let needsLabel = 0
  let hasLabel = 0

  for (const order of orders) {
    statusCounts[order.status] = (statusCounts[order.status] ?? 0) + 1
    totalUnits += order.totalUnits
    if (order.needsLabel) needsLabel += 1
    if (order.hasLabel) hasLabel += 1
  }

  return {
    totalOrders: orders.length,
    totalUnits,
    totalKinds: orders.reduce((sum, order) => sum + order.itemKinds, 0),
    needsLabel,
    hasLabel,
    mixGroups: mixGroups.length,
    shippingLanes: shippingMixSections.length,
    statusCounts,
  }
}
