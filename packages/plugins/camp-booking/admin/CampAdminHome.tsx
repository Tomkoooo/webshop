"use client"

import Link from "next/link"
import { useCampDashboard } from "./use-camp-dashboard"
import { CampDashboardView } from "./CampDashboardView"
import { CampAdminPageHeader, CampAdminPrimaryButton } from "./camp-admin-ui"

export function CampAdminHome() {
  const { stats, loading, error } = useCampDashboard()

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <CampAdminPageHeader
        title="Vezérlőpult"
        description="Foglalások, bevétel és kapacitás — ugyanaz a nézet, mint a webshop admin főoldalán, de tábor adatokkal."
        actions={
          <CampAdminPrimaryButton asChild>
            <Link href="/admin/plugins/camp-booking/camps">Táborok kezelése</Link>
          </CampAdminPrimaryButton>
        }
      />

      <CampDashboardView stats={stats} loading={loading} error={error} variant="home" />
    </div>
  )
}
