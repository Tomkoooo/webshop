"use client"

import { useMemo, useState } from "react"
import { BedDouble, Calendar, Users } from "lucide-react"
import type { TBookPublicPackageDeal } from "./tbook-public-api"
import { formatHuf } from "./tbook-public-api"
import type { PackageCombinationSuggestion } from "../lib/package-optimization"

type Props = {
  packages: TBookPublicPackageDeal[]
  packagesRequired: boolean
  packageDealKey: string
  activePackageUnits: Record<string, number> | null
  accommodationGuests: number
  displayCurrency: string
  suggestions: PackageCombinationSuggestion[]
  onSelectPackage: (key: string, nights: number) => void
  onApplyPlan: (units: Record<string, number>) => void
  onClearPackage: () => void
}

function groupPackagesByNights(packages: TBookPublicPackageDeal[]) {
  const map = new Map<number, TBookPublicPackageDeal[]>()
  for (const pkg of packages) {
    const list = map.get(pkg.nights) ?? []
    list.push(pkg)
    map.set(pkg.nights, list)
  }
  return [...map.entries()].sort(([a], [b]) => a - b)
}

function roomKindLabel(pkg: TBookPublicPackageDeal): string {
  const cap = pkg.maxGuests ?? 1
  if (cap >= 2) return "Kétágyas"
  return "Egyágyas"
}

export function PackageSelectionCards({
  packages,
  packagesRequired,
  packageDealKey,
  activePackageUnits,
  accommodationGuests,
  displayCurrency,
  suggestions,
  onSelectPackage,
  onApplyPlan,
  onClearPackage,
}: Props) {
  const groups = useMemo(() => groupPackagesByNights(packages), [packages])
  const [selectedNights, setSelectedNights] = useState<number | null>(() => {
    if (packageDealKey) {
      const pkg = packages.find((p) => p.key === packageDealKey)
      return pkg?.nights ?? groups[0]?.[0] ?? null
    }
    if (activePackageUnits) {
      const firstKey = Object.keys(activePackageUnits)[0]
      const pkg = packages.find((p) => p.key === firstKey)
      return pkg?.nights ?? groups[0]?.[0] ?? null
    }
    return groups[0]?.[0] ?? null
  })

  const packagesForPeriod =
    selectedNights != null ? packages.filter((p) => p.nights === selectedNights) : packages

  const cardClass = (selected: boolean) =>
    `rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
      selected
        ? "border-primary bg-primary/10 shadow-sm"
        : "border-border bg-surface hover:border-primary/40 hover:bg-muted/30"
    }`

  return (
    <div className="space-y-5">
      {suggestions.length > 1 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Ajánlott elosztás ({accommodationGuests} fő szálláshoz)
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {suggestions.map((suggestion) => {
              const selected =
                activePackageUnits != null && JSON.stringify(activePackageUnits) === suggestion.id
              return (
                <button
                  key={suggestion.id}
                  type="button"
                  className={cardClass(selected)}
                  onClick={() => onApplyPlan(suggestion.units)}
                >
                  <p className="text-sm font-semibold">{suggestion.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {suggestion.totalUnits} szoba · {suggestion.totalCapacity} fő kapacitás
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {groups.length > 1 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-2">
            <Calendar className="size-4" aria-hidden />
            Szállás időszaka
          </p>
          <div className="flex flex-wrap gap-2">
            {groups.map(([nights]) => (
              <button
                key={nights}
                type="button"
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  selectedNights === nights
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted/40"
                }`}
                onClick={() => setSelectedNights(nights)}
              >
                {nights} éj
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-medium flex items-center gap-2">
          <BedDouble className="size-4" aria-hidden />
          {packagesRequired ? "Válassz szobacsomagot" : "Szobacsomag (opcionális)"}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {!packagesRequired ? (
            <button
              type="button"
              className={cardClass(!packageDealKey && !activePackageUnits)}
              onClick={onClearPackage}
            >
              <p className="text-sm font-semibold">Per-éjszaka ár</p>
              <p className="mt-1 text-xs text-muted-foreground">Csomag nélkül, éjszakánkénti díj</p>
            </button>
          ) : null}
          {packagesForPeriod.map((pkg) => {
            const selected =
              packageDealKey === pkg.key ||
              (activePackageUnits != null && (activePackageUnits[pkg.key] ?? 0) > 0)
            const unitsNeeded =
              pkg.maxGuests != null && pkg.maxGuests > 0
                ? Math.ceil(accommodationGuests / pkg.maxGuests)
                : 1
            return (
              <button
                key={pkg.key}
                type="button"
                className={cardClass(selected)}
                onClick={() => onSelectPackage(pkg.key, pkg.nights)}
              >
                <p className="text-sm font-semibold">{pkg.label}</p>
                <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="size-3.5" aria-hidden />
                  {roomKindLabel(pkg)}
                  {pkg.maxGuests != null && pkg.maxGuests > 0 ? ` · max ${pkg.maxGuests} fő` : ""}
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {formatHuf(pkg.priceHuf, displayCurrency)}
                  {pkg.nights > 1 ? ` · ${pkg.nights} éj` : ""}
                </p>
                {pkg.maxGuests != null && pkg.maxGuests > 0 && accommodationGuests > 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {unitsNeeded > 1
                      ? `${unitsNeeded}× = ${formatHuf(pkg.priceHuf * unitsNeeded, displayCurrency)} összesen`
                      : "1 szoba elegendő"}
                  </p>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
