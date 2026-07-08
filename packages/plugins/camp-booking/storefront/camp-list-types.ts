export type CampListTicketType = {
  id: string
  name: string
  priceHuf: number
  pricingMode: string
}

export type CampListSession = {
  id: string
  label: string
  imageUrl?: string
  sessionLabel: string
  spotsLeft: number
  capacity: number
  ticketTypes: CampListTicketType[]
}

export type CampListCamp = {
  id: string
  title: string
  description?: string
  heroImage?: string
  sessions: CampListSession[]
}
