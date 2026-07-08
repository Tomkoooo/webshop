import type { CampPricingMode } from "../models/CampTicketType"
import type {
  CampChildPriceInput,
  CampOrderTotal,
  CampPricingSettingsInput,
  CampTicketPriceInput,
} from "./pricing-types"

export function calculateCampTotalHuf(
  priceHuf: number,
  pricingMode: CampPricingMode,
  childCount: number
): number {
  const count = Math.max(1, childCount)
  if (pricingMode === "flat") {
    return Math.round(priceHuf)
  }
  return Math.round(priceHuf * count)
}

export function seatsRequiredForBooking(childCount: number): number {
  return Math.max(1, childCount)
}

export function isAddonTicketType(ticket: Pick<CampTicketPriceInput, "kind" | "name">): boolean {
  if (ticket.kind === "addon") return true
  if (ticket.kind === "base") return false
  return isLaptopTicketTypeName(ticket.name)
}

/** @deprecated Use isAddonTicketType */
export function isLaptopTicketTypeName(name: string): boolean {
  return /laptop/i.test(name)
}

function isEarlyBirdTicketName(name: string): boolean {
  return /early\s*bird/i.test(name)
}

function isNormalTicketName(name: string): boolean {
  return /normál/i.test(name)
}

function isEarlyBirdOfferActive<
  T extends { name: string; isActive?: boolean; earlyBirdEndsAt?: Date | string | null },
>(ticket: T, at: Date): boolean {
  if (ticket.isActive === false) return false
  if (!isEarlyBirdTicketName(ticket.name)) return false
  const endsAt = ticket.earlyBirdEndsAt ? new Date(ticket.earlyBirdEndsAt) : null
  if (endsAt && endsAt.getTime() < at.getTime()) return false
  return true
}

/** Hide normál base tickets while an active early bird base ticket exists on the session. */
export function filterStorefrontBaseTickets<
  T extends { name: string; isActive?: boolean; earlyBirdEndsAt?: Date | string | null },
>(tickets: T[], at: Date = new Date()): T[] {
  const hasActiveEarlyBird = tickets.some((t) => isEarlyBirdOfferActive(t, at))
  return tickets.filter((t) => {
    if (isEarlyBirdTicketName(t.name)) {
      const endsAt = t.earlyBirdEndsAt ? new Date(t.earlyBirdEndsAt) : null
      if (endsAt && endsAt.getTime() < at.getTime()) return false
    }
    if (hasActiveEarlyBird && isNormalTicketName(t.name)) return false
    return true
  })
}

export const LAPTOP_ADDON_CHECKOUT_LABEL = "Laptop bérlés, 10 000 Ft/gyerek/turnus"

export function parseChildLastName(child: CampChildPriceInput): string {
  const explicit = child.lastName?.trim()
  if (explicit) return normalizeNameToken(explicit)
  const parts = child.name.trim().split(/\s+/).filter(Boolean)
  if (parts.length < 2) return ""
  // Hungarian order: family name first (e.g. Kovács Bence)
  return normalizeNameToken(parts[0] ?? "")
}

function normalizeNameToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
}

export function hasSiblingPair(children: CampChildPriceInput[]): boolean {
  const counts = new Map<string, number>()
  for (const child of children) {
    const last = parseChildLastName(child)
    if (!last) continue
    counts.set(last, (counts.get(last) ?? 0) + 1)
  }
  return [...counts.values()].some((n) => n >= 2)
}

export function resolveEffectiveUnitPriceHuf(
  ticket: CampTicketPriceInput,
  at: Date = new Date()
): { unitPriceHuf: number; earlyBirdActive: boolean; earlyBirdSavingsPerUnit: number } {
  const base = Math.max(0, Math.round(ticket.priceHuf))
  const endsAt = ticket.earlyBirdEndsAt ? new Date(ticket.earlyBirdEndsAt) : null
  const earlyBirdActive = Boolean(endsAt && endsAt.getTime() >= at.getTime())

  if (!earlyBirdActive) {
    return { unitPriceHuf: base, earlyBirdActive: false, earlyBirdSavingsPerUnit: 0 }
  }

  if (ticket.earlyBirdPriceHuf != null && ticket.earlyBirdPriceHuf >= 0) {
    const unitPriceHuf = Math.round(ticket.earlyBirdPriceHuf)
    return {
      unitPriceHuf,
      earlyBirdActive: true,
      earlyBirdSavingsPerUnit: Math.max(0, base - unitPriceHuf),
    }
  }

  const pct = Math.min(100, Math.max(0, Number(ticket.earlyBirdDiscountPercent ?? 0)))
  if (pct > 0) {
    const unitPriceHuf = Math.round(base * (1 - pct / 100))
    return {
      unitPriceHuf,
      earlyBirdActive: true,
      earlyBirdSavingsPerUnit: Math.max(0, base - unitPriceHuf),
    }
  }

  return { unitPriceHuf: base, earlyBirdActive: false, earlyBirdSavingsPerUnit: 0 }
}

