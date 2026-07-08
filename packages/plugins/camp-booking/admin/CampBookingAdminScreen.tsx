"use client"

import { CampAdminHome } from "./CampAdminHome"
import { CampStatsPanel } from "./CampStatsPanel"
import { CampsAdmin } from "./CampsAdmin"

export function CampBookingAdminScreen({
  path,
}: {
  path: string[]
  config: Record<string, unknown>
}) {
  const segment = path[0] ?? ""

  if (segment === "stats") {
    return <CampStatsPanel />
  }
  if (segment === "camps") {
    return <CampsAdmin path={path.slice(1)} />
  }

  return <CampAdminHome />
}
