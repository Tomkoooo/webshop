"use client"
/* eslint-disable react-hooks/set-state-in-effect -- admin panels fetch lists on mount */

import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@wse/core/components/ui/button"
import { Card, CardContent } from "@wse/core/components/ui/card"
import { adminSectionTitle, adminTableHead, adminTableWrap } from "@wse/core/lib/admin-ui"
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
  VOUCHER_STATUS_LABELS,
  type AdminBookingDetail,
  type AdminBookingRow,
  type AdminEvent,
  type AdminGroup,
  type AdminVoucher,
} from "./t-book-api"
import { SendVoucherDialog } from "./SendVoucherDialog"
import {
  formatAttendeeFieldValue,
  type TBookAttendeeFieldDef,
  type TBookBookingAttendee,
} from "../lib/attendee-fields"
import {
  TBookField,
  TBookInput,
  TBookLoading,
  TBookPageHeader,
  tBookPanelClass,
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

function AttendeesSection({
  schema,
  attendees,
  guests,
}: {
  schema: TBookAttendeeFieldDef[]
  attendees: TBookBookingAttendee[]
  guests: number
}) {
  if (!schema.length) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className={adminSectionTitle}>Résztvevők</p>
          <p className="text-sm text-muted-foreground">
            Ehhez az eseményhez nem volt egyedi résztvevői mező — csak a kapcsolattartó adatai
            érkeztek ({guests} fő).
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div>
          <p className={adminSectionTitle}>Résztvevők ({guests} fő)</p>
          <p className="text-xs text-muted-foreground mt-1">
            Minden jegyhez külön résztvevői adat — az eligibilitás ellenőrzéshez.
          </p>
        </div>
        {attendees.length === 0 ? (
          <p className="text-sm text-amber-900">Nincs rögzített résztvevői adat.</p>
        ) : (
          <div className="space-y-4">
            {attendees.map((attendee, index) => (
              <div key={index} className="rounded-lg bg-muted/30 p-3 space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  {index + 1}. résztvevő
                </p>
                <ul className="space-y-1">
                  {schema.map((field) => (
                    <li key={field.key} className="flex justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">{field.label}</span>
                      <span className="text-foreground text-right">
                        {formatAttendeeFieldValue(field, attendee.fields[field.key])}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function VouchersSection({
  bookingId,
  guests,
  customerEmail,
  customerName,
}: {
  bookingId: string
  guests: number
  customerEmail: string
  customerName: string
}) {
  const [vouchers, setVouchers] = useState<AdminVoucher[]>([])
  const [loading, setLoading] = useState(true)
  const [sendAllOpen, setSendAllOpen] = useState(false)
  const [sendVoucher, setSendVoucher] = useState<AdminVoucher | null>(null)

  const reload = useCallback(() => {
    setLoading(true)
    tBookAdminApi<{ vouchers: AdminVoucher[] }>(`vouchers/bookings/${bookingId}`)
      .then((d) => setVouchers(d.vouchers))
      .catch(() => setVouchers([]))
      .finally(() => setLoading(false))
  }, [bookingId])

  useEffect(() => {
    reload()
  }, [reload])

  const checkedIn = vouchers.filter((v) => v.status === "checked_in").length

  if (loading) return null

  return (
    <>
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className={adminSectionTitle}>Belépőjegyek</p>
          {vouchers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Még nincs kiállított jegy (vagy az eseménynél ki van kapcsolva).
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {vouchers.length}/{guests} jegy kiosztva · {checkedIn}/{vouchers.length} beléptetve
              </p>
              <div className="space-y-2">
                {vouchers.map((voucher) => (
                  <div
                    key={voucher.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg bg-muted/30 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <span className="font-medium text-foreground">{voucher.displayName}</span>
                      {voucher.lastSentToEmail ? (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Utoljára: {voucher.lastSentToName} ({voucher.lastSentToEmail})
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <TBookStatusBadge status={voucher.status} labels={VOUCHER_STATUS_LABELS} />
                      {voucher.status !== "void" ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => setSendVoucher(voucher)}
                        >
                          Küldés
                        </Button>
                      ) : null}
                      <Button asChild variant="outline" className="h-8 text-xs">
                        <a href={`${TBOOK_ADMIN_API}/vouchers/${voucher.id}/pdf`}>PDF</a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button asChild variant="outline" className="h-9 text-xs">
                  <a href={`${TBOOK_ADMIN_API}/vouchers/bookings/${bookingId}/pdf`}>
                    Összes jegy PDF
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 text-xs"
                  onClick={() => setSendAllOpen(true)}
                >
                  Jegyek küldése e-mailben
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <SendVoucherDialog
        open={sendAllOpen}
        onOpenChange={setSendAllOpen}
        title="Összes jegy küldése"
        description="A teljes foglalás jegy PDF-je (minden vendég) kerül csatolásra."
        defaultEmail={customerEmail}
        defaultName={customerName}
        bookingId={bookingId}
        onSent={() => {
          toast.success("Jegyek elküldve")
          reload()
        }}
      />

      <SendVoucherDialog
        open={Boolean(sendVoucher)}
        onOpenChange={(open) => {
          if (!open) setSendVoucher(null)
        }}
        title="Egyedi jegy küldése"
        description={sendVoucher ? `${sendVoucher.displayName} — egy oldalas jegy PDF` : undefined}
        defaultEmail={sendVoucher?.lastSentToEmail ?? customerEmail}
        defaultName={sendVoucher?.lastSentToName ?? sendVoucher?.displayName ?? customerName}
        voucherId={sendVoucher?.id}
        onSent={() => {
          toast.success("Jegy elküldve")
          reload()
        }}
      />
    </>
  )
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
      <DialogContent className="sm:max-w-[680px] max-h-[85vh] overflow-y-auto">
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
              <Card>
                <CardContent className="p-4 space-y-1">
                <p className={adminSectionTitle}>Kapcsolattartó</p>
                <p className="text-xs text-muted-foreground">
                  Fizető / szervező — ezzel a személlyel tartják a kapcsolatot (különösen szállás
                  foglalásnál).
                </p>
                <p className="text-foreground font-medium pt-1">{booking.customer.name}</p>
                <p className="text-muted-foreground">{booking.customer.email}</p>
                <p className="text-muted-foreground">{booking.customer.phone}</p>
                {booking.customer.note ? (
                  <p className="text-muted-foreground text-xs pt-1">„{booking.customer.note}”</p>
                ) : null}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 space-y-1">
                <p className={adminSectionTitle}>Esemény</p>
                <p className="text-foreground font-medium">{booking.eventName}</p>
                {booking.groupName ? <p className="text-muted-foreground">{booking.groupName}</p> : null}
                <p className="text-muted-foreground">
                  {booking.guests} fő
                  {booking.hotelName ? ` · ${booking.hotelName} · ${booking.nights} éj` : " · csak jegy"}
                </p>
                </CardContent>
              </Card>
            </div>

            <AttendeesSection
              schema={booking.attendeeFieldSchema ?? []}
              attendees={booking.attendees ?? []}
              guests={booking.guests}
            />

            {(booking.status === "paid" || booking.status === "confirmed") ? (
              <VouchersSection
                bookingId={booking.id}
                guests={booking.guests}
                customerEmail={booking.customer.email}
                customerName={booking.customer.name}
              />
            ) : null}

            {Object.keys(booking.selections ?? {}).length > 0 ? (
              <Card>
                <CardContent className="p-4">
                <p className={`${adminSectionTitle} mb-2`}>Választott opciók</p>
                <ul className="space-y-1">
                  {Object.entries(booking.selections).map(([key, value]) => (
                    <li key={key} className="flex justify-between gap-4">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="text-foreground">
                        {Array.isArray(value)
                          ? value.join(", ")
                          : value === true
                            ? "igen"
                            : String(value)}
                      </span>
                    </li>
                  ))}
                </ul>
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardContent className="p-4">
              <p className={`${adminSectionTitle} mb-2`}>Ár részletezés</p>
              {booking.quote.lines.map((line) => (
                <div key={line.key} className="flex justify-between">
                  <span className="text-muted-foreground">{line.label}</span>
                  <span className="text-foreground">{formatHuf(line.amountHuf)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-border mt-2 pt-2 font-semibold">
                <span>Összesen</span>
                <span>{formatHuf(booking.totalHuf)}</span>
              </div>
              </CardContent>
            </Card>

            {booking.billing ? (
              <Card>
                <CardContent className="p-4 space-y-1">
                <p className={adminSectionTitle}>Számlázási adatok</p>
                <p className="text-foreground">{booking.billing.name}</p>
                <p className="text-muted-foreground">
                  {booking.billing.zip} {booking.billing.city}, {booking.billing.street}
                </p>
                {booking.billing.taxNumber ? (
                  <p className="text-muted-foreground">Adószám: {booking.billing.taxNumber}</p>
                ) : null}
                </CardContent>
              </Card>
            ) : null}

            {booking.invoiceError ? (
              <p className="text-xs text-destructive">Számlázási hiba: {booking.invoiceError}</p>
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
                  className="h-9 text-xs"
                  onClick={() => void issueInvoice()}
                >
                  Számla kiállítása
                </Button>
              ) : null}
              {booking.invoiceStatus === "issued" ? (
                <Button asChild variant="outline" className="h-9 text-xs">
                <a
                  href={`${TBOOK_ADMIN_API}/bookings/${booking.id}/invoice/pdf`}
                >
                  Számla PDF
                </a>
                </Button>
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
            <Button asChild variant="outline" className="h-10">
            <a
              href={`${TBOOK_ADMIN_API}/bookings/export?format=xlsx&${exportQuery}`}
            >
              Excel export
            </a>
            </Button>
            <Button asChild variant="outline" className="h-10">
            <a
              href={`${TBOOK_ADMIN_API}/bookings/export?format=csv&${exportQuery}`}
            >
              CSV export
            </a>
            </Button>
          </>
        }
      />

      <div className={`${tBookPanelClass} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3`}>
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

      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span>
          <strong className="text-foreground">{total}</strong> találat
        </span>
        <span>
          Fizetett bevétel a szűrésben:{" "}
          <strong className="text-foreground">{formatHuf(revenue)}</strong>
        </span>
        <span>
          Vendégek: <strong className="text-foreground">{guests}</strong>
        </span>
        {JSON.stringify(filters) !== JSON.stringify(emptyFilters) ? (
          <button
            type="button"
            className="text-xs font-medium admin-link-accent"
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
        <div className={adminTableWrap}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className={`border-b border-border bg-muted/40 ${adminTableHead}`}>
                <th className="p-3">Kapcsolattartó</th>
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
                  <tr className="border-b border-border/60 hover:bg-muted/40">
                    <td className="p-3">
                      <p className="font-medium text-foreground">{row.customer.name}</p>
                      <p className="text-xs text-muted-foreground">{row.customer.email}</p>
                      {(row.attendees?.length ?? 0) > 0 ? (
                        <p className="text-xs text-muted-foreground">
                          {row.attendees.length} résztvevő adattal
                        </p>
                      ) : null}
                    </td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{row.eventName}</td>
                    <td className="p-3 hidden lg:table-cell text-muted-foreground">
                      {row.hotelName || "—"}
                      {row.hotelName ? (
                        <span className="text-neutral-600"> · {row.nights} éj</span>
                      ) : null}
                    </td>
                    <td className="p-3">{row.guests}</td>
                    <td className="p-3 hidden xl:table-cell text-xs text-muted-foreground max-w-56 truncate">
                      {formatSelections(row.selections ?? {}) || "—"}
                    </td>
                    <td className="p-3 whitespace-nowrap font-semibold text-foreground">
                      {formatHuf(row.totalHuf)}
                    </td>
                    <td className="p-3">
                      <TBookStatusBadge status={row.status} labels={BOOKING_STATUS_LABELS} />
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <TBookStatusBadge status={row.invoiceStatus} labels={INVOICE_STATUS_LABELS} />
                    </td>
                    <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleString("hu-HU")}
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => setDetailId(row.id)}
                        className="text-xs font-medium text-muted-foreground admin-link-accent"
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
            className="h-9 text-xs"
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
            className="h-9 text-xs"
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
