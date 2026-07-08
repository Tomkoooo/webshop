"use client"

import Link from "next/link"
import { useCampDashboard } from "./use-camp-dashboard"
import { CampDashboardView } from "./CampDashboardView"

export function CampStatsPanel() {
  const { stats, loading, error } = useCampDashboard()

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <Link
          href="/admin/plugins/camp-booking"
          className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white"
        >
          ← Vezérlőpult
        </Link>
        <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight mt-4 mb-2 uppercase italic text-white leading-[0.9]">
          Statisztikák <span className="admin-headline-accent">Tábor</span>
        </h1>
        <p className="text-white/40 font-medium italic max-w-2xl">
          Részletes mutatók és regisztrációs lista. A webshop /admin/stats oldal csak bolt üzemmódban
          érhető el.
        </p>
      </div>

      <CampDashboardView stats={stats} loading={loading} error={error} variant="stats" />
    </div>
  )
}
