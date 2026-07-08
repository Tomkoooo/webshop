"use client"

import { Button } from "@wse/core/components/ui/button"
import type { TBookRoomType } from "../lib/pricing-types"
import { slugifyHotelKey } from "../lib/hotel-pricing"
import { TBookField, TBookInput } from "./t-book-admin-ui"
import { formatHuf } from "./t-book-api"

export function RoomTypesEditor({
  roomTypes,
  onChange,
  priceBasisLabel = "nettó",
}: {
  roomTypes: TBookRoomType[]
  onChange: (roomTypes: TBookRoomType[]) => void
  priceBasisLabel?: string
}) {
  const update = (index: number, patch: Partial<TBookRoomType>) => {
    onChange(roomTypes.map((room, i) => (i === index ? { ...room, ...patch } : room)))
  }

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= roomTypes.length) return
    const next = [...roomTypes]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next.map((room, i) => ({ ...room, sortOrder: i })))
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-neutral-500">
        Minden szobatípus alapdíja <strong>fő / éjszaka</strong> ({priceBasisLabel} Ft). A vendég
        egy szobatípust választ — ez lesz a szállás alapára.
      </p>
      {roomTypes.length === 0 ? (
        <p className="text-sm text-amber-300/90 border border-amber-500/20 rounded-lg px-4 py-3">
          Adj hozzá legalább egy szobatípust (pl. Standard, Superior, Lakosztály).
        </p>
      ) : (
        <div className="space-y-2">
          {roomTypes.map((room, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-2 items-end border border-white/10 rounded-xl p-3 bg-black/30"
            >
              <div className="col-span-4">
                <TBookField label="Megnevezés">
                  <TBookInput
                    placeholder="Standard kétágyas"
                    value={room.label}
                    onChange={(e) => {
                      const label = e.target.value
                      update(index, {
                        label,
                        key: room.key || slugifyHotelKey(label),
                      })
                    }}
                  />
                </TBookField>
              </div>
              <div className="col-span-3">
                <TBookField label="Kulcs">
                  <TBookInput
                    placeholder="standard"
                    value={room.key}
                    onChange={(e) => update(index, { key: slugifyHotelKey(e.target.value) })}
                  />
                </TBookField>
              </div>
              <div className="col-span-3">
                <TBookField label="Alapdíj / fő / éj">
                  <TBookInput
                    type="number"
                    min={0}
                    value={room.baseRateHuf}
                    onChange={(e) =>
                      update(index, { baseRateHuf: Number(e.target.value) || 0 })
                    }
                  />
                </TBookField>
              </div>
              <div className="col-span-2 flex gap-1 justify-end pb-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-neutral-400"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-red-300"
                  onClick={() => onChange(roomTypes.filter((_, i) => i !== index))}
                >
                  ✕
                </Button>
              </div>
              <p className="col-span-12 text-[11px] text-neutral-600 -mt-1">
                Példa 2 fő × 3 éj:{" "}
                <span className="text-neutral-400 font-bold">
                  {formatHuf(room.baseRateHuf * 2 * 3)}
                </span>{" "}
                bruttó előnézet nélkül ({priceBasisLabel} alap)
              </p>
            </div>
          ))}
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        className="h-10 border-white/10 text-white font-bold"
        onClick={() =>
          onChange([
            ...roomTypes,
            {
              key: "",
              label: "",
              baseRateHuf: 0,
              sortOrder: roomTypes.length,
            },
          ])
        }
      >
        + Szobatípus
      </Button>
    </div>
  )
}
