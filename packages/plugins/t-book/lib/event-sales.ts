import { eventDateKey } from "./event-schedule"

export type EventSalesFields = {
  salesOpensAt?: Date | string | null
  salesClosesAt?: Date | string | null
}

export type EventSalesState = "on_sale" | "upcoming" | "closed"

export function getEventSalesState(event: EventSalesFields, now = new Date()): EventSalesState {
  const opens = event.salesOpensAt ? new Date(event.salesOpensAt) : null
  const closes = event.salesClosesAt ? new Date(event.salesClosesAt) : null
  if (opens && !Number.isNaN(opens.getTime()) && now < opens) return "upcoming"
  if (closes && !Number.isNaN(closes.getTime()) && now > closes) return "closed"
  return "on_sale"
}

export function formatSalesOpensAt(
  value: Date | string | null | undefined,
  locale: string = "hu"
): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString(locale === "hu" || locale.startsWith("hu") ? "hu-HU" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function assertEventOnSale(event: EventSalesFields, now = new Date()) {
  const state = getEventSalesState(event, now)
  if (state === "upcoming") {
    throw new Error("Ez a jegy még nem vásárolható. Az értékesítés később nyílik.")
  }
  if (state === "closed") {
    throw new Error("Az értékesítés erre a jegyre lezárult.")
  }
}

export type TicketKind = "standard" | "vip" | "table"

export function classifyTicketKind(name: string): TicketKind {
  const n = name.toLowerCase()
  if (n.includes("asztal") || n.includes("table")) return "table"
  if (n.includes("vip")) return "vip"
  return "standard"
}

export function sortPublicTicketEvents<
  T extends {
    name: string
    startDate: string | Date
    salesOpensAt?: Date | string | null
    salesClosesAt?: Date | string | null
  },
>(events: T[]): T[] {
  const rankState: Record<EventSalesState, number> = { on_sale: 0, upcoming: 1, closed: 2 }
  const rankKind: Record<TicketKind, number> = { standard: 0, vip: 1, table: 2 }
  return [...events].sort((a, b) => {
    const stateDiff = rankState[getEventSalesState(a)] - rankState[getEventSalesState(b)]
    if (stateDiff !== 0) return stateDiff
    const kindDiff = rankKind[classifyTicketKind(a.name)] - rankKind[classifyTicketKind(b.name)]
    if (kindDiff !== 0) return kindDiff
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  })
}

/** Storefront listings: only tickets currently purchasable (hides earlybird/normál off-window SKUs). */
export function filterOnSaleTicketEvents<T extends EventSalesFields>(
  events: T[],
  now = new Date()
): T[] {
  return events.filter((event) => getEventSalesState(event, now) === "on_sale")
}

function isEarlybirdName(name: string): boolean {
  return /early\s*bird|earlybird/i.test(name)
}

function isNormalWindowName(name: string): boolean {
  return /normál|normal|regular/i.test(name)
}

/**
 * After filtering to on_sale: if an earlybird SKU is live for the same day + kind,
 * hide the overlapping “normál” SKU so both windows never show together.
 */
export function preferEarlybirdOverNormal<
  T extends {
    name: string
    startDate: string | Date
  },
>(events: T[]): T[] {
  const earlybirdKeys = new Set<string>()
  for (const event of events) {
    if (!isEarlybirdName(event.name)) continue
    const day = eventDateKey(event.startDate)
    earlybirdKeys.add(`${day}:${classifyTicketKind(event.name)}`)
  }
  if (earlybirdKeys.size === 0) return events
  return events.filter((event) => {
    if (!isNormalWindowName(event.name)) return true
    const day = eventDateKey(event.startDate)
    return !earlybirdKeys.has(`${day}:${classifyTicketKind(event.name)}`)
  })
}

/** Sörfeszt storefront: on-sale only, and earlybird wins over normál for the same day/kind. */
export function filterSorfesztAvailableTickets<
  T extends {
    name: string
    startDate: string | Date
    salesOpensAt?: Date | string | null
    salesClosesAt?: Date | string | null
  },
>(events: T[], now = new Date()): T[] {
  return preferEarlybirdOverNormal(filterOnSaleTicketEvents(events, now))
}
