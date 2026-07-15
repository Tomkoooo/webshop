"use client"
/* eslint-disable react-hooks/set-state-in-effect -- admin panels fetch lists on mount */

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@wse/core/components/ui/button"
import { Card, CardContent } from "@wse/core/components/ui/card"
import { adminSectionTitle, adminTableHead, adminTableWrap } from "@wse/core/lib/admin-ui"
import {
  tBookAdminApi,
  TBOOK_ADMIN_API,
  VOUCHER_STATUS_LABELS,
  type AdminEvent,
  type AdminVoucher,
} from "./t-book-api"
import {
  TBookField,
  tBookGhostButtonClass,
  TBookInput,
  TBookLoading,
  TBookPageHeader,
  TBookSelect,
  TBookStatusBadge,
} from "./t-book-admin-ui"
import { SendVoucherDialog } from "./SendVoucherDialog"

type VoucherStats = { total: number; checkedIn: number; active: number; voided: number }

type VoucherRow = AdminVoucher & {
  bookingCustomer?: { name?: string; email?: string; phone?: string }
  bookingStatus?: string
}

export function EventVouchersAdmin({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<AdminEvent | null>(null)
  const [vouchers, setVouchers] = useState<VoucherRow[]>([])
  const [stats, setStats] = useState<VoucherStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(50)
  const [sendTarget, setSendTarget] = useState<VoucherRow | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({
      eventId,
      page: String(page),
      pageSize: String(pageSize),
    })
    if (statusFilter) params.set("status", statusFilter)
    if (search.trim()) params.set("search", search.trim())

    Promise.all([
      tBookAdminApi<{ event: AdminEvent }>(`events/${eventId}`),
      tBookAdminApi<{
        vouchers: VoucherRow[]
        stats: VoucherStats
        total: number
        pageSize: number
      }>(`vouchers?${params.toString()}`),
    ])
      .then(([eventRes, voucherRes]) => {
        setEvent(eventRes.event)
        setVouchers(voucherRes.vouchers)
        setStats(voucherRes.stats)
        setTotal(voucherRes.total)
        setPageSize(voucherRes.pageSize)
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Hiba"))
      .finally(() => setLoading(false))
  }, [eventId, page, pageSize, search, statusFilter])

  useEffect(() => {
    void load()
  }, [load])

  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  if (loading && !event) return <TBookLoading />

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <TBookPageHeader
        title="Belépőjegyek"
        description={event ? event.name : "Esemény jegyei és beléptetési állapot"}
        actions={
          <Link
            href="/admin/plugins/t-book/events"
            className={tBookGhostButtonClass}
          >
            ← Események
          </Link>
        }
      />

      {stats ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Összes jegy</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Beléptetve</p>
              <p className="text-2xl font-bold text-emerald-800">{stats.checkedIn}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Aktív (még nem beléptetve)</p>
              <p className="text-2xl font-bold text-amber-900">{stats.active}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Érvénytelen</p>
              <p className="text-2xl font-bold text-rose-800">{stats.voided}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
        <TBookField label="Keresés" className="flex-1 max-w-md">
          <TBookInput
            value={search}
            onChange={(e) => {
              setPage(1)
              setSearch(e.target.value)
            }}
            placeholder="Név, e-mail, jegykód…"
          />
        </TBookField>
        <TBookField label="Státusz" className="w-full max-w-xs">
          <TBookSelect
            value={statusFilter}
            onChange={(e) => {
              setPage(1)
              setStatusFilter(e.target.value)
            }}
          >
            <option value="">Mind</option>
            <option value="active">Aktív</option>
            <option value="checked_in">Beléptetve</option>
            <option value="void">Érvénytelen</option>
          </TBookSelect>
        </TBookField>
      </div>

      {loading ? (
        <TBookLoading />
      ) : vouchers.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nincs jegy ehhez az eseményhez.</p>
      ) : (
        <div className={adminTableWrap}>
          <table className="w-full text-sm">
            <thead>
              <tr className={adminTableHead}>
                <th className="text-left p-3">Résztvevő</th>
                <th className="text-left p-3">Státusz</th>
                <th className="text-left p-3 hidden lg:table-cell">Foglalás / kapcsolat</th>
                <th className="text-left p-3 hidden xl:table-cell">Küldés</th>
                <th className="text-left p-3 hidden md:table-cell">Beléptetés</th>
                <th className="text-right p-3">Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((voucher) => (
                <tr key={voucher.id} className="border-t border-border/40">
                  <td className="p-3 align-top">
                    <p className="font-medium text-foreground">{voucher.displayName}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Jegykód: {voucher.token.slice(0, 8).toUpperCase()}
                    </p>
                    {Object.keys(voucher.attendeeFields ?? {}).length > 0 ? (
                      <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                        {Object.entries(voucher.attendeeFields).map(([key, value]) => (
                          <li key={key}>
                            {key}: {String(value)}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </td>
                  <td className="p-3 align-top">
                    <TBookStatusBadge status={voucher.status} labels={VOUCHER_STATUS_LABELS} />
                  </td>
                  <td className="p-3 align-top hidden lg:table-cell">
                    <p className="text-foreground">…{voucher.bookingId.slice(-8).toUpperCase()}</p>
                    {voucher.bookingCustomer ? (
                      <>
                        <p className="text-muted-foreground">{voucher.bookingCustomer.name}</p>
                        <p className="text-muted-foreground">{voucher.bookingCustomer.email}</p>
                      </>
                    ) : null}
                  </td>
                  <td className="p-3 align-top hidden xl:table-cell text-muted-foreground">
                    {voucher.lastSentToEmail ? (
                      <>
                        <p>{voucher.lastSentToName ?? "—"}</p>
                        <p>{voucher.lastSentToEmail}</p>
                        {voucher.emailedAt ? (
                          <p className="text-xs mt-1">
                            {new Date(voucher.emailedAt).toLocaleString("hu-HU")}
                          </p>
                        ) : null}
                      </>
                    ) : (
                      <span>—</span>
                    )}
                  </td>
                  <td className="p-3 align-top hidden md:table-cell text-muted-foreground">
                    {voucher.checkedInAt ? (
                      new Date(voucher.checkedInAt).toLocaleString("hu-HU")
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3 align-top text-right">
                    <div className="flex flex-col items-end gap-2">
                      <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                        <a href={`${TBOOK_ADMIN_API}/vouchers/${voucher.id}/pdf`}>PDF</a>
                      </Button>
                      {voucher.status !== "void" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => setSendTarget(voucher)}
                        >
                          Küldés
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 ? (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {total} jegy · {page}. oldal / {pageCount}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Előző
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= pageCount}
              onClick={() => setPage((p) => p + 1)}
            >
              Következő
            </Button>
          </div>
        </div>
      ) : null}

      <SendVoucherDialog
        open={Boolean(sendTarget)}
        onOpenChange={(open) => {
          if (!open) setSendTarget(null)
        }}
        title="Jegy küldése e-mailben"
        description={
          sendTarget
            ? `${sendTarget.displayName} — egyedi jegy PDF csatolmány`
            : undefined
        }
        defaultEmail={sendTarget?.lastSentToEmail ?? sendTarget?.bookingCustomer?.email}
        defaultName={sendTarget?.lastSentToName ?? sendTarget?.displayName}
        voucherId={sendTarget?.id}
        onSent={() => {
          toast.success("Jegy elküldve")
          load()
        }}
      />
    </div>
  )
}
