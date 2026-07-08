export const CAMP_ADMIN_API = "/api/plugins/camp-booking/admin"

export type CampPricingSettings = {
  multiChildDiscountPercent: number
  multiChildMinCount: number
  siblingDiscountPercent: number
  siblingMatchByLastName: boolean
}

export type CampDashboardStats = {
  revenueHuf: number
  registrationCount: number
  childCount: number
  publishedCamps: number
  publishedSessions: number
  upcomingSessions: number
  spotsLeft: number
  activeHolds: number
  recentRegistrations: Array<{
    buyerName: string
    sessionLabel: string
    campTitle: string
    totalHuf: number
    childCount: number
    paidAt: string
  }>
}

export type AdminTicketType = {
  id: string
  name: string
  description: string
  priceHuf: number
  pricingMode: "per_child" | "flat"
  kind: "base" | "addon"
  earlyBirdEndsAt: string | null
  earlyBirdPriceHuf: number | null
  earlyBirdDiscountPercent: number | null
  isActive: boolean
  sortOrder: number
}

export const defaultCampPricing: CampPricingSettings = {
  multiChildDiscountPercent: 0,
  multiChildMinCount: 2,
  siblingDiscountPercent: 0,
  siblingMatchByLastName: true,
}

export async function campAdminApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${CAMP_ADMIN_API}/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Hiba")
  return data as T
}
