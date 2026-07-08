"use client"
/* eslint-disable react-hooks/set-state-in-effect -- admin panels fetch lists on mount */

import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@wse/core/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@wse/core/components/ui/dialog"
import {
  tBookAdminApi,
  formatHuf,
  BOOKING_STATUS_LABELS,
  INVOICE_STATUS_LABELS,
  TBOOK_ADMIN_API,
  type AdminBookingDetail,
  type AdminBookingRow,
  type AdminEvent,
  type AdminGroup,
} from "./t-book-api"
import {
  TBookField,
  TBookInput,
  TBookLoading,
  TBookPageHeader,
  TBookSelect,
  TBookStatusBadge,
} from "./t-book-admin-ui"

type Facet = { key: string; values: string[] }

type Filters = {
  search: string
  eventId: string
  groupId: string
  status: string
  invoiceStatus: string
  optionKey: string
  optionValue: string
  dateFrom: string
  dateTo: string
}

const emptyFilters: Filters = {
  search: "",
  eventId: "",
  groupId: "",
  status: "",
  invoiceStatus: "",
  optionKey: "",
  optionValue: "",
  dateFrom: "",
  dateTo: "",
}

function filtersToQuery(filters: Filters, page: number): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value)
  }
  params.set("page", String(page))
  return params.toString()
}

function formatSelections(selections: Record<string, unknown>): string {
  return Object.entries(selections)
    .map(([key, value]) => {
      const v = Array.isArray(value) ? value.join(", ") : value === true ? "igen" : String(value)
      return `${key}: ${v}`
    })
    .join(" · ")
}

