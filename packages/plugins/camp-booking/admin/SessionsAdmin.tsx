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
import { CampPricingForm } from "./CampPricingForm"
import { CreateSessionDialog } from "./dialogs/CreateSessionDialog"
import { EditSessionDialog } from "./dialogs/EditSessionDialog"
import { SessionDetailAdmin } from "./SessionDetailAdmin"
import { Button } from "@wse/core/components/ui/button"

type SessionRow = {
  id: string
  label: string
  startDate: string
  endDate: string
  capacity: number
  soldCount: number
  reservedCount: number
  isPublished: boolean
  imageUrl?: string
}

export function SessionsAdmin({ campId }: { campId: string }) {
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [pricing, setPricing] = useState<CampPricingSettings>(defaultCampPricing)
  const [pricingSaving, setPricingSaving] = useState(false)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)

  const loadSessions = useCallback(() => {
    setSessionsLoading(true)
    campAdminApi<{ sessions: SessionRow[] }>(`camps/${campId}/sessions`)
      .then((d) => setSessions(d.sessions))
      .finally(() => setSessionsLoading(false))
  }, [campId])

  const loadCamp = useCallback(() => {
    campAdminApi<{ camp: { pricingSettings?: CampPricingSettings } }>(`camps/${campId}`).then(
      (d) => {
        setPricing({ ...defaultCampPricing, ...d.camp.pricingSettings })
      }
    )
  }, [campId])

  useEffect(() => {
    void loadSessions()
    void loadCamp()
  }, [loadSessions, loadCamp])

  const savePricing = async () => {
    setPricingSaving(true)
    try {
      await campAdminApi(`camps/${campId}`, {
        method: "PUT",
        body: JSON.stringify({ pricingSettings: pricing }),
      })
    } finally {
      setPricingSaving(false)
    }
  }

  if (selectedSession) {
    return (
      <SessionDetailAdmin
        sessionId={selectedSession}
        onBack={() => setSelectedSession(null)}
        onSessionUpdated={loadSessions}
      />
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Link
        href="/admin/plugins/camp-booking/camps"
        className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white"
      >
        ← Táborok
      </Link>
      <CampPricingForm
        settings={pricing}
        onChange={setPricing}
        onSave={() => void savePricing()}
        saving={pricingSaving}
      />
      <CampAdminPageHeader
        title="Turnusok"
        actions={
          <CreateSessionDialog campId={campId} onCreated={loadSessions}>
            <CampAdminPrimaryButton type="button">+ Új turnus</CampAdminPrimaryButton>
          </CreateSessionDialog>
        }
      />
      {sessionsLoading ? (
        <CampAdminLoading />
      ) : sessions.length === 0 ? (
        <p className="text-neutral-500 text-sm italic">Még nincs turnus ebben a táborban.</p>
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="border border-white/10 rounded-2xl p-5 bg-white/5 flex justify-between items-center gap-4 hover:border-white/25 transition-colors"
            >
              <div>
                <p className="font-heading font-black text-white uppercase tracking-wider">
                  {s.label}
                  {!s.isPublished ? (
                      <span className="ml-2 text-[10px] text-neutral-500 font-black">vázlat</span>
                    ) : null}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  {s.soldCount + s.reservedCount}/{s.capacity} foglalt
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <EditSessionDialog sessionId={s.id} initial={s} onSaved={loadSessions}>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-none"
                  >
                    Szerkesztés
                  </Button>
                </EditSessionDialog>
                <button
                  type="button"
                  className="text-[10px] font-black uppercase tracking-widest admin-link-accent"
                  onClick={() => setSelectedSession(s.id)}
                >
                  Jegyek & export →
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
