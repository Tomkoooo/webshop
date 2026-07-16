"use client"
/* eslint-disable react-hooks/set-state-in-effect -- admin panels fetch lists on mount */

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@wse/core/components/ui/button"
import {
  tBookAdminApi,
  formatMoney,
  TBOOK_STATUS_LABELS,
  type AdminEvent,
  type AdminGroup,
} from "./t-book-api"
import {
  TBookField,
  tBookGhostButtonSmClass,
  tBookListRowClass,
  TBookLoading,
  TBookPageHeader,
  TBookPrimaryButton,
  TBookSelect,
  TBookStatusBadge,
} from "./t-book-admin-ui"
import { EventHotelsAdmin } from "./EventHotelsAdmin"
import { EventVouchersAdmin } from "./EventVouchersAdmin"
import { EventFormDialog } from "./EventFormDialog"

export function EventsAdmin({ path }: { path: string[] }) {
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [groups, setGroups] = useState<AdminGroup[]>([])
  const [groupFilter, setGroupFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AdminEvent | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const query = groupFilter ? `events?groupId=${groupFilter}` : "events"
    Promise.all([
      tBookAdminApi<{ events: AdminEvent[] }>(query),
      tBookAdminApi<{ groups: AdminGroup[] }>("groups"),
    ])
      .then(([e, g]) => {
        setEvents(e.events)
        setGroups(g.groups)
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Hiba"))
      .finally(() => setLoading(false))
  }, [groupFilter])

  useEffect(() => {
    void load()
  }, [load])

  if (path[0] && path[1] === "hotels") {
    return <EventHotelsAdmin eventId={path[0]} />
  }

  if (path[0] && path[1] === "vouchers") {
    return <EventVouchersAdmin eventId={path[0]} />
  }

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
    if (!window.confirm(`Biztosan törlöd: ${event.name}? A hozzá tartozó szállások is törlődnek.`))
      return
    try {
      await tBookAdminApi(`events/${event.id}`, { method: "DELETE" })
      toast.success("Esemény törölve")
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hiba")
    }
  }

  const groupName = (id: string | null) => groups.find((g) => g.id === id)?.name ?? ""

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <TBookPageHeader
        title="Események"
        description="Belépőjegy-ár, időtartam, helyszín és szállás konfiguráció eseményenként."
        actions={
          <TBookPrimaryButton
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            + Új esemény
          </TBookPrimaryButton>
        }
      />

      <div className="max-w-xs">
        <TBookField label="Szűrés csoportra">
          <TBookSelect value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
            <option value="">Minden esemény</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </TBookSelect>
        </TBookField>
      </div>

      {loading ? (
        <TBookLoading />
      ) : events.length === 0 ? (
        <p className="text-neutral-500 text-sm">Nincs esemény ebben a nézetben.</p>
      ) : (
        <ul className="space-y-3">
          {events.map((event, index) => (
            <li
              key={event.id}
              className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${tBookListRowClass}`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="font-semibold text-foreground">{event.name}</p>
                  <TBookStatusBadge status={event.status} labels={TBOOK_STATUS_LABELS} />
                  {event.groupId ? (
                    <Link
                      href={`/admin/plugins/t-book/groups/${event.groupId}`}
                      className="text-xs text-amber-800/80 border border-amber-500/20 rounded-full px-2 py-0.5 hover:bg-amber-500/10"
                    >
                      {groupName(event.groupId)}
                    </Link>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {new Date(event.startDate).toLocaleDateString("hu-HU")} –{" "}
                  {new Date(event.endDate).toLocaleDateString("hu-HU")}
                  {event.location?.address ? ` · ${event.location.address}` : ""}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    Jegy:{" "}
                    <span className="text-foreground font-semibold">
                      {formatMoney(event.ticketFeeHuf, event.currency)}
                    </span>
                  {event.ticketPriceBasis === "net" ? " nettó" : " bruttó"}
                  {event.ticketFeeMode === "per_person" ? " / fő" : " / foglalás"}
                  {event.capacity != null ? ` · kapacitás: ${event.capacity} fő` : ""}
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
                {event.groupId ? (
                  <Link
                    href={`/admin/plugins/t-book/groups/${event.groupId}/events/${event.id}`}
                    className={tBookGhostButtonSmClass}
                  >
                    Szerkesztés
                  </Link>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 text-xs"
                    onClick={() => {
                      setEditing(event)
                      setDialogOpen(true)
                    }}
                  >
                    Szerkesztés
                  </Button>
                )}
                <Link
                  href={
                    event.groupId
                      ? `/admin/plugins/t-book/groups/${event.groupId}/hotels`
                      : `/admin/plugins/t-book/events/${event.id}/hotels`
                  }
                  className="text-xs font-medium admin-link-accent"
                >
                  {event.groupId ? "Csoport szállások →" : "Szállások & árazás →"}
                </Link>
                <Link
                  href={`/admin/plugins/t-book/events/${event.id}/vouchers`}
                  className="text-xs font-medium admin-link-accent"
                >
                  Belépőjegyek →
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

      <EventFormDialog
        event={editing}
        groups={groups}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={load}
      />
    </div>
  )
}
