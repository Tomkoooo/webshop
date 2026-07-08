"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CalendarDays, Layers, Ticket, Wallet } from "lucide-react"
import {
  tBookAdminApi,
  formatHuf,
  BOOKING_STATUS_LABELS,
  type AdminDashboardStats,
} from "./t-book-api"
import {
  TBookKpiCard,
  TBookLoading,
  TBookPageHeader,
  TBookStatusBadge,
} from "./t-book-admin-ui"

export function TBookDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    tBookAdminApi<{ stats: AdminDashboardStats }>("dashboard")
      .then((d) => setStats(d.stats))
      .catch((e) => setError(e instanceof Error ? e.message : "Hiba"))
  }, [])

  if (error) return <p className="text-red-400 text-sm">{error}</p>
  if (!stats) return <TBookLoading />

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <TBookPageHeader
        title="tBook — Áttekintés"
        description="Események, szállások és foglalások kezelése egy helyen."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <TBookKpiCard
          title="Bevétel"
          value={formatHuf(stats.revenueHuf)}
          subtitle={`${stats.bookingCount} fizetett foglalás`}
          icon={Wallet}
        />
        <TBookKpiCard
          title="Vendégek"
          value={String(stats.guestCount)}
          subtitle={`${stats.pendingCount} függő foglalás`}
          icon={Ticket}
        />
        <TBookKpiCard
          title="Aktív események"
          value={String(stats.eventCount)}
          subtitle={`${stats.upcomingEvents} közelgő`}
          icon={CalendarDays}
        />
        <TBookKpiCard
          title="Eseménycsoportok"
          value={String(stats.groupCount)}
          icon={Layers}
        />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Legutóbbi foglalások</h2>
          <Link
            href="/admin/plugins/t-book/bookings"
            className="text-xs font-bold uppercase tracking-widest admin-link-accent"
          >
            Összes foglalás →
          </Link>
        </div>
        {stats.recentBookings.length === 0 ? (
          <p className="text-neutral-500 text-sm">Még nincs foglalás.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {stats.recentBookings.map((b) => (
              <li key={b.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-white font-medium truncate">{b.customerName}</p>
                  <p className="text-xs text-neutral-500 truncate">
                    {b.eventName}
                    {b.hotelName ? ` · ${b.hotelName}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <TBookStatusBadge status={b.status} labels={BOOKING_STATUS_LABELS} />
                  <span className="text-white font-bold whitespace-nowrap">
                    {formatHuf(b.totalHuf)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
