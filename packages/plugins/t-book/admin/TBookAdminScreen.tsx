"use client"

import { TBookDashboard } from "./TBookDashboard"
import { GroupsAdmin } from "./GroupsAdmin"
import { GroupAdminRouter } from "./GroupAdminRouter"
import { EventsAdmin } from "./EventsAdmin"
import { BookingsAdmin } from "./BookingsAdmin"
import { VoucherScannerAdmin } from "./VoucherScannerAdmin"

export function TBookAdminScreen({
  path,
}: {
  path: string[]
  config: Record<string, unknown>
}) {
  const segment = path[0] ?? ""

  if (segment === "groups") {
    if (!path[1]) return <GroupsAdmin />
    return <GroupAdminRouter path={path.slice(1)} />
  }
  if (segment === "events") {
    return <EventsAdmin path={path.slice(1)} />
  }
  if (segment === "bookings") {
    return <BookingsAdmin />
  }
  if (segment === "scanner") {
    return <VoucherScannerAdmin />
  }
  if (segment === "stats") {
    return <TBookDashboard />
  }

  return <TBookDashboard />
}
