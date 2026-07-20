import type { TBookPricingRule } from "./pricing-rules"

/** Private team event: free entry, hotel discount per team, off-site fee per player. */
export function buildPrivateTeamHotelPricingPreset(amountPerUnit = 100): TBookPricingRule[] {
  const id = (suffix: string) => `preset-${suffix}-${Date.now()}`
  return [
    {
      id: id("free"),
      enabled: true,
      label: "Free entry",
      when: "always",
      action: "set_ticket_fee",
      amount: 0,
      amountMode: "fixed",
    },
    {
      id: id("hotel"),
      enabled: true,
      label: "Organizer hotel discount",
      when: "with_hotel",
      action: "adjust_total",
      amount: -Math.abs(amountPerUnit),
      amountMode: "per_team",
    },
    {
      id: id("offsite"),
      enabled: true,
      label: "External accommodation fee",
      when: "without_hotel",
      action: "adjust_total",
      amount: Math.abs(amountPerUnit),
      amountMode: "per_team_member",
    },
  ]
}
