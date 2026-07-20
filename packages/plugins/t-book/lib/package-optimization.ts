import type { TBookPackageDeal } from "./pricing-types"

export type PackageUnitPlan = Record<string, number>

export type PackageCombinationSuggestion = {
  id: string
  label: string
  units: PackageUnitPlan
  totalCapacity: number
  totalUnits: number
  nights: number
}

function packageCapacity(pkg: TBookPackageDeal): number {
  return pkg.maxGuests != null && pkg.maxGuests > 0 ? pkg.maxGuests : 1
}

/** Greedy fill: prefer largest capacity packages first (minimize unit count). */
function greedyPlan(
  guests: number,
  packages: TBookPackageDeal[],
  sortBy: "capacity_desc" | "capacity_asc"
): PackageUnitPlan | null {
  const sorted = [...packages].sort((a, b) => {
    const diff = packageCapacity(b) - packageCapacity(a)
    return sortBy === "capacity_desc" ? diff : -diff
  })
  let remaining = guests
  const units: PackageUnitPlan = {}
  for (const pkg of sorted) {
    const cap = packageCapacity(pkg)
    if (cap <= 0) continue
    const count = Math.floor(remaining / cap)
    if (count > 0) {
      units[pkg.key] = count
      remaining -= count * cap
    }
    if (remaining === 0) break
  }
  if (remaining > 0) {
    const smallest = sorted.reduce((best, pkg) =>
      packageCapacity(pkg) < packageCapacity(best) ? pkg : best
    )
    units[smallest.key] = (units[smallest.key] ?? 0) + 1
    remaining = 0
  }
  return Object.keys(units).length > 0 ? units : null
}

function planLabel(units: PackageUnitPlan, packages: TBookPackageDeal[]): string {
  const byKey = new Map(packages.map((p) => [p.key, p]))
  return Object.entries(units)
    .map(([key, qty]) => {
      const pkg = byKey.get(key)
      return `${qty}× ${pkg?.label ?? key}`
    })
    .join(" + ")
}

function planCapacity(units: PackageUnitPlan, packages: TBookPackageDeal[]): number {
  const byKey = new Map(packages.map((p) => [p.key, p]))
  return Object.entries(units).reduce(
    (sum, [key, qty]) => sum + qty * packageCapacity(byKey.get(key)!),
    0
  )
}

function suggestionsForNightCohort(
  guests: number,
  viable: TBookPackageDeal[]
): PackageCombinationSuggestion[] {
  if (viable.length === 0) return []
  const nights = viable[0].nights
  const candidates: PackageUnitPlan[] = []

  const fewest = greedyPlan(guests, viable, "capacity_desc")
  if (fewest) candidates.push(fewest)

  const singles = viable.filter((p) => packageCapacity(p) === 1)
  if (singles.length > 0) {
    candidates.push({ [singles[0].key]: guests })
  }

  const doubles = viable.filter((p) => packageCapacity(p) === 2)
  if (doubles.length > 0 && guests >= 2) {
    const dbl = doubles[0]
    const units: PackageUnitPlan = {}
    const doubleCount = Math.floor(guests / 2)
    const remainder = guests % 2
    if (doubleCount > 0) units[dbl.key] = doubleCount
    if (remainder > 0 && singles.length > 0) units[singles[0].key] = remainder
    else if (remainder > 0) units[dbl.key] = (units[dbl.key] ?? 0) + 1
    if (Object.keys(units).length > 0) candidates.push(units)
  }

  const mixed = greedyPlan(guests, viable, "capacity_asc")
  if (mixed) candidates.push(mixed)

  const seen = new Set<string>()
  const suggestions: PackageCombinationSuggestion[] = []

  for (const units of candidates) {
    const key = JSON.stringify(units)
    if (seen.has(key)) continue
    seen.add(key)
    const totalCapacity = planCapacity(units, viable)
    if (totalCapacity < guests) continue
    const totalUnits = Object.values(units).reduce((a, b) => a + b, 0)
    suggestions.push({
      id: key,
      label: planLabel(units, viable),
      units,
      totalCapacity,
      totalUnits,
      nights,
    })
  }

  return suggestions.sort((a, b) => a.totalUnits - b.totalUnits || a.label.localeCompare(b.label))
}

/**
 * Suggest package combinations that fit the guest count.
 * Only mixes packages with the same night count (e.g. 2× single OR 1× double).
 * Returns up to 4 distinct plans overall.
 */
export function suggestPackageCombinations(
  guests: number,
  packages: TBookPackageDeal[]
): PackageCombinationSuggestion[] {
  if (guests < 1 || packages.length === 0) return []

  const viable = packages.filter((p) => packageCapacity(p) > 0)
  if (viable.length === 0) return []

  const byNights = new Map<number, TBookPackageDeal[]>()
  for (const pkg of viable) {
    const list = byNights.get(pkg.nights) ?? []
    list.push(pkg)
    byNights.set(pkg.nights, list)
  }

  const suggestions: PackageCombinationSuggestion[] = []
  for (const cohort of byNights.values()) {
    suggestions.push(...suggestionsForNightCohort(guests, cohort))
  }

  return suggestions.slice(0, 4)
}

export function packageUnitsTotalGuests(
  units: PackageUnitPlan,
  packages: TBookPackageDeal[]
): number {
  return planCapacity(units, packages)
}
