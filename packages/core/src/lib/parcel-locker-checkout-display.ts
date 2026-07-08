import type { FoxpostParcelPoint } from "@wse/core/lib/foxpost"
import type { GlsParcelPoint } from "@wse/core/lib/gls"

export type ParcelOrderShippingContact = {
  name: string
  email: string
  phone: string
  comment?: string
}

export type NormalizedOrderShippingAddress = {
  name: string
  country: string
  countryCode: string
  zip: string
  city: string
  street: string
  comment?: string
  email: string
  phone: string
}

/** GLS: order shippingAddress uses the parcel point location; contact stays on name/email/phone. */
export function buildGlsParcelOrderShippingAddress(
  contact: ParcelOrderShippingContact,
  parcel: GlsParcelPoint,
  country: { label: string; code: string }
): NormalizedOrderShippingAddress {
  const zip = parcel.contact?.postalCode?.trim()
  const city = parcel.contact?.city?.trim()
  const street = parcel.contact?.address?.trim()
  if (!zip || !city || !street) {
    throw new Error("A GLS csomagpont címe hiányos. Válasszon másik pontot.")
  }
  return {
    name: contact.name,
    country: country.label,
    countryCode: country.code,
    zip,
    city,
    street,
    comment: contact.comment,
    email: contact.email,
    phone: contact.phone,
  }
}

/**
 * Foxpost: shippingAddress carries the automata address; foxpostParcelPoint.id is the routing code.
 */
export function buildFoxpostParcelOrderShippingAddress(
  contact: ParcelOrderShippingContact,
  parcel: FoxpostParcelPoint,
  country: { label: string; code: string }
): NormalizedOrderShippingAddress {
  const zip = parcel.zip?.trim()
  const city = parcel.city?.trim()
  const street = parcel.address?.trim()
  if (!zip || !city || !street) {
    throw new Error("A Foxpost automata címe hiányos. Válasszon másik automatát.")
  }
  return {
    name: contact.name,
    country: country.label,
    countryCode: country.code,
    zip,
    city,
    street,
    comment: contact.comment,
    email: contact.email,
    phone: contact.phone,
  }
}

export function formatGlsParcelPointLines(point: GlsParcelPoint): string[] {
  const lines: string[] = []
  if (point.name?.trim()) lines.push(point.name.trim())
  const addr = [
    point.contact?.postalCode,
    point.contact?.city,
    point.contact?.address,
  ]
    .filter(Boolean)
    .join(" ")
    .trim()
  if (addr) lines.push(addr)
  return lines
}

export function formatFoxpostParcelPointLines(point: FoxpostParcelPoint): string[] {
  const lines: string[] = []
  if (point.name?.trim()) lines.push(point.name.trim())
  const addr = [point.zip, point.city, point.address].filter(Boolean).join(" ").trim()
  if (addr) lines.push(addr)
  return lines
}

/** Foxpost APT finder returns HTML in `findme` (directions, payment options, etc.). */
export function foxpostParcelPointFindmeHtml(point: FoxpostParcelPoint): string | undefined {
  const html = point.findme?.trim()
  return html || undefined
}

export type OrderParcelDeliveryDisplay = {
  isParcel: boolean
  providerLabel?: string
  title: string
  lines: string[]
  idLine?: string
}

export function getOrderParcelDeliveryDisplay(order: {
  glsParcelPoint?: GlsParcelPoint | null
  foxpostParcelPoint?: FoxpostParcelPoint | null
}): OrderParcelDeliveryDisplay | null {
  if (order.glsParcelPoint?.id) {
    const lines = formatGlsParcelPointLines(order.glsParcelPoint)
    return {
      isParcel: true,
      providerLabel: "GLS csomagpont",
      title: "GLS csomagpont",
      lines,
      idLine: order.glsParcelPoint.id ? `Pont ID: ${order.glsParcelPoint.id}` : undefined,
    }
  }
  if (order.foxpostParcelPoint?.id) {
    const lines = formatFoxpostParcelPointLines(order.foxpostParcelPoint)
    return {
      isParcel: true,
      providerLabel: "Foxpost",
      title: "Foxpost csomagautomata",
      lines,
      idLine: order.foxpostParcelPoint.id
        ? `Automata: ${order.foxpostParcelPoint.id}`
        : undefined,
    }
  }
  return null
}

/** Short location hint for admin order lists (city + point name when parcel). */
export function getOrderDeliveryLocationHint(order: {
  glsParcelPoint?: GlsParcelPoint | null
  foxpostParcelPoint?: FoxpostParcelPoint | null
  shippingAddress?: { city?: string }
}): string {
  const parcel = getOrderParcelDeliveryDisplay(order)
  if (parcel) {
    const city =
      order.glsParcelPoint?.contact?.city?.trim() ||
      order.foxpostParcelPoint?.city?.trim() ||
      ""
    const name =
      order.glsParcelPoint?.name?.trim() || order.foxpostParcelPoint?.name?.trim() || ""
    return [city, name].filter(Boolean).join(" · ") || parcel.providerLabel || "Csomagpont"
  }
  return order.shippingAddress?.city?.trim() || ""
}
