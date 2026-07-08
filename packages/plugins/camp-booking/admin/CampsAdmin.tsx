"use client"
/* eslint-disable react-hooks/set-state-in-effect -- admin panels fetch lists on mount */

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  campAdminApi,
  defaultCampPricing,
  type CampPricingSettings,
} from "./camp-api"
import {
  CampAdminLoading,
  CampAdminPageHeader,
  CampAdminPrimaryButton,
} from "./camp-admin-ui"
import { CreateCampDialog } from "./dialogs/CreateCampDialog"
import { EditCampDialog } from "./dialogs/EditCampDialog"
import { SessionsAdmin } from "./SessionsAdmin"
import { Button } from "@wse/core/components/ui/button"

type CampRow = {
  id: string
  title: string
  slug: string
  isPublished: boolean
  pricingSettings?: CampPricingSettings
}

export function CampsAdmin({ path }: { path: string[] }) {
  const [camps, setCamps] = useState<CampRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    campAdminApi<{ camps: CampRow[] }>("camps")
      .then((d) => setCamps(d.camps))
      .catch((e) => setError(e instanceof Error ? e.message : "Hiba"))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const campId = path[0]
  if (campId && path[1] === "sessions") {
    return <SessionsAdmin campId={campId} />
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <CampAdminPageHeader
        title="Táborok"
        description="Táborok, turnusok, jegyárak és exportok."
        actions={
          <CreateCampDialog onCreated={load}>
            <CampAdminPrimaryButton type="button">+ Új tábor</CampAdminPrimaryButton>
          </CreateCampDialog>
        }
      />
      {error ? <p className="text-red-400 text-sm">{error}</p> : null}
      {loading ? (
        <CampAdminLoading />
      ) : camps.length === 0 ? (
        <p className="text-neutral-500 text-sm italic">Még nincs tábor. Hozz létre egyet.</p>
      ) : (
        <ul className="space-y-3">
          {camps.map((c) => {
            const pricing = { ...defaultCampPricing, ...c.pricingSettings }
            const hasDiscounts =
              pricing.multiChildDiscountPercent > 0 || pricing.siblingDiscountPercent > 0
            return (
              <li
                key={c.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/10 rounded-2xl p-5 bg-white/5 hover:border-white/25 transition-colors"
              >
                <div>
                  <p className="font-heading font-black text-white uppercase tracking-wider">
                    {c.title}
                    {!c.isPublished ? (
                      <span className="ml-2 text-[10px] text-neutral-500 font-black">vázlat</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">{c.slug}</p>
                  {hasDiscounts ? (
                    <p className="text-xs text-amber-400 mt-2">
                      Kedvezmények: többgyermekes {pricing.multiChildDiscountPercent}% · testvér{" "}
                      {pricing.siblingDiscountPercent}%
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <EditCampDialog campId={c.id} onSaved={load}>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-none"
                    >
                      Szerkesztés
                    </Button>
                  </EditCampDialog>
                  <Link
                    href={`/admin/plugins/camp-booking/camps/${c.id}/sessions`}
                    className="text-[10px] font-black uppercase tracking-widest admin-link-accent"
                  >
                    Turnusok & árazás →
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
