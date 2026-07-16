"use client"

import { useMemo, useState } from "react"
import { BedDouble, Calendar, Users } from "lucide-react"
import type { TBookPublicPackageDeal } from "./tbook-public-api"
import { formatHuf } from "./tbook-public-api"
import { packageUnitsForGuests } from "../lib/hotel-pricing"
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
  const cap = pkg.maxGuests != null && pkg.maxGuests > 0 ? pkg.maxGuests : 1
  if (cap >= 2) return "Double / twin"
  return "Single"
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
      <p className="rounded-lg bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        Prices below update for <strong className="text-foreground">{accommodationGuests}</strong>{" "}
        hotel guest{accommodationGuests === 1 ? "" : "s"}.
      </p>

      {suggestions.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Suggested room mix ({accommodationGuests} guests)
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {suggestions.map((suggestion) => {
              const selected =
                activePackageUnits != null && JSON.stringify(activePackageUnits) === suggestion.id
              const planTotal = Object.entries(suggestion.units).reduce((sum, [key, qty]) => {
                const pkg = packages.find((p) => p.key === key)
                return sum + (pkg?.priceHuf ?? 0) * qty
              }, 0)
              return (
                <button
                  key={suggestion.id}
                  type="button"
                  className={cardClass(selected)}
                  onClick={() => onApplyPlan(suggestion.units)}
                >
                  <p className="text-sm font-semibold">{suggestion.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {suggestion.totalUnits} room{suggestion.totalUnits === 1 ? "" : "s"} ·{" "}
                    {suggestion.totalCapacity} guest capacity
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {formatHuf(planTotal, displayCurrency)}
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
            Stay length
          </p>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Stay length">
            {groups.map(([nights]) => (
              <button
                key={nights}
                type="button"
                role="tab"
                aria-selected={selectedNights === nights}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  selectedNights === nights
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted/40"
                }`}
                onClick={() => setSelectedNights(nights)}
              >
                {nights} night{nights === 1 ? "" : "s"}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-medium flex items-center gap-2">
          <BedDouble className="size-4" aria-hidden />
          {packagesRequired ? "Choose a room package" : "Room package (optional)"}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {!packagesRequired ? (
            <button
              type="button"
              className={cardClass(!packageDealKey && !activePackageUnits)}
              onClick={onClearPackage}
            >
              <p className="text-sm font-semibold">Per-night rate</p>
              <p className="mt-1 text-xs text-muted-foreground">No package — nightly pricing</p>
            </button>
          ) : null}
          {packagesForPeriod.map((pkg) => {
            const unitsNeeded = packageUnitsForGuests(pkg, accommodationGuests)
            const selected =
              (packageDealKey === pkg.key && !activePackageUnits) ||
              (activePackageUnits != null &&
                Object.keys(activePackageUnits).length === 1 &&
                (activePackageUnits[pkg.key] ?? 0) === unitsNeeded)
            const lineTotal = pkg.priceHuf * unitsNeeded
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
                  {` · up to ${pkg.maxGuests != null && pkg.maxGuests > 0 ? pkg.maxGuests : 1} guest(s)`}
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {formatHuf(pkg.priceHuf, displayCurrency)}
                  {pkg.nights > 1 ? ` / ${pkg.nights} nights` : ""} each
                </p>
                <p className="mt-1 text-xs font-medium text-foreground">
                  {unitsNeeded}× room{unitsNeeded === 1 ? "" : "s"} ={" "}
                  {formatHuf(lineTotal, displayCurrency)}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
