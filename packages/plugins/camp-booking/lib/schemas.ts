import { z } from "zod"

export const campDiningOptionSchema = z.enum([
  "Normál",
  "Vegetáriánus",
  "Gluténmentes",
  "Laktózmentes",
  "Sertéshúsmentes",
])

export type CampDiningOption = z.infer<typeof campDiningOptionSchema>

export const campChildSchema = z.object({
  name: z.string().min(1, "A gyerek neve kötelező"),
  lastName: z.string().optional(),
  birthDate: z.string().min(1, "Születési dátum kötelező"),
  diningOption: campDiningOptionSchema.default("Normál"),
  dietaryRequest: z.string().optional(),
  allergies: z.string().optional(),
  laptopRental: z.boolean().default(false),
  addonTicketIds: z.array(z.string()).optional(),
})

export const createHoldSchema = z.object({
  sessionId: z.string().min(1),
  ticketTypeId: z.string().min(1),
  childCount: z.number().int().min(1).max(20),
  buyerName: z.string().min(1, "Név kötelező"),
  buyerEmail: z.string().email("Érvényes email szükséges"),
  buyerPhone: z.string().min(6, "Telefonszám kötelező"),
  children: z.array(campChildSchema).min(1),
})

export type CreateHoldInput = z.infer<typeof createHoldSchema>
