"use client"

import { Button } from "@wse/core/components/ui/button"
import type { TBookPackageDeal, TBookRoomType } from "../lib/pricing-types"
import { TBookField, TBookInput, tBookEmptyStateClass, tBookPanelCompactClass, TBookSelect } from "./t-book-admin-ui"
import { formatMoney } from "./t-book-api"

export function PackageDealsEditor({
  packages,
  onChange,
  roomTypes,
  currency = "HUF",
  priceBasisLabel = "nettó",
  packagesOnly = false,
  required = false,
}: {
  packages: TBookPackageDeal[]
  onChange: (packages: TBookPackageDeal[]) => void
  roomTypes: TBookRoomType[]
  currency?: string
  priceBasisLabel?: string
  /** Hide room-type link — guest picks named packages only. */
  packagesOnly?: boolean
  required?: boolean
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
        {packagesOnly
          ? `Fix árú csomagajánlatok. A „Férőhely / csomag” határozza meg a szobatípust: 1 = egyágyas, 2 = kétágyas. Több vendégnél a rendszer automatikusan több csomagot számol (${priceBasisLabel}, ${currency}).`
          : `Fix árú csomagajánlatok (pl. 3 éjszaka). A „Férőhely / csomag” a kapacitás egységenként (1 = single, 2 = double); a csomagár × ceil(vendégek / férőhely) (${priceBasisLabel}, ${currency}).`}
      </p>
      {packages.length === 0 ? (
        <p className={tBookEmptyStateClass}>
          {required
            ? "Adj hozzá legalább egy csomagajánlatot."
            : "Nincs csomagajánlat — csak szobatípus alapár / éj lesz számolva."}
        </p>
      ) : (
        <div className="space-y-2">
          {packages.map((pkg, index) => (
            <div
              key={index}
              className={`grid grid-cols-12 gap-2 items-end ${tBookPanelCompactClass}`}
            >
              <div className={packagesOnly ? "col-span-5" : "col-span-3"}>
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
              <div className="col-span-2">
                <TBookField label="Férőhely / csomag">
                  <TBookInput
                    type="number"
                    min={1}
                    max={50}
                    placeholder={packagesOnly ? "1 = single" : "Üres → 1"}
                    title="1 = egyágyas (single), 2 = kétágyas (double). Ennyi vendég fér egy csomagegységbe."
                    value={pkg.maxGuests ?? ""}
                    onChange={(e) => {
                      const raw = e.target.value.trim()
                      update(index, { maxGuests: raw ? Number(raw) || null : null })
                    }}
                  />
                </TBookField>
              </div>
              {!packagesOnly ? (
                <div className="col-span-2">
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
              ) : null}
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
                {pkg.maxGuests != null && pkg.maxGuests > 0
                  ? ` · ${pkg.maxGuests === 1 ? "egyágyas" : pkg.maxGuests === 2 ? "kétágyas" : `${pkg.maxGuests} fő/csomag`}`
                  : packagesOnly
                    ? " · egyágyas (alapértelmezett)"
                    : ""}
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
              maxGuests: packagesOnly ? 1 : null,
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
