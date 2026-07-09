"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Users, FileText, BarChart3, ExternalLink } from "lucide-react"
import { pressKitAdminApi, type PressKitSettingsDto } from "./press-api"
import {
  PressAdminKpiCard,
  PressAdminLoading,
  PressAdminPageHeader,
  PressAdminPrimaryButton,
} from "./press-admin-ui"
import { Button } from "@wse/core/components/ui/button"

export function PressKitOverview() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)
  const [settings, setSettings] = useState<PressKitSettingsDto | null>(null)

  useEffect(() => {
    pressKitAdminApi
      .getOverview()
      .then((res) => {
        setStats(res.stats)
        setSettings(res.settings)
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Hiba"))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PressAdminLoading />
  if (error) return <p className="text-destructive">{error}</p>

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PressAdminPageHeader
        title="Sajtó"
        accent="anyagok"
        description="Jelszóval védett sajtóportál, meghívók és megnyitás-statisztika."
        actions={
          <PressAdminPrimaryButton asChild>
            <Link href="/admin/plugins/press-kit/content">Vizuális szerkesztő</Link>
          </PressAdminPrimaryButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PressAdminKpiCard
          title="Aktív kapcsolatok"
          value={String(stats?.contactCount ?? 0)}
          icon={Users}
        />
        <PressAdminKpiCard
          title="Megnyitások (7 nap)"
          value={String(stats?.opensLast7Days ?? 0)}
          icon={BarChart3}
        />
        <PressAdminKpiCard
          title="Állapot"
          value={settings?.isPublished ? "Közzétéve" : "Piszkozat"}
          icon={FileText}
        />
        <PressAdminKpiCard
          title="Belépés mód"
          value={accessModeLabel(settings?.accessMode)}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <PressAdminPrimaryButton asChild>
          <Link href="/admin/plugins/press-kit/content">Vizuális szerkesztő</Link>
        </PressAdminPrimaryButton>
        <Button asChild variant="outline" className="h-11 text-sm font-medium">
          <Link href="/admin/plugins/press-kit/contacts">Kapcsolatok</Link>
        </Button>
        <Button asChild variant="outline" className="h-11 text-sm font-medium">
          <Link href="/admin/plugins/press-kit/stats">Megnyitások</Link>
        </Button>
        <Button asChild variant="outline" className="h-11 text-sm font-medium">
          <Link href="/sajto" target="_blank">
            <ExternalLink className="w-3.5 h-3.5 mr-2 inline" />
            Portál
          </Link>
        </Button>
      </div>
    </div>
  )
}

function accessModeLabel(mode?: string) {
  switch (mode) {
    case "shared_password":
      return "Közös jelszó"
    case "password_per_contact":
      return "Egyedi jelszó"
    case "unique_link":
      return "Egyedi link"
    default:
      return "—"
  }
}
