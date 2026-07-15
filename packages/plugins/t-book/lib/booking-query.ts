/** Pure admin booking filter → Mongo query builder (unit-testable). */

export type TBookBookingFilters = {
  organizationId?: string
  search?: string
  eventId?: string
  groupId?: string
  hotelId?: string
  status?: string
  invoiceStatus?: string
  /** Matches a stored selection value, e.g. optionKey=room_type, optionValue=1-bedroom. */
  optionKey?: string
  optionValue?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}

export const TBOOK_BOOKING_PAGE_SIZE_DEFAULT = 25
export const TBOOK_BOOKING_PAGE_SIZE_MAX = 200

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export function parseBookingFilters(searchParams: URLSearchParams): TBookBookingFilters {
  const read = (key: string) => searchParams.get(key)?.trim() || undefined
  const page = Number(searchParams.get("page") ?? 1)
  const pageSize = Number(searchParams.get("pageSize") ?? TBOOK_BOOKING_PAGE_SIZE_DEFAULT)
  return {
    search: read("search"),
    eventId: read("eventId"),
    groupId: read("groupId"),
    hotelId: read("hotelId"),
    status: read("status"),
    invoiceStatus: read("invoiceStatus"),
    optionKey: read("optionKey"),
    optionValue: read("optionValue"),
    dateFrom: read("dateFrom"),
    dateTo: read("dateTo"),
    page: Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1,
    pageSize:
      Number.isFinite(pageSize) && pageSize >= 1
        ? Math.min(Math.floor(pageSize), TBOOK_BOOKING_PAGE_SIZE_MAX)
        : TBOOK_BOOKING_PAGE_SIZE_DEFAULT,
  }
}

export function buildBookingQuery(filters: TBookBookingFilters): Record<string, unknown> {
  const query: Record<string, unknown> = {}

  if (filters.organizationId) query.organizationId = filters.organizationId
  if (filters.eventId) query.eventId = filters.eventId
  if (filters.groupId) query.groupId = filters.groupId
  if (filters.hotelId) query.hotelId = filters.hotelId
  if (filters.status) query.status = filters.status
  if (filters.invoiceStatus) query.invoiceStatus = filters.invoiceStatus

  if (filters.optionKey && filters.optionValue) {
    // Selections are stored as a plain map; multiselect values are arrays,
    // Mongo equality on arrays matches array elements too.
    query[`selections.${filters.optionKey}`] = filters.optionValue
  }

  const createdAt: Record<string, Date> = {}
  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom)
    if (!Number.isNaN(from.getTime())) createdAt.$gte = from
  }
  if (filters.dateTo) {
    const to = new Date(filters.dateTo)
    if (!Number.isNaN(to.getTime())) {
      to.setHours(23, 59, 59, 999)
      createdAt.$lte = to
    }
  }
  if (Object.keys(createdAt).length > 0) query.createdAt = createdAt

  if (filters.search) {
    const re = new RegExp(escapeRegex(filters.search), "i")
    query.$or = [
      { "customer.name": re },
      { "customer.email": re },
      { "customer.phone": re },
      { eventName: re },
      { hotelName: re },
      { groupName: re },
    ]
  }

  return query
}
