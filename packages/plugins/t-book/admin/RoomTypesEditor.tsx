"use client"

import { Button } from "@wse/core/components/ui/button"
import type { TBookRoomType } from "../lib/pricing-types"
import { TBookField, TBookInput, tBookPanelCompactClass } from "./t-book-admin-ui"
import { formatMoney } from "./t-book-api"

export function RoomTypesEditor({
  roomTypes,
  onChange,
  priceBasisLabel = "nettó",
  currency = "HUF",
}: {
  roomTypes: TBookRoomType[]
  onChange: (roomTypes: TBookRoomType[]) => void
  priceBasisLabel?: string
  currency?: string
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
      <p className="text-xs text-muted-foreground">
        Minden szobatípus alapdíja <strong className="text-foreground">fő / éjszaka</strong> (
        {priceBasisLabel}, {currency}). A vendég egy szobatípust választ — ez lesz a szállás alapára.
      </p>
      {roomTypes.length === 0 ? (
        <p className="text-sm text-amber-900 border border-amber-500/20 rounded-lg px-4 py-3 bg-amber-500/5">
          Adj hozzá legalább egy szobatípust (pl. Standard, Superior, Lakosztály).
        </p>
      ) : (
        <div className="space-y-2">
          {roomTypes.map((room, index) => (
            <div
              key={index}
              className={`grid grid-cols-12 gap-2 items-end ${tBookPanelCompactClass}`}
            >
              <div className="col-span-5">
                <TBookField label="Megnevezés (vendég látja)">
                  <TBookInput
                    placeholder="Standard kétágyas"
                    value={room.label}
                    onChange={(e) => update(index, { label: e.target.value })}
                  />
                </TBookField>
              </div>
              <div className="col-span-5">
                <TBookField label={`Alapdíj / fő / éj (${currency})`}>
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
                  className="h-8 w-8 p-0 text-muted-foreground"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-red-600"
                  onClick={() => onChange(roomTypes.filter((_, i) => i !== index))}
                >
                  ✕
                </Button>
              </div>
              <p className="col-span-12 text-xs text-muted-foreground -mt-1">
                Példa 2 fő × 3 éj:{" "}
                <span className="text-foreground font-semibold">
                  {formatMoney(room.baseRateHuf * 2 * 3, currency)}
                </span>{" "}
                ({priceBasisLabel} alap)
              </p>
            </div>
          ))}
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        className="h-10 font-bold"
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
