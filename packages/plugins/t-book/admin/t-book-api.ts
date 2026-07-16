import type {
  TBookHotelPricing,
  TBookOptionDef,
  TBookPriceQuote,
  TBookSelections,
} from "../lib/pricing-types"
import type { TBookAttendeeFieldDef, TBookBookingAttendee } from "../lib/attendee-fields"
import type { TBookLocation } from "../lib/location"
import type { TBookPriceBasis } from "../lib/vat"
import { formatTBookMoney, DEFAULT_TBOOK_CURRENCY } from "../lib/currency"

export const TBOOK_ADMIN_API = "/api/plugins/t-book/admin"

export type AdminGroup = {
  id: string
  name: string
  description: string
  status: "draft" | "active" | "archived"
  defaultBookingOptions: TBookOptionDef[]
  defaultAttendeeFieldSchema: TBookAttendeeFieldDef[]
  defaultPriceBasis: TBookPriceBasis
  defaultVatPercent: number
  listOnTBookSite: boolean
  listingTitle: string
  listingUrl: string
  listingImage: string
  defaultHeroImage: string
  voucherHeaderImage: string
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
  startTime: string | null
  endTime: string | null
  ticketFeeHuf: number
  ticketFeeMode: "per_person" | "per_booking" | "per_team"
  registrationUnit: "person" | "team"
  playersPerTicket: number
  teamMemberLimit: number | null
  teamMemberFieldSchema: TBookAttendeeFieldDef[]
  ticketPriceBasis: TBookPriceBasis
  ticketVatPercent: number
  currency: string
  capacity: number | null
  heroImage: string
  voucherHeaderImage: string
  vouchersEnabled: boolean
  attendeeFieldSchema: TBookAttendeeFieldDef[]
  attendeeFieldSchemaMode: "extend" | "replace"
  eligibilityPreset: "none" | "custom" | "form_rules"
  eligibilityMinAge: number | null
  eligibilityMaxAge: number | null
  eligibilityAllowedGenders: string[]
  eligibilityBirthDateFieldKey: string | null
  eligibilityGenderFieldKey: string | null
  eligibilityFormRules: {
    logic: "and" | "or"
    rules: Array<{
      id: string
      fieldKey: string
      op: string
      value: string
      message?: string
    }>
  } | null
  pricingRules: Array<{
    id: string
    enabled: boolean
    label: string
    when: "always" | "with_hotel" | "without_hotel" | "with_package"
    action: "set_ticket_fee" | "adjust_ticket" | "adjust_accommodation" | "adjust_total"
    amount: number
    amountMode:
      | "fixed"
      | "per_person"
      | "per_accommodation_guest"
      | "percent_accommodation"
      | "percent_ticket"
  }>
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
  currency: string
  registrationFieldSchema: TBookAttendeeFieldDef[]
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
  attendeeFieldSchema: TBookAttendeeFieldDef[]
  attendees: TBookBookingAttendee[]
  guests: number
  nights: number
  selections: TBookSelections
  totalHuf: number
  currency: string
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

export type { TBookOptionDef, TBookPriceQuote, TBookHotelPricing, TBookSelections, TBookAttendeeFieldDef, TBookBookingAttendee }

export async function tBookAdminApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${TBOOK_ADMIN_API}/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Hiba")
  return data as T
}

export function formatMoney(amount: number, currency: string = DEFAULT_TBOOK_CURRENCY): string {
  return formatTBookMoney(amount, currency)
}

/** @deprecated Use formatMoney(amount, currency) */
export function formatHuf(amount: number): string {
  return formatMoney(amount, DEFAULT_TBOOK_CURRENCY)
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
  pending: "Folyamatban",
  issued: "Kiállítva",
  failed: "Sikertelen",
  reversed: "Sztornózva",
}

export const VOUCHER_STATUS_LABELS: Record<string, string> = {
  active: "Aktív",
  checked_in: "Beléptetve",
  void: "Érvénytelen",
}

export const VOUCHER_SCAN_RESULT_LABELS: Record<string, string> = {
  valid: "Elfogadva",
  duplicate: "Már beléptetve — elutasítva",
  invalid: "Érvénytelen — elutasítva",
  wrong_event: "Más esemény — elutasítva",
}

export type AdminVoucher = {
  id: string
  token: string
  status: string
  displayName: string
  attendeeIndex: number
  attendeeFields: Record<string, string | number>
  bookingId: string
  eventSnapshot?: {
    name: string
    startDate: string
    endDate: string
    locationAddress: string
  }
  emailedAt: string | null
  lastSentToEmail: string | null
  lastSentToName: string | null
  checkedInAt: string | null
  checkedInByUserId?: string | null
  createdAt?: string
  updatedAt?: string
  bookingCustomer?: { name?: string; email?: string; phone?: string }
  bookingStatus?: string
}

export type VoucherScanResult = {
  ok: boolean
  result: "valid" | "duplicate" | "invalid" | "wrong_event"
  message?: string
  voucher?: AdminVoucher
}

export const TBOOK_STATUS_LABELS: Record<string, string> = {
  draft: "Vázlat",
  active: "Aktív",
  archived: "Archivált",
}
