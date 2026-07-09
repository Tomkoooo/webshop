"use client"

import Link from "next/link"
import { format } from "date-fns"
import { hu } from "date-fns/locale"
import {
  TrendingUp,
  Users,
  Calendar,
  Clock,
  Tent,
  BarChart3,
  Mail,
  ArrowRight,
} from "lucide-react"
import type { CampDashboardStats } from "./camp-api"
import { CampAdminLoading, CampKpiCard } from "./camp-admin-ui"
import { adminLinkAccent, adminSectionTitle } from "@wse/core/lib/admin-ui"

type Props = {
  stats: CampDashboardStats | null
  loading: boolean
  error: string | null
  variant: "home" | "stats"
}

export function CampDashboardView({ stats, loading, error, variant }: Props) {
  if (loading) {
    return <CampAdminLoading />
  }

  if (error) {
    return <p className="text-destructive text-sm">{error}</p>
  }

  if (!stats) return null

  const avgPerRegistration =
    stats.registrationCount > 0 ? Math.round(stats.revenueHuf / stats.registrationCount) : 0
  const avgPerChild = stats.childCount > 0 ? Math.round(stats.revenueHuf / stats.childCount) : 0

  const primaryKpis = [
    {
      title: "Bevétel (fizetett)",
      value: `${Math.round(stats.revenueHuf).toLocaleString("hu-HU")} Ft`,
      subtitle: `${stats.registrationCount} foglalás`,
      icon: TrendingUp,
    },
    {
      title: "Gyerekek",
      value: String(stats.childCount),
      subtitle: "Fizetett helyek",
      icon: Users,
    },
    {
      title: "Szabad helyek",
      value: String(stats.spotsLeft),
      subtitle: `${stats.upcomingSessions} közelgő turnus`,
      icon: Calendar,
    },
    {
      title: "Aktív holdok",
      value: String(stats.activeHolds),
      subtitle: "Fizetésre vár",
      icon: Clock,
    },
  ]

  return (
    <div className="space-y-8">
      <div
        className={`grid gap-6 ${variant === "stats" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-4" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"}`}
      >
        {primaryKpis.map((kpi) => (
          <CampKpiCard key={kpi.title} {...kpi} />
        ))}
      </div>

      {variant === "stats" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CampKpiCard
            title="Átlag / foglalás"
            value={`${avgPerRegistration.toLocaleString("hu-HU")} Ft`}
            icon={BarChart3}
          />
          <CampKpiCard
            title="Átlag / gyerek"
            value={`${avgPerChild.toLocaleString("hu-HU")} Ft`}
            icon={BarChart3}
          />
          <CampKpiCard title="Közzétett táborok" value={String(stats.publishedCamps)} icon={Tent} />
          <CampKpiCard
            title="Közzétett turnusok"
            value={String(stats.publishedSessions)}
            icon={Calendar}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-card shadow-sm p-6 min-h-[320px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className={`${adminSectionTitle} flex items-center gap-2`}>
              <span className="w-1.5 h-6 admin-section-marker rounded-full" />
              Legutóbbi regisztrációk
            </h2>
            {variant === "home" ? (
              <Link
                href="/admin/plugins/camp-booking/stats"
                className="text-xs font-medium text-muted-foreground admin-link-accent"
              >
                Részletes statisztikák
              </Link>
            ) : null}
          </div>
          {stats.recentRegistrations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Users className="w-12 h-12 mb-4 opacity-10" />
              <p className="italic text-sm">Még nincs fizetett regisztráció.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {stats.recentRegistrations.map((r, i) => (
                <li
                  key={`${r.paidAt}-${i}`}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">
                      {r.buyerName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {r.campTitle} · {r.sessionLabel} · {r.childCount} gyerek
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(r.paidAt), "yyyy. MM. dd. HH:mm", { locale: hu })}
                    </p>
                  </div>
                  <span className="font-semibold text-foreground text-sm shrink-0 ml-3">
                    {r.totalHuf.toLocaleString("hu-HU")} Ft
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl bg-card shadow-sm p-6 min-h-[320px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className={`${adminSectionTitle} flex items-center gap-2`}>
              <span className="w-1.5 h-6 admin-section-marker rounded-full" />
              {variant === "home" ? "Gyors műveletek" : "Összefoglaló"}
            </h2>
          </div>
          {variant === "home" ? (
            <nav className="space-y-2">
              {[
                { href: "/admin/plugins/camp-booking/camps", label: "Táborok & turnusok kezelése" },
                { href: "/admin/contact", label: "Kapcsolati üzenetek" },
                { href: "/admin/cms", label: "Honlap / CMS szerkesztés" },
                { href: "/admin/emails", label: "Email sablonok" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between p-4 rounded-lg bg-muted/40 hover:bg-muted/60 text-sm font-medium text-foreground transition-colors ${adminLinkAccent}`}
                >
                  {item.label}
                  <ArrowRight className="w-4 h-4 shrink-0 opacity-50" />
                </Link>
              ))}
            </nav>
          ) : (
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                Közzétett táborok: <strong className="text-foreground">{stats.publishedCamps}</strong>
              </p>
              <p>
                Közzétett turnusok:{" "}
                <strong className="text-foreground">{stats.publishedSessions}</strong>
              </p>
              <p className="flex items-center gap-2 pt-4 border-t border-border">
                <Mail className="w-4 h-4 admin-icon-accent" />
                <Link href="/admin/contact" className="admin-link-accent hover:underline">
                  Kapcsolatfelvételi üzenetek megnyitása
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
