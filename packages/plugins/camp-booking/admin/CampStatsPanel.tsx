"use client"

import Link from "next/link"
import { useCampDashboard } from "./use-camp-dashboard"
import { CampDashboardView } from "./CampDashboardView"
import { CampAdminPageHeader } from "./camp-admin-ui"
import { AdminBackLink } from "@wse/core/components/admin/AdminBackLink"

export function CampStatsPanel() {
  const { stats, loading, error } = useCampDashboard()

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="space-y-4">
        <AdminBackLink href="/admin/plugins/camp-booking">Vezérlőpult</AdminBackLink>
        <CampAdminPageHeader
          title="Statisztikák"
          description="Részletes mutatók és regisztrációs lista. A webshop /admin/stats oldal csak bolt üzemmódban érhető el."
        />
      </div>

      <CampDashboardView stats={stats} loading={loading} error={error} variant="stats" />
    </div>
  )
}
