"use client"

import { PressKitOverview } from "./PressKitOverview"
import { PressContactsAdmin } from "./PressContactsAdmin"
import { PressContentAdmin } from "./PressContentAdmin"
import { PressStatsPanel } from "./PressStatsPanel"

export function PressKitAdminScreen({
  path,
}: {
  path: string[]
  config: Record<string, unknown>
}) {
  const segment = path[0] ?? ""

  if (segment === "contacts") {
    return <PressContactsAdmin />
  }
  if (segment === "content") {
    return <PressContentAdmin path={path.slice(1)} />
  }
  if (segment === "stats") {
    return <PressStatsPanel />
  }

  return <PressKitOverview />
}
