"use client"

import { Button } from "@wse/core/components/ui/button"
import type { TBookPackageDeal, TBookRoomType } from "../lib/pricing-types"
import { TBookField, TBookInput, TBookSelect } from "./t-book-admin-ui"
import { formatMoney } from "./t-book-api"

export function PackageDealsEditor({
  packages,
  onChange,
  roomTypes,
  currency = "HUF",
  priceBasisLabel = "nettó",
}: {
  packages: TBookPackageDeal[]
  onChange: (packages: TBookPackageDeal[]) => void
  roomTypes: TBookRoomType[]
  currency?: string
  priceBasisLabel?: string
}) {
  const update = (index: number, patch: Partial<TBookPackageDeal>) => {
    onChange(packages.map((pkg, i) => (i === index ? { ...pkg, ...patch } : pkg)))
  }

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= packages.length) return
    const next = [...packages]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next.map((pkg, i) => ({ ...pkg, sortOrder: i })))
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Fix árú csomagajánlatok (pl. 3 éjszaka adott szobatípusban). Ha a vendég ezt választja,
        a per-éjszaka számítás helyett a csomagár érvényes ({priceBasisLabel}, {currency}).
      </p>
      {packages.length === 0 ? (
        <p className="text-sm text-muted-foreground border border-dashed border-border rounded-lg px-4 py-4 text-center">
          Nincs csomagajánlat — csak szobatípus alapár / éj lesz számolva.
        </p>
      ) : (
        <div className="space-y-2">
          {packages.map((pkg, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-2 items-end rounded-xl bg-card shadow-sm p-3"
            >
              <div className="col-span-4">
                <TBookField label="Csomag neve (vendég látja)">
                  <TBookInput
                    placeholder="3 éjszaka csomag"
                    value={pkg.label}
                    onChange={(e) => update(index, { label: e.target.value })}
                  />
                </TBookField>
              </div>
              <div className="col-span-2">
                <TBookField label="Éjszakák">
                  <TBookInput
                    type="number"
                    min={1}
                    max={60}
                    value={pkg.nights}
                    onChange={(e) => update(index, { nights: Number(e.target.value) || 1 })}
                  />
                </TBookField>
              </div>
              <div className="col-span-2">
                <TBookField label={`Ár (${currency})`}>
                  <TBookInput
                    type="number"
                    min={0}
                    value={pkg.priceHuf}
                    onChange={(e) => update(index, { priceHuf: Number(e.target.value) || 0 })}
                  />
                </TBookField>
              </div>
              <div className="col-span-3">
                <TBookField label="Szobatípus (opcionális)">
                  <TBookSelect
                    value={pkg.roomTypeKey ?? ""}
                    onChange={(e) =>
                      update(index, { roomTypeKey: e.target.value || null })
                    }
                  >
                    <option value="">Bármely szobatípus</option>
                    {roomTypes.map((room, roomIndex) => (
                      <option key={room.key || `room-${roomIndex}`} value={room.key}>
                        {room.label || "Névtelen"}
                      </option>
                    ))}
                  </TBookSelect>
                </TBookField>
              </div>
              <div className="col-span-1 flex gap-1 justify-end pb-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-red-600"
                  onClick={() => onChange(packages.filter((_, i) => i !== index))}
                >
                  ✕
                </Button>
              </div>
              <p className="col-span-12 text-xs text-muted-foreground -mt-1">
                {pkg.nights} éj · {formatMoney(pkg.priceHuf, currency)} ({priceBasisLabel})
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
            ...packages,
            {
              key: "",
              label: "",
              nights: 3,
              priceHuf: 0,
              roomTypeKey: null,
              sortOrder: packages.length,
            },
          ])
        }
      >
        + Csomagajánlat
      </Button>
    </div>
  )
}
