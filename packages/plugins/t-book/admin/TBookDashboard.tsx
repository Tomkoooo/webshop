"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, CalendarDays, Layers, Ticket, Wallet } from "lucide-react"
import { AdminKpiCard } from "@wse/core/components/admin/AdminKpiCard"
import { Button } from "@wse/core/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@wse/core/components/ui/card"
import {
  tBookAdminApi,
  formatMoney,
  BOOKING_STATUS_LABELS,
  type AdminDashboardStats,
} from "./t-book-api"
import { TBookLoading, TBookPageHeader, TBookStatusBadge } from "./t-book-admin-ui"
import { useOrgCurrency } from "./use-org-currency"

export function TBookDashboard() {
  const { currency } = useOrgCurrency()
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    tBookAdminApi<{ stats: AdminDashboardStats }>("dashboard")
      .then((d) => setStats(d.stats))
      .catch((e) => setError(e instanceof Error ? e.message : "Hiba"))
  }, [])

  if (error) return <p className="text-destructive text-sm">{error}</p>
  if (!stats) return <TBookLoading />

  return (
    <div className="flex flex-col gap-6">
      <TBookPageHeader
        title="tBook — Áttekintés"
        description="Események, szállások és foglalások kezelése egy helyen."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminKpiCard
          title="Bevétel"
          value={formatMoney(stats.revenueHuf, currency)}
          subtitle={`${stats.bookingCount} fizetett foglalás`}
          icon={Wallet}
        />
        <AdminKpiCard
          title="Vendégek"
          value={String(stats.guestCount)}
          subtitle={`${stats.pendingCount} függő foglalás`}
          icon={Ticket}
        />
        <AdminKpiCard
          title="Aktív események"
          value={String(stats.eventCount)}
          subtitle={`${stats.upcomingEvents} közelgő`}
          icon={CalendarDays}
        />
        <AdminKpiCard
          title="Eseménycsoportok"
          value={String(stats.groupCount)}
          icon={Layers}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg">Legutóbbi foglalások</CardTitle>
            <CardDescription>Az utolsó beérkező foglalások rövid listája.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/plugins/t-book/bookings">
              Összes foglalás
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {stats.recentBookings.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">Még nincs foglalás.</p>
          ) : (
            <ul className="divide-y divide-border">
              {stats.recentBookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{b.customerName}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {b.eventName}
                      {b.hotelName ? ` · ${b.hotelName}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <TBookStatusBadge status={b.status} labels={BOOKING_STATUS_LABELS} />
                    <span className="whitespace-nowrap text-sm font-semibold text-foreground">
                      {formatMoney(b.totalHuf, currency)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