function BookingDetailDialog({
  bookingId,
  onClose,
  onChanged,
}: {
  bookingId: string | null
  onClose: () => void
  onChanged: () => void
}) {
  const [booking, setBooking] = useState<AdminBookingDetail | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setBooking(null)
    if (!bookingId) return
    tBookAdminApi<{ booking: AdminBookingDetail }>(`bookings/${bookingId}`)
      .then((d) => setBooking(d.booking))
      .catch((e) => toast.error(e instanceof Error ? e.message : "Hiba"))
  }, [bookingId])

  const setStatus = async (status: string) => {
    if (!booking) return
    setBusy(true)
    try {
      await tBookAdminApi(`bookings/${booking.id}/status`, {
        method: "POST",
        body: JSON.stringify({ status }),
      })
      toast.success("Státusz frissítve")
      onChanged()
      const d = await tBookAdminApi<{ booking: AdminBookingDetail }>(`bookings/${booking.id}`)
      setBooking(d.booking)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hiba")
    } finally {
      setBusy(false)
    }
  }

  const issueInvoice = async () => {
    if (!booking) return
    setBusy(true)
    try {
      const result = await tBookAdminApi<{ invoiceStatus: string; invoiceError: string | null }>(
        `bookings/${booking.id}/invoice`,
        { method: "POST" }
      )
      if (result.invoiceStatus === "issued") toast.success("Számla kiállítva")
      else toast.error(result.invoiceError || "Számlázás sikertelen")
      onChanged()
      const d = await tBookAdminApi<{ booking: AdminBookingDetail }>(`bookings/${booking.id}`)
      setBooking(d.booking)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hiba")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={Boolean(bookingId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-black border-white/10 text-white sm:max-w-[680px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Foglalás részletei</DialogTitle>
        </DialogHeader>
        {!booking ? (
          <TBookLoading />
        ) : (
          <div className="space-y-5 py-2 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <TBookStatusBadge status={booking.status} labels={BOOKING_STATUS_LABELS} />
              <TBookStatusBadge status={booking.invoiceStatus} labels={INVOICE_STATUS_LABELS} />
              <code className="text-xs text-neutral-500 ml-auto">{booking.id}</code>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1">
                <p className="text-xs font-bold text-neutral-500 uppercase">Vásárló</p>
                <p className="text-white font-medium">{booking.customer.name}</p>
                <p className="text-neutral-400">{booking.customer.email}</p>
                <p className="text-neutral-400">{booking.customer.phone}</p>
                {booking.customer.note ? (
                  <p className="text-neutral-500 text-xs pt-1">„{booking.customer.note}”</p>
                ) : null}
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1">
                <p className="text-xs font-bold text-neutral-500 uppercase">Esemény</p>
                <p className="text-white font-medium">{booking.eventName}</p>
                {booking.groupName ? <p className="text-neutral-400">{booking.groupName}</p> : null}
                <p className="text-neutral-400">
                  {booking.guests} fő
                  {booking.hotelName ? ` · ${booking.hotelName} · ${booking.nights} éj` : " · csak jegy"}
                </p>
              </div>
            </div>

            {Object.keys(booking.selections ?? {}).length > 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-xs font-bold text-neutral-500 uppercase mb-2">
                  Választott opciók
                </p>
                <ul className="space-y-1">
                  {Object.entries(booking.selections).map(([key, value]) => (
                    <li key={key} className="flex justify-between gap-4">
                      <span className="text-neutral-400">{key}</span>
                      <span className="text-neutral-200">
                        {Array.isArray(value)
                          ? value.join(", ")
                          : value === true
                            ? "igen"
                            : String(value)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs font-bold text-neutral-500 uppercase mb-2">Ár részletezés</p>
              {booking.quote.lines.map((line) => (
                <div key={line.key} className="flex justify-between">
                  <span className="text-neutral-400">{line.label}</span>
                  <span className="text-neutral-200">{formatHuf(line.amountHuf)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-white/10 mt-2 pt-2 font-bold">
                <span>Összesen</span>
                <span>{formatHuf(booking.totalHuf)}</span>
              </div>
            </div>

            {booking.billing ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1">
                <p className="text-xs font-bold text-neutral-500 uppercase">Számlázási adatok</p>
                <p className="text-neutral-200">{booking.billing.name}</p>
                <p className="text-neutral-400">
                  {booking.billing.zip} {booking.billing.city}, {booking.billing.street}
                </p>
                {booking.billing.taxNumber ? (
                  <p className="text-neutral-400">Adószám: {booking.billing.taxNumber}</p>
                ) : null}
              </div>
            ) : null}

            {booking.invoiceError ? (
              <p className="text-xs text-red-300">Számlázási hiba: {booking.invoiceError}</p>
            ) : null}

            <div className="flex flex-wrap gap-2 pt-1">
              {booking.status === "paid" ? (
                <Button
                  type="button"
                  disabled={busy}
                  className="h-9 text-xs font-bold"
                  onClick={() => void setStatus("confirmed")}
                >
                  Visszaigazolás
                </Button>
              ) : null}
              {booking.status === "pending" ? (
                <Button
                  type="button"
                  disabled={busy}
                  className="h-9 text-xs font-bold"
                  onClick={() => void setStatus("confirmed")}
                >
                  Manuális visszaigazolás
                </Button>
              ) : null}
              {["pending", "checkout_started", "paid", "confirmed"].includes(booking.status) ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  className="h-9 border-red-500/30 text-red-300 text-xs font-bold hover:bg-red-500/10"
                  onClick={() => void setStatus("cancelled")}
                >
                  Lemondás
                </Button>
              ) : null}
              {(booking.status === "paid" || booking.status === "confirmed") &&
              booking.invoiceStatus !== "issued" ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  className="h-9 border-white/10 text-white text-xs font-bold"
                  onClick={() => void issueInvoice()}
                >
                  Számla kiállítása
                </Button>
              ) : null}
              {booking.invoiceStatus === "issued" ? (
                <a
                  href={`${TBOOK_ADMIN_API}/bookings/${booking.id}/invoice/pdf`}
                  className="inline-flex items-center h-9 px-4 border border-white/10 rounded-lg text-white text-xs font-bold"
                >
                  Számla PDF
                </a>
              ) : null}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function BookingsAdmin() {
  const [rows, setRows] = useState<AdminBookingRow[]>([])
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [groups, setGroups] = useState<AdminGroup[]>([])
  const [facets, setFacets] = useState<Facet[]>([])
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [revenue, setRevenue] = useState(0)
  const [guests, setGuests] = useState(0)
  const [loading, setLoading] = useState(true)
  const [detailId, setDetailId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      tBookAdminApi<{ events: AdminEvent[] }>("events"),
      tBookAdminApi<{ groups: AdminGroup[] }>("groups"),
      tBookAdminApi<{ facets: Facet[] }>("bookings/facets"),
    ])
      .then(([e, g, f]) => {
        setEvents(e.events)
        setGroups(g.groups)
        setFacets(f.facets)
      })
      .catch(() => undefined)
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    tBookAdminApi<{
      bookings: AdminBookingRow[]
      total: number
      pageSize: number
      filteredRevenueHuf: number
      filteredGuests: number
    }>(`bookings?${filtersToQuery(filters, page)}`)
      .then((d) => {
        setRows(d.bookings)
        setTotal(d.total)
        setPageSize(d.pageSize)
        setRevenue(d.filteredRevenueHuf)
        setGuests(d.filteredGuests)
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Hiba"))
      .finally(() => setLoading(false))
  }, [filters, page])

  useEffect(() => {
    void load()
  }, [load])

  const setFilter = (patch: Partial<Filters>) => {
    setPage(1)
    setFilters((f) => ({ ...f, ...patch }))
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const exportQuery = useMemo(() => filtersToQuery(filters, 1), [filters])
  const optionValues = facets.find((f) => f.key === filters.optionKey)?.values ?? []

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <TBookPageHeader
        title="Foglalások"
        description="Minden foglalás egy helyen — okos szűrők, keresés, export."
        actions={
          <>
            <a
              href={`${TBOOK_ADMIN_API}/bookings/export?format=xlsx&${exportQuery}`}
              className="inline-flex items-center h-10 px-4 border border-white/10 rounded-lg text-white text-sm font-bold hover:border-white/30"
            >
              Excel export
            </a>
            <a
              href={`${TBOOK_ADMIN_API}/bookings/export?format=csv&${exportQuery}`}
              className="inline-flex items-center h-10 px-4 border border-white/10 rounded-lg text-white text-sm font-bold hover:border-white/30"
            >
              CSV export
            </a>
          </>
        }
      />

      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <TBookField label="Keresés (név, email, telefon, esemény)">
          <TBookInput
            value={filters.search}
            onChange={(e) => setFilter({ search: e.target.value })}
            placeholder="Keresés…"
          />
        </TBookField>
        <TBookField label="Esemény">
          <TBookSelect value={filters.eventId} onChange={(e) => setFilter({ eventId: e.target.value })}>
            <option value="">Mind</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))}
          </TBookSelect>
        </TBookField>
        <TBookField label="Csoport">
          <TBookSelect value={filters.groupId} onChange={(e) => setFilter({ groupId: e.target.value })}>
            <option value="">Mind</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </TBookSelect>
        </TBookField>
        <TBookField label="Státusz">
          <TBookSelect value={filters.status} onChange={(e) => setFilter({ status: e.target.value })}>
            <option value="">Mind</option>
            {Object.entries(BOOKING_STATUS_LABELS).map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </TBookSelect>
        </TBookField>
        <TBookField label="Számla státusz">
          <TBookSelect
            value={filters.invoiceStatus}
            onChange={(e) => setFilter({ invoiceStatus: e.target.value })}
          >
            <option value="">Mind</option>
            {Object.entries(INVOICE_STATUS_LABELS).map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </TBookSelect>
        </TBookField>
        <TBookField label="Opció (pl. szobatípus)">
          <TBookSelect
            value={filters.optionKey}
            onChange={(e) => setFilter({ optionKey: e.target.value, optionValue: "" })}
          >
            <option value="">— nincs —</option>
            {facets.map((f) => (
              <option key={f.key} value={f.key}>
                {f.key}
              </option>
            ))}
          </TBookSelect>
        </TBookField>
        {filters.optionKey ? (
          <TBookField label="Opció értéke">
            <TBookSelect
              value={filters.optionValue}
              onChange={(e) => setFilter({ optionValue: e.target.value })}
            >
              <option value="">Mind</option>
              {optionValues.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </TBookSelect>
          </TBookField>
        ) : null}
        <TBookField label="Dátumtól">
          <TBookInput
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilter({ dateFrom: e.target.value })}
          />
        </TBookField>
        <TBookField label="Dátumig">
          <TBookInput
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilter({ dateTo: e.target.value })}
          />
        </TBookField>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-400">
        <span>
          <strong className="text-white">{total}</strong> találat
        </span>
        <span>
          Fizetett bevétel a szűrésben:{" "}
          <strong className="text-white">{formatHuf(revenue)}</strong>
        </span>
        <span>
          Vendégek: <strong className="text-white">{guests}</strong>
        </span>
        {JSON.stringify(filters) !== JSON.stringify(emptyFilters) ? (
          <button
            type="button"
            className="text-xs font-bold uppercase tracking-widest admin-link-accent"
            onClick={() => {
              setFilters(emptyFilters)
              setPage(1)
            }}
          >
            Szűrők törlése
          </button>
        ) : null}
      </div>

      {loading ? (
        <TBookLoading />
      ) : rows.length === 0 ? (
        <p className="text-neutral-500 text-sm">Nincs találat a szűrésre.</p>
      ) : (
        <div className="overflow-x-auto border border-white/10 rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                <th className="p-3">Vásárló</th>
                <th className="p-3 hidden md:table-cell">Esemény</th>
                <th className="p-3 hidden lg:table-cell">Szállás</th>
                <th className="p-3">Fő</th>
                <th className="p-3 hidden xl:table-cell">Opciók</th>
                <th className="p-3">Összeg</th>
                <th className="p-3">Státusz</th>
                <th className="p-3 hidden md:table-cell">Számla</th>
                <th className="p-3 hidden lg:table-cell">Dátum</th>
                <th className="p-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <Fragment key={row.id}>
                  <tr className="border-b border-white/5 hover:bg-white/[0.03] text-neutral-200">
                    <td className="p-3">
                      <p className="font-medium text-white">{row.customer.name}</p>
                      <p className="text-xs text-neutral-500">{row.customer.email}</p>
                    </td>
                    <td className="p-3 hidden md:table-cell text-neutral-400">{row.eventName}</td>
                    <td className="p-3 hidden lg:table-cell text-neutral-400">
                      {row.hotelName || "—"}
                      {row.hotelName ? (
                        <span className="text-neutral-600"> · {row.nights} éj</span>
                      ) : null}
                    </td>
                    <td className="p-3">{row.guests}</td>
                    <td className="p-3 hidden xl:table-cell text-xs text-neutral-500 max-w-56 truncate">
                      {formatSelections(row.selections ?? {}) || "—"}
                    </td>
                    <td className="p-3 whitespace-nowrap font-bold text-white">
                      {formatHuf(row.totalHuf)}
                    </td>
                    <td className="p-3">
                      <TBookStatusBadge status={row.status} labels={BOOKING_STATUS_LABELS} />
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <TBookStatusBadge status={row.invoiceStatus} labels={INVOICE_STATUS_LABELS} />
                    </td>
                    <td className="p-3 hidden lg:table-cell text-xs text-neutral-500 whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleString("hu-HU")}
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => setDetailId(row.id)}
                        className="text-[10px] font-black uppercase tracking-widest admin-link-accent"
                      >
                        Részletek
                      </button>
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-9 border-white/10 text-white text-xs"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Előző
          </Button>
          <span className="text-sm text-neutral-400">
            {page} / {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            className="h-9 border-white/10 text-white text-xs"
            disabled={page >= pageCount}
            onClick={() => setPage((p) => p + 1)}
          >
            Következő →
          </Button>
        </div>
      ) : null}

      <BookingDetailDialog
        bookingId={detailId}
        onClose={() => setDetailId(null)}
        onChanged={load}
      />
    </div>
  )
}
