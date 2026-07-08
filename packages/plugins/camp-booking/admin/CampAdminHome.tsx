"use client"

import Link from "next/link"
import { useCampDashboard } from "./use-camp-dashboard"
import { CampDashboardView } from "./CampDashboardView"
import { CampAdminPrimaryButton } from "./camp-admin-ui"

export function CampAdminHome() {
  const { stats, loading, error } = useCampDashboard()

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 uppercase italic text-white">
            Vezérlőpult <span className="admin-headline-accent">Tábor</span>
          </h1>
          <p className="text-white/40 font-medium italic max-w-2xl">
            Foglalások, bevétel és kapacitás — ugyanaz a nézet, mint a webshop admin főoldalán, de
            tábor adatokkal.
          </p>
        </div>
        <CampAdminPrimaryButton asChild>
          <Link href="/admin/plugins/camp-booking/camps">Táborok kezelése</Link>
        </CampAdminPrimaryButton>
      </div>

      <CampDashboardView stats={stats} loading={loading} error={error} variant="home" />
    </div>
  )
}
