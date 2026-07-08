"use client"
/* eslint-disable react-hooks/set-state-in-effect -- admin panels fetch lists on mount */

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@wse/core/components/ui/button"
import { normalizeHotelPricing } from "../lib/hotel-pricing"
import {
  tBookAdminApi,
  formatHuf,
  TBOOK_STATUS_LABELS,
  type AdminEvent,
  type AdminGroup,
  type AdminHotel,
} from "./t-book-api"
import {
  TBookLoading,
  TBookPageHeader,
  TBookPrimaryButton,
  TBookStatusBadge,
} from "./t-book-admin-ui"
import { TBookGroupSubnav } from "./TBookGroupSubnav"

export function GroupDetailAdmin({ groupId }: { groupId: string }) {
  const [group, setGroup] = useState<AdminGroup | null>(null)
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [hotels, setHotels] = useState<AdminHotel[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      tBookAdminApi<{ group: AdminGroup }>(`groups/${groupId}`),
      tBookAdminApi<{ events: AdminEvent[] }>(`events?groupId=${groupId}`),
      tBookAdminApi<{ hotels: AdminHotel[] }>(`groups/${groupId}/hotels`),
    ])
      .then(([g, e, h]) => {
        setGroup(g.group)
        setEvents(e.events)
        setHotels(
          h.hotels.map((hotel) => ({
            ...hotel,
            pricing: normalizeHotelPricing(hotel.pricing),
          }))
        )
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Hiba"))
      .finally(() => setLoading(false))
  }, [groupId])

  useEffect(() => {
    void load()
  }, [load])

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
  if (!group) {
    return (
      <div className="space-y-4">
        <p className="text-neutral-500">A csoport nem található.</p>
        <Link href="/admin/plugins/t-book/groups" className="text-amber-300 underline text-sm">
          ← Vissza a csoportokhoz
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <TBookGroupSubnav groupId={groupId} groupName={group.name} />

      <TBookPageHeader
        title={group.name}
        description="Szállások a csoport szintjén — minden esemény ugyanazokat a hoteleket és opciókat használja."
        actions={
          <TBookPrimaryButton asChild>
            <Link href={`/admin/plugins/t-book/groups/${groupId}/events/new`}>
              + Új esemény
            </Link>
          </TBookPrimaryButton>
        }
      />

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <TBookStatusBadge status={group.status} labels={TBOOK_STATUS_LABELS} />
          <span className="text-xs text-neutral-500 font-mono">API: {group.apiKeyHint}</span>
        </div>
        {group.description ? (
          <div
            className="prose prose-invert prose-sm max-w-none text-neutral-400"
            dangerouslySetInnerHTML={{ __html: group.description }}
          />
        ) : null}
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">Szállások</h2>
            <p className="text-xs text-neutral-500 mt-1">
              Hotelek, szobatípusok és felár-csoportok — csoport szinten kezelve
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/admin/plugins/t-book/groups/${groupId}/hotels`}
              className="text-xs font-bold uppercase tracking-widest admin-link-accent"
            >
              Összes szállás →
            </Link>
            <TBookPrimaryButton asChild>
              <Link href={`/admin/plugins/t-book/groups/${groupId}/hotels/new`}>+ Szállás</Link>
            </TBookPrimaryButton>
          </div>
        </div>

        {hotels.length === 0 ? (
          <div className="rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 p-6 text-center">
            <p className="text-sm text-neutral-400 mb-3">
              Még nincs szállás. Add hozzá a hoteleket, szobatípusokat és felár-opciókat.
            </p>
            <TBookPrimaryButton asChild>
              <Link href={`/admin/plugins/t-book/groups/${groupId}/hotels/new`}>
                Első szállás hozzáadása
              </Link>
            </TBookPrimaryButton>
          </div>
        ) : (
          <ul className="space-y-2">
            {hotels.slice(0, 4).map((hotel) => {
              const pricing = normalizeHotelPricing(hotel.pricing)
              return (
                <li key={hotel.id}>
                  <Link
                    href={`/admin/plugins/t-book/groups/${groupId}/hotels/${hotel.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:border-white/25 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate">{hotel.name}</p>
                      <p className="text-xs text-neutral-500">
                        {pricing.roomTypes.length} szobatípus · {pricing.addonGroups.length}{" "}
                        felár-csoport
                      </p>
                    </div>
                    <TBookStatusBadge status={hotel.status} labels={TBOOK_STATUS_LABELS} />
                  </Link>
                </li>
              )
            })}
            {hotels.length > 4 ? (
              <li className="text-center pt-1">
                <Link
                  href={`/admin/plugins/t-book/groups/${groupId}/hotels`}
                  className="text-xs text-amber-300 hover:underline"
                >
                  +{hotels.length - 4} további szállás
                </Link>
              </li>
            ) : null}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">Események</h2>
            <p className="text-xs text-neutral-500 mt-1">
              Időpont, helyszín és jegyár — a szállások közösek
            </p>
          </div>
          <TBookPrimaryButton asChild>
            <Link href={`/admin/plugins/t-book/groups/${groupId}/events/new`}>+ Esemény</Link>
          </TBookPrimaryButton>
        </div>

        {events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 p-8 text-center space-y-3">
            <p className="text-neutral-500 text-sm">Még nincs esemény ebben a csoportban.</p>
            <TBookPrimaryButton asChild>
              <Link href={`/admin/plugins/t-book/groups/${groupId}/events/new`}>
                Első esemény létrehozása
              </Link>
            </TBookPrimaryButton>
          </div>
        ) : (
          <ul className="space-y-3">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border border-white/10 rounded-2xl p-5 bg-white/5 hover:border-white/25 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-bold text-white">{event.name}</p>
                    <TBookStatusBadge status={event.status} labels={TBOOK_STATUS_LABELS} />
                  </div>
                  <p className="text-xs text-neutral-500 mt-1.5">
                    {new Date(event.startDate).toLocaleDateString("hu-HU")} –{" "}
                    {new Date(event.endDate).toLocaleDateString("hu-HU")}
                    {event.location?.address ? ` · ${event.location.address}` : ""}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Jegy: <span className="text-white font-bold">{formatHuf(event.ticketFeeHuf)}</span>
                    {event.ticketPriceBasis === "net" ? " nettó" : " bruttó"}
                    {event.ticketFeeMode === "per_person" ? " / fő" : " / foglalás"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Link
                    href={`/admin/plugins/t-book/groups/${groupId}/events/${event.id}/edit`}
                    className="inline-flex h-9 items-center px-3 border border-white/10 rounded-lg text-white text-xs font-bold hover:bg-white/5"
                  >
                    Szerkesztés
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
      </section>
    </div>
  )
}
