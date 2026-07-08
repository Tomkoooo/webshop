import type {
  TBookHotelPricing,
  TBookOptionDef,
  TBookPriceQuote,
  TBookSelections,
} from "../lib/pricing-types"
import type { TBookLocation } from "../lib/location"
import type { TBookPriceBasis } from "../lib/vat"

export const TBOOK_ADMIN_API = "/api/plugins/t-book/admin"

export type AdminGroup = {
  id: string
  name: string
  description: string
  status: "draft" | "active" | "archived"
  defaultBookingOptions: TBookOptionDef[]
  defaultPriceBasis: TBookPriceBasis
  defaultVatPercent: number
  apiKeyHint: string
  apiKeyCreatedAt: string
  createdAt: string
}

export type AdminEvent = {
  id: string
  groupId: string | null
  name: string
  description: string
  location: TBookLocation
  startDate: string
  endDate: string
  ticketFeeHuf: number
  ticketFeeMode: "per_person" | "per_booking"
  ticketPriceBasis: TBookPriceBasis
  ticketVatPercent: number
  capacity: number | null
  heroImage: string
  status: "draft" | "active" | "archived"
  sortOrder: number
}

export type AdminHotel = {
  id: string
  groupId: string | null
  eventId: string | null
  name: string
  description: string
  address: string
  distanceFromVenueKm: number | null
  contactEmail: string
  contactPhone: string
  gallery: string[]
  pricing: TBookHotelPricing
  status: "draft" | "active" | "archived"
  sortOrder: number
}

export type AdminBookingRow = {
  id: string
  eventName: string
  groupName: string
  hotelName: string
  customer: { name: string; email: string; phone: string; note: string }
  guests: number
  nights: number
  selections: TBookSelections
  totalHuf: number
  status: string
  invoiceStatus: string
  invoiceId: string | null
  paidAt: string | null
  createdAt: string
}

export type AdminBookingDetail = AdminBookingRow & {
  eventId: string
  hotelId: string | null
  billing: {
    name: string
    zip: string
    city: string
    street: string
    countryCode: string
    taxNumber: string
  } | null
  quote: TBookPriceQuote
  stripeSessionId: string | null
  invoiceError: string | null
}

export type AdminDashboardStats = {
  groupCount: number
  eventCount: number
  upcomingEvents: number
  bookingCount: number
  revenueHuf: number
  guestCount: number
  pendingCount: number
  recentBookings: Array<{
    id: string
    customerName: string
    eventName: string
    hotelName: string
    totalHuf: number
    status: string
    createdAt: string
  }>
}

export type { TBookOptionDef, TBookPriceQuote, TBookHotelPricing, TBookSelections }

export async function tBookAdminApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${TBOOK_ADMIN_API}/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Hiba")
  return data as T
}

export function formatHuf(amount: number): string {
  return `${Math.round(amount).toLocaleString("hu-HU")} Ft`
}

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: "Függőben",
  checkout_started: "Fizetés folyamatban",
  paid: "Fizetve",
  confirmed: "Visszaigazolva",
  cancelled: "Lemondva",
  expired: "Lejárt",
}

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  none: "Nincs",
  issued: "Kiállítva",
  failed: "Sikertelen",
  reversed: "Sztornózva",
}

export const TBOOK_STATUS_LABELS: Record<string, string> = {
  draft: "Vázlat",
  active: "Aktív",
  archived: "Archivált",
}
