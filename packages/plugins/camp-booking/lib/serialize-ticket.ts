import type { ICampTicketType } from "../models/CampTicketType"
import { isAddonTicketType, resolveEffectiveUnitPriceHuf } from "./pricing"

export function serializeTicketTypeForApi(ticket: ICampTicketType, at = new Date()) {
  const kind =
    ticket.kind === "addon" || ticket.kind === "base"
      ? ticket.kind
      : isAddonTicketType({ kind: undefined, name: ticket.name })
        ? "addon"
        : "base"
  const effective = resolveEffectiveUnitPriceHuf(
    {
      name: ticket.name,
      priceHuf: ticket.priceHuf,
      pricingMode: ticket.pricingMode,
      kind,
      earlyBirdEndsAt: ticket.earlyBirdEndsAt,
      earlyBirdPriceHuf: ticket.earlyBirdPriceHuf,
      earlyBirdDiscountPercent: ticket.earlyBirdDiscountPercent,
    },
    at
  )

  return {
    id: String(ticket._id),
    name: ticket.name,
    description: ticket.description || "",
    priceHuf: ticket.priceHuf,
    effectivePriceHuf: effective.unitPriceHuf,
    earlyBirdActive: effective.earlyBirdActive,
    pricingMode: ticket.pricingMode,
    kind,
    earlyBirdEndsAt: ticket.earlyBirdEndsAt?.toISOString() ?? null,
    earlyBirdPriceHuf: ticket.earlyBirdPriceHuf ?? null,
    earlyBirdDiscountPercent: ticket.earlyBirdDiscountPercent ?? null,
    isActive: ticket.isActive,
    sortOrder: ticket.sortOrder,
  }
}