export function resolveFamilyDiscountPercent(
  settings: CampPricingSettingsInput | null | undefined,
  childCount: number,
  children: CampChildPriceInput[]
): number {
  const multiMin = Math.max(2, settings?.multiChildMinCount ?? 2)
  const multiPct = Math.min(100, Math.max(0, settings?.multiChildDiscountPercent ?? 0))
  const siblingPct = Math.min(100, Math.max(0, settings?.siblingDiscountPercent ?? 0))
  const matchSibling = settings?.siblingMatchByLastName !== false

  const multiEligible = childCount >= multiMin && multiPct > 0
  const siblingEligible =
    matchSibling && siblingPct > 0 && hasSiblingPair(children)

  if (siblingEligible && multiEligible) {
    return Math.max(multiPct, siblingPct)
  }
  if (siblingEligible) return siblingPct
  if (multiEligible) return multiPct
  return 0
}

export function calculateAddonTotalHuf(
  addons: Array<{ ticket: CampTicketPriceInput; quantity: number }>
): number {
  let total = 0
  for (const { ticket, quantity } of addons) {
    if (quantity < 1) continue
    const { unitPriceHuf } = resolveEffectiveUnitPriceHuf(ticket)
    if (ticket.pricingMode === "flat") {
      total += unitPriceHuf
    } else {
      total += unitPriceHuf * quantity
    }
  }
  return Math.round(total)
}

export function calculateLaptopAddonHuf(laptopCount: number, unitPriceHuf: number): number {
  return calculateAddonTotalHuf([
    {
      ticket: {
        name: "Laptop",
        priceHuf: unitPriceHuf,
        pricingMode: "per_child",
        kind: "addon",
      },
      quantity: laptopCount,
    },
  ])
}

export function calculateCampOrderTotal(params: {
  ticket: CampTicketPriceInput
  childCount: number
  children: CampChildPriceInput[]
  campSettings?: CampPricingSettingsInput | null
  addons?: Array<{ ticket: CampTicketPriceInput; quantity: number }>
  at?: Date
}): CampOrderTotal {
  const childCount = Math.max(1, params.childCount)
  const at = params.at ?? new Date()
  const { unitPriceHuf, earlyBirdSavingsPerUnit } = resolveEffectiveUnitPriceHuf(
    params.ticket,
    at
  )

  const listUnitSubtotal =
    params.ticket.pricingMode === "flat"
      ? Math.round(params.ticket.priceHuf)
      : Math.round(params.ticket.priceHuf * childCount)
  const campSubtotal = calculateCampTotalHuf(unitPriceHuf, params.ticket.pricingMode, childCount)
  const earlyBirdSavingsHuf =
    params.ticket.pricingMode === "flat"
      ? Math.max(0, listUnitSubtotal - campSubtotal)
      : Math.max(0, earlyBirdSavingsPerUnit * childCount)

  const familyDiscountPercent = resolveFamilyDiscountPercent(
    params.campSettings,
    childCount,
    params.children
  )
  const familyDiscountHuf = Math.round((campSubtotal * familyDiscountPercent) / 100)
  const campAfterFamily = campSubtotal - familyDiscountHuf

  const addonsHuf = calculateAddonTotalHuf(params.addons ?? [])
  const totalHuf = campAfterFamily + addonsHuf

  const lines: CampOrderTotal["lines"] = [
    {
      label: params.ticket.name,
      amountHuf: campSubtotal,
    },
  ]
  if (earlyBirdSavingsHuf > 0) {
    lines.push({ label: "Early bird kedvezmény", amountHuf: -earlyBirdSavingsHuf })
  }
  if (familyDiscountHuf > 0) {
    lines.push({
      label: `Családi / többgyermekes kedvezmény (${familyDiscountPercent}%)`,
      amountHuf: -familyDiscountHuf,
    })
  }
  for (const { ticket, quantity } of params.addons ?? []) {
    if (quantity < 1) continue
    const addonLine = calculateAddonTotalHuf([{ ticket, quantity }])
    lines.push({ label: `${ticket.name} × ${quantity}`, amountHuf: addonLine })
  }

  return {
    campSubtotalHuf: campSubtotal,
    earlyBirdSavingsHuf,
    familyDiscountHuf,
    addonsHuf,
    totalHuf,
    effectiveUnitPriceHuf: unitPriceHuf,
    familyDiscountPercent,
    lines,
  }
}
