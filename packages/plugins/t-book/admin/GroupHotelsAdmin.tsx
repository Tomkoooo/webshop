"use client"
/* eslint-disable react-hooks/set-state-in-effect -- admin panels fetch lists on mount */

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@wse/core/components/ui/dialog"
import { Button } from "@wse/core/components/ui/button"
import { normalizeHotelPricing } from "../lib/hotel-pricing"
import {
  tBookAdminApi,
  TBOOK_STATUS_LABELS,
  type AdminGroup,
  type AdminHotel,
} from "./t-book-api"
import {
  TBookLoading,
  TBookPageHeader,
  TBookPrimaryButton,
  TBookStatusBadge,
} from "./t-book-admin-ui"
import { HotelComplexitySummary } from "./HotelComplexitySummary"
import { TBookGroupSubnav } from "./TBookGroupSubnav"

function ApiKeyRevealDialog({
  apiKey,
  onClose,
}: {
  apiKey: string | null
  onClose: () => void
}) {
  return (
    <Dialog open={Boolean(apiKey)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-black border-white/10 text-white sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>API kulcs — mentsd el most</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-amber-300">
            A csoport létrehozásakor kapott kulcs csak most látható teljes egészében.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm break-all">
              {apiKey}
            </code>
            <Button
              type="button"
              variant="outline"
              className="border-white/10 text-white shrink-0"
              onClick={() => {
                if (apiKey) void navigator.clipboard.writeText(apiKey)
                toast.success("Kulcs vágólapra másolva")
              }}
            >
              Másolás
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function GroupHotelsAdmin({ groupId }: { groupId: string }) {
  const [group, setGroup] = useState<AdminGroup | null>(null)
  const [hotels, setHotels] = useState<AdminHotel[]>([])
  const [loading, setLoading] = useState(true)
  const [revealedKey, setRevealedKey] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      tBookAdminApi<{ group: AdminGroup }>(`groups/${groupId}`),
      tBookAdminApi<{ hotels: AdminHotel[] }>(`groups/${groupId}/hotels`),
    ])
      .then(([g, h]) => {
        setGroup(g.group)
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
    const stored = sessionStorage.getItem(`tbook_api_key_${groupId}`)
    if (stored) {
      setRevealedKey(stored)
      sessionStorage.removeItem(`tbook_api_key_${groupId}`)
    }
  }, [load, groupId])

  const remove = async (hotel: AdminHotel) => {
    if (!window.confirm(`Biztosan törlöd: ${hotel.name}?`)) return
    try {
      await tBookAdminApi(`hotels/${hotel.id}`, { method: "DELETE" })
      toast.success("Szállás törölve")
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
        title="Szállások"
        description="A csoport összes eseménye ugyanazokat a szállásokat használja. Minden szálláshoz szobatípusok és felár-csoportok tartoznak."
        actions={
          <TBookPrimaryButton asChild>
            <Link href={`/admin/plugins/t-book/groups/${groupId}/hotels/new`}>
              + Új szállás
            </Link>
          </TBookPrimaryButton>
        }
      />

      {hotels.length > 0 ? (
        <HotelComplexitySummary
          hotels={hotels.map((h) => ({ name: h.name, pricing: h.pricing }))}
        />
      ) : null}

      {hotels.length === 0 ? (
        <div className="rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 p-10 text-center space-y-4">
          <p className="text-neutral-300 text-sm">
            Még nincs szállás ehhez a csoporthoz. Itt adod hozzá a hoteleket — szobatípusokkal és
            felár-opciókkal.
          </p>
          <TBookPrimaryButton asChild>
            <Link href={`/admin/plugins/t-book/groups/${groupId}/hotels/new`}>
              Első szállás hozzáadása
            </Link>
          </TBookPrimaryButton>
        </div>
      ) : (
        <ul className="space-y-3">
          {hotels.map((hotel) => {
            const pricing = normalizeHotelPricing(hotel.pricing)
            const addonCount = pricing.addonGroups.reduce((sum, g) => sum + g.options.length, 0)
            return (
              <li
                key={hotel.id}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border border-white/10 rounded-2xl p-5 bg-white/5 hover:border-white/25 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-white truncate">{hotel.name}</p>
                    <TBookStatusBadge status={hotel.status} labels={TBOOK_STATUS_LABELS} />
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    {hotel.address || "Nincs cím"}
                    {hotel.distanceFromVenueKm != null
                      ? ` · ${hotel.distanceFromVenueKm} km a helyszíntől`
                      : ""}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {pricing.roomTypes.length} szobatípus · {pricing.addonGroups.length}{" "}
                    felár-csoport ({addonCount} mező)
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Link
                    href={`/admin/plugins/t-book/groups/${groupId}/hotels/${hotel.id}`}
                    className="inline-flex h-9 items-center px-3 border border-white/10 rounded-lg text-white text-xs font-bold hover:bg-white/5"
                  >
                    Szerkesztés
                  </Link>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 border-red-500/30 text-red-300 text-xs font-bold hover:bg-red-500/10"
                    onClick={() => void remove(hotel)}
                  >
                    Törlés
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <ApiKeyRevealDialog apiKey={revealedKey} onClose={() => setRevealedKey(null)} />
    </div>
  )
}
