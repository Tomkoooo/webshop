"use client"
/* eslint-disable react-hooks/set-state-in-effect -- admin panels fetch lists on mount */

import { useCallback, useEffect, useState } from "react"
import { campAdminApi, type AdminTicketType } from "./camp-api"
import { CampAdminLoading, CampAdminPrimaryButton } from "./camp-admin-ui"
import { adminSectionTitle } from "@wse/core/lib/admin-ui"
import { TicketTypeDialog } from "./dialogs/TicketTypeDialog"
import { SessionRegistrationsTable } from "./SessionRegistrationsTable"
import { EditSessionDialog } from "./dialogs/EditSessionDialog"
import { Button } from "@wse/core/components/ui/button"

export function SessionDetailAdmin({
  sessionId,
  onBack,
  onSessionUpdated,
}: {
  sessionId: string
  onBack: () => void
  onSessionUpdated?: () => void
}) {
  const [ticketTypes, setTicketTypes] = useState<AdminTicketType[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AdminTicketType | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    campAdminApi<{ ticketTypes: AdminTicketType[] }>(`sessions/${sessionId}/ticket-types`)
      .then((d) => setTicketTypes(d.ticketTypes))
      .finally(() => setLoading(false))
  }, [sessionId])

  useEffect(() => {
    void load()
  }, [load])

  const openNew = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (t: AdminTicketType) => {
    setEditing(t)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-medium text-muted-foreground admin-link-accent"
        >
          ← Turnusok
        </button>
        <EditSessionDialog sessionId={sessionId} onSaved={() => onSessionUpdated?.()}>
          <Button
            type="button"
            variant="outline"
            className="h-9 text-xs"
          >
            Turnus szerkesztése
          </Button>
        </EditSessionDialog>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className={adminSectionTitle}>Régisztrációk</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
            Fizetett jelentkezések ezen a turnuson. Részleteknél a gyerekek adatai.
          </p>
        </div>
        <SessionRegistrationsTable sessionId={sessionId} />
        <CampAdminPrimaryButton asChild>
        <a
          href={`/api/plugins/camp-booking/admin/sessions/${sessionId}/export`}
        >
          Excel export (turnus)
        </a>
        </CampAdminPrimaryButton>
      </section>

      <div>
        <h2 className={adminSectionTitle}>Jegytípusok & kiegészítők</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
          Alap jegy: tábor részvétel (early bird itt állítható). Kiegészítő: pl. laptop bérlés —
          gyerekenként választható a foglalásnál.
        </p>
      </div>
      <CampAdminPrimaryButton type="button" onClick={openNew}>
        + Új jegytípus
      </CampAdminPrimaryButton>

      <TicketTypeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Jegytípus szerkesztése" : "Új jegytípus"}
        initial={editing ?? undefined}
        onSubmit={async (data) => {
          if (editing) {
            await campAdminApi(`ticket-types/${editing.id}`, {
              method: "PUT",
              body: JSON.stringify(data),
            })
          } else {
            await campAdminApi(`sessions/${sessionId}/ticket-types`, {
              method: "POST",
              body: JSON.stringify(data),
            })
          }
          load()
        }}
      />

      {loading ? (
        <CampAdminLoading />
      ) : (
        <ul className="space-y-3">
          {ticketTypes.map((t) => (
            <li
              key={t.id}
              className="rounded-xl bg-card shadow-sm p-4 flex flex-wrap justify-between gap-3"
            >
              <div>
                <p className="text-foreground font-semibold">
                  {t.name}{" "}
                  <span className="text-muted-foreground font-normal text-sm">
                    ({t.kind === "addon" ? "kiegészítő" : "alap"})
                  </span>
                </p>
                <p className="text-muted-foreground text-sm">
                  {t.priceHuf.toLocaleString("hu-HU")} Ft · {t.pricingMode}
                  {!t.isActive ? " · inaktív" : ""}
                </p>
                {t.kind === "base" &&
                (t.earlyBirdEndsAt || /early\s*bird/i.test(t.name)) ? (
                  <p className="text-sky-400 text-xs mt-1">
                    Early bird
                    {t.earlyBirdEndsAt
                      ? `: ${new Date(t.earlyBirdEndsAt).toLocaleString("hu-HU")}`
                      : ""}
                    {t.earlyBirdEndsAt &&
                    new Date(t.earlyBirdEndsAt).getTime() < Date.now() ? (
                      <span className="text-amber-400"> · lejárt</span>
                    ) : t.earlyBirdEndsAt ? (
                      <span className="text-emerald-800"> · aktív</span>
                    ) : null}
                    {t.earlyBirdPriceHuf != null
                      ? ` → ${t.earlyBirdPriceHuf.toLocaleString("hu-HU")} Ft`
                      : t.earlyBirdDiscountPercent != null
                        ? ` → −${t.earlyBirdDiscountPercent}%`
                        : ""}
                  </p>
                ) : null}
                {t.description ? (
                  <p className="text-xs text-neutral-500 mt-1">{t.description}</p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => openEdit(t)}
                className="h-9 text-xs self-start"
              >
                Szerkesztés
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
