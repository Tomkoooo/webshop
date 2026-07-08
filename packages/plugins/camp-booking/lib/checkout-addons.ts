import type { ICampTicketType } from "../models/CampTicketType"
import { isAddonTicketType } from "./pricing"
import type { CampChildPriceInput } from "./pricing-types"

export function buildAddonSelections(
  children: Array<
    CampChildPriceInput & { addonTicketIds?: string[]; laptopRental?: boolean }
  >,
  sessionTickets: ICampTicketType[],
  laptopTicketId?: string | null
): Map<string, number> {
  const addonIds = new Set(
    sessionTickets
      .filter((t) => isAddonTicketType({ kind: t.kind, name: t.name }))
      .map((t) => String(t._id))
  )
  const counts = new Map<string, number>()

  for (const child of children) {
    const selected = new Set(child.addonTicketIds ?? [])
    if (child.laptopRental && laptopTicketId) {
      selected.add(laptopTicketId)
    }
    for (const id of selected) {
      if (!addonIds.has(id)) continue
      counts.set(id, (counts.get(id) ?? 0) + 1)
    }
  }

  return counts
}
