"use client"

import { useMemo, useState } from "react"
import { BedDouble, Calendar, Users } from "lucide-react"
import type { TBookPublicPackageDeal } from "./tbook-public-api"
import { formatHuf } from "./tbook-public-api"
import { packageUnitsForGuests } from "../lib/hotel-pricing"
import type { PackageCombinationSuggestion } from "../lib/package-optimization"
import { nearestAvailableNights } from "../lib/stay-recommendation"

type Props = {
  packages: TBookPublicPackageDeal[]
  packagesRequired: boolean
  packageDealKey: string
  activePackageUnits: Record<string, number> | null
  accommodationGuests: number
  displayCurrency: string
  suggestions: PackageCombinationSuggestion[]
  /** Highlight the stay length that matches the event window. */
  recommendedNights?: number | null
  recommendedLabel?: string | null
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
  recommendedNights = null,
  recommendedLabel = null,
  onSelectPackage,
  onApplyPlan,
  onClearPackage,
}: Props) {
  const groups = useMemo(() => groupPackagesByNights(packages), [packages])
  const nightOptions = useMemo(() => groups.map(([n]) => n), [groups])

  const defaultNights = useMemo(() => {
    if (recommendedNights != null) {
      const nearest = nearestAvailableNights(nightOptions, recommendedNights)
      if (nearest != null) return nearest
    }
    if (packageDealKey) {
      const pkg = packages.find((p) => p.key === packageDealKey)
      if (pkg) return pkg.nights
    }
    if (activePackageUnits) {
      const firstKey = Object.keys(activePackageUnits)[0]
      const pkg = packages.find((p) => p.key === firstKey)
      if (pkg) return pkg.nights
    }
    return nightOptions[0] ?? null
  }, [recommendedNights, nightOptions, packageDealKey, activePackageUnits, packages])

  const [userSelectedNights, setUserSelectedNights] = useState<number | null>(null)
  const selectedNights = userSelectedNights ?? defaultNights

  const exactRecommendedAvailable =
    recommendedNights != null && groups.some(([n]) => n === recommendedNights)

  const packagesForPeriod =
    selectedNights != null ? packages.filter((p) => p.nights === selectedNights) : packages

  const suggestionsForPeriod = useMemo(() => {
    if (selectedNights == null) return suggestions
    return suggestions.filter((s) => {
      if (s.nights === selectedNights) return true
      const keys = Object.keys(s.units)
      return (
        keys.length > 0 &&
        keys.every((key) => {
          const pkg = packages.find((p) => p.key === key)
          return pkg?.nights === selectedNights
        })
      )
    })
  }, [suggestions, selectedNights, packages])

  const cardClass = (selected: boolean, disabled = false) =>
    `rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
      disabled
        ? "cursor-not-allowed border-border/60 bg-muted/20 opacity-60"
        : selected
          ? "border-primary bg-primary/10 shadow-sm"
          : "border-border bg-surface hover:border-primary/40 hover:bg-muted/30"
    }`

  return (
    <div className="space-y-5">
      <p className="rounded-lg bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        Prices below update for <strong className="text-foreground">{accommodationGuests}</strong>{" "}
        hotel guest{accommodationGuests === 1 ? "" : "s"}
        {accommodationGuests > 1 ? (
          <>
            {" "}
            — a single room needs {accommodationGuests} rooms, or choose a double/twin mix that
            covers everyone.
          </>
        ) : null}
        .
      </p>
      <p className="text-xs text-muted-foreground">
        No refunds are available after payment. By continuing you confirm you understand this.
      </p>

      {suggestionsForPeriod.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Suggested room mix ({accommodationGuests} guests)
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {suggestionsForPeriod.map((suggestion, index) => {
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
                  <p className="text-sm font-semibold">
                    {suggestion.label}
                    {index === 0 ? (
                      <span className="ml-2 text-xs font-medium text-primary">Recommended</span>
                    ) : null}
                  </p>
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

      {recommendedLabel || recommendedNights != null ? (
        <p className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-foreground">
          Recommended stay
          {recommendedNights != null ? (
            <>
              : <strong>{recommendedNights} night{recommendedNights === 1 ? "" : "s"}</strong>
            </>
          ) : null}
          {recommendedLabel ? <> ({recommendedLabel})</> : null}
          {!exactRecommendedAvailable && recommendedNights != null && selectedNights != null ? (
            <span className="mt-1 block text-xs text-muted-foreground">
              No exact {recommendedNights}-night package is available — showing the closest option (
              {selectedNights} night{selectedNights === 1 ? "" : "s"}).
            </span>
          ) : null}
        </p>
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
                onClick={() => setUserSelectedNights(nights)}
              >
                {nights} night{nights === 1 ? "" : "s"}
                {recommendedNights === nights ? " · recommended" : ""}
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
            const remaining =
              typeof pkg.remainingUnits === "number" ? pkg.remainingUnits : null
            const soldOut = remaining != null && remaining < unitsNeeded
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
                className={cardClass(selected, soldOut)}
                disabled={soldOut}
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
                  {unitsNeeded > 1 ? ` for ${accommodationGuests} guests` : ""}
                </p>
                {remaining != null ? (
                  <p
                    className={`mt-1 text-xs ${
                      soldOut ? "font-medium text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    {soldOut
                      ? "Sold out"
                      : `${remaining} room${remaining === 1 ? "" : "s"} left`}
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
