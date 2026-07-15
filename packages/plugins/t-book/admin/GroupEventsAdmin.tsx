"use client"
/* eslint-disable react-hooks/set-state-in-effect -- admin panels fetch lists on mount */

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@wse/core/components/ui/button"
import { formatEventSchedule } from "../lib/event-schedule"
import { ticketFeeModeLabel } from "../lib/registration-fields"
import {
  tBookAdminApi,
  formatMoney,
  TBOOK_STATUS_LABELS,
  type AdminEvent,
  type AdminGroup,
} from "./t-book-api"
import {
  tBookGhostButtonSmClass,
  tBookListRowClass,
  TBookLoading,
  TBookPageHeader,
  TBookPrimaryButton,
  TBookStatusBadge,
} from "./t-book-admin-ui"
import { TBookGroupSubnav } from "./TBookGroupSubnav"

export function GroupEventsAdmin({ groupId }: { groupId: string }) {
  const [group, setGroup] = useState<AdminGroup | null>(null)
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      tBookAdminApi<{ group: AdminGroup }>(`groups/${groupId}`),
      tBookAdminApi<{ events: AdminEvent[] }>(`events?groupId=${groupId}`),
    ])
      .then(([g, e]) => {
        setGroup(g.group)
        setEvents(e.events)
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Hiba"))
      .finally(() => setLoading(false))
  }, [groupId])

  useEffect(() => {
    void load()
  }, [load])

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= events.length) return
    const reordered = [...events]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    setEvents(reordered)
    try {
      await tBookAdminApi("events/reorder", {
        method: "POST",
        body: JSON.stringify({ orderedIds: reordered.map((e) => e.id) }),
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hiba")
      load()
    }
  }

  const remove = async (event: AdminEvent) => {
    if (!window.confirm(`Biztosan törlöd: ${event.name}?`)) return
    try {
      await tBookAdminApi(`events/${event.id}`, { method: "DELETE" })
      toast.success("Esemény törölve")
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hiba")
    }
  }

  if (loading) return <TBookLoading />

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <TBookGroupSubnav groupId={groupId} groupName={group?.name} />
      <TBookPageHeader
        title="Események"
        description="Belépőjegy-ár, időpont, helyszín és foglalási adatok eseményenként. A csoport szállásai minden eseménynél elérhetők."
        actions={
          <TBookPrimaryButton asChild>
            <Link href={`/admin/plugins/t-book/groups/${groupId}/events/new`}>+ Új esemény</Link>
          </TBookPrimaryButton>
        }
      />

      {events.length === 0 ? (
        <div className="rounded-xl bg-amber-500/5 p-10 text-center space-y-4 ring-1 ring-inset ring-amber-500/20">
          <p className="text-neutral-300 text-sm">
            Még nincs esemény ehhez a csoporthoz. Itt adod hozzá a jegyeket, időpontot és
            foglalási mezőket.
          </p>
          <TBookPrimaryButton asChild>
            <Link href={`/admin/plugins/t-book/groups/${groupId}/events/new`}>
              Első esemény hozzáadása
            </Link>
          </TBookPrimaryButton>
        </div>
      ) : (
        <ul className="space-y-3">
          {events.map((event, index) => (
            <li
              key={event.id}
              className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${tBookListRowClass}`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="font-semibold text-foreground truncate">{event.name}</p>
                  <TBookStatusBadge status={event.status} labels={TBOOK_STATUS_LABELS} />
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  {formatEventSchedule(
                    event.startDate,
                    event.endDate,
                    event.startTime,
                    event.endTime
                  )}
                  {event.location?.address ? ` · ${event.location.address}` : ""}
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  Jegy: {formatMoney(event.ticketFeeHuf, event.currency)}{" "}
                  {event.ticketPriceBasis === "net" ? "nettó" : "bruttó"} ·{" "}
                  {ticketFeeModeLabel(event.ticketFeeMode, event.registrationUnit ?? "person")}
                  {event.capacity != null
                    ? ` · kapacitás: ${event.capacity} ${event.registrationUnit === "team" ? "csapat" : "fő"}`
                    : ""}
                  {event.attendeeFieldSchema.length > 0
                    ? ` · ${event.attendeeFieldSchema.length} foglalási mező`
                    : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <div className="flex gap-1 mr-1">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 w-9 p-0 text-neutral-400"
                    disabled={index === 0}
                    onClick={() => void move(index, -1)}
                    aria-label="Fel"
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 w-9 p-0 text-neutral-400"
                    disabled={index === events.length - 1}
                    onClick={() => void move(index, 1)}
                    aria-label="Le"
                  >
                    ↓
                  </Button>
                </div>
                <Link
                  href={`/admin/plugins/t-book/groups/${groupId}/events/${event.id}`}
                  className={tBookGhostButtonSmClass}
                >
                  Szerkesztés
                </Link>
                <Link
                  href={`/admin/plugins/t-book/events/${event.id}/vouchers`}
                  className={tBookGhostButtonSmClass}
                >
                  Belépőjegyek
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 border-red-500/30 text-red-300 text-xs font-bold hover:bg-red-500/10"
                  onClick={() => void remove(event)}
                >
                  Törlés
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
