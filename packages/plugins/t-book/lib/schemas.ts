import { z } from "zod"
import { DEFAULT_TBOOK_CURRENCY } from "./currency"
import { TBOOK_TIME_PATTERN } from "./event-schedule"
import { TBOOK_DEFAULT_VAT_PERCENT } from "./vat"

export const tBookAttendeeFieldChoiceSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
})

export const tBookAttendeeFieldDefSchema = z.object({
  key: z
    .string()
    .min(1)
    .regex(/^[a-z0-9_]+$/, "Kulcs: csak kisbetű, szám és aláhúzás"),
  label: z.string().min(1),
  type: z.enum(["text", "email", "phone", "number", "date", "select"]),
  required: z.boolean().optional(),
  helpText: z.string().optional(),
  choices: z.array(tBookAttendeeFieldChoiceSchema).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  sortOrder: z.number().int().optional(),
})

export const tBookBookingTeamMemberSchema = z.object({
  fields: z.record(z.string(), z.union([z.string(), z.number()])),
})

export const tBookBookingAttendeeSchema = z.object({
  fields: z.record(z.string(), z.union([z.string(), z.number()])),
  members: z.array(tBookBookingTeamMemberSchema).optional(),
})

export const tBookStatusSchema = z.enum(["draft", "active", "archived"])
export type TBookStatus = z.infer<typeof tBookStatusSchema>

export const tBookPriceBasisSchema = z.enum(["net", "gross"])
export const tBookVatPercentSchema = z.number().min(0).max(100).default(TBOOK_DEFAULT_VAT_PERCENT)

export const tBookLocationSchema = z.object({
  address: z.string().optional().default(""),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  mapEmbedUrl: z.string().optional().default(""),
})

export const tBookPriceModeSchema = z.enum([
  "fixed",
  "per_person",
  "per_night",
  "per_person_per_night",
  "percent",
])

export const tBookOptionChoiceSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  priceHuf: z.number().finite(),
  priceMode: tBookPriceModeSchema.default("fixed"),
})

export const tBookOptionDefSchema = z.object({
  key: z
    .string()
    .min(1)
    .regex(/^[a-z0-9_]+$/, "Kulcs: csak kisbetű, szám és aláhúzás"),
  label: z.string().min(1),
  type: z.enum(["select", "multiselect", "number", "checkbox"]),
  required: z.boolean().optional(),
  defaultValue: z
    .union([z.string(), z.number(), z.boolean(), z.array(z.string())])
    .nullable()
    .optional(),
  choices: z.array(tBookOptionChoiceSchema).optional(),
  unitPriceHuf: z.number().finite().optional(),
  priceMode: tBookPriceModeSchema.optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  dependsOn: z
    .object({ key: z.string().min(1), values: z.array(z.string()).min(1) })
    .nullable()
    .optional(),
  sortOrder: z.number().int().optional(),
})

export const tBookCurrencySchema = z.string().min(3).max(3).default(DEFAULT_TBOOK_CURRENCY)

export const tBookRoomTypeSchema = z.object({
  key: z
    .string()
    .min(1)
    .regex(/^[a-z0-9_]+$/, "Kulcs: csak kisbetű, szám és aláhúzás"),
  label: z.string().min(1),
  baseRateHuf: z.number().min(0),
  sortOrder: z.number().int().optional(),
})

export const tBookPackageDealSchema = z.object({
  key: z
    .string()
    .min(1)
    .regex(/^[a-z0-9_]+$/, "Kulcs: csak kisbetű, szám és aláhúzás"),
  label: z.string().min(1),
  nights: z.number().int().min(1).max(60),
  priceHuf: z.number().min(0),
  roomTypeKey: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
})

export const tBookExtrasSectionSchema = z.object({
  label: z.string().min(1),
  description: z.string().optional().default(""),
  options: z.array(tBookOptionDefSchema).default([]),
})

export const tBookAddonGroupSchema = z.object({
  key: z
    .string()
    .min(1)
    .regex(/^[a-z0-9_]+$/, "Kulcs: csak kisbetű, szám és aláhúzás"),
  label: z.string().min(1),
  description: z.string().optional().default(""),
  sortOrder: z.number().int().optional(),
  options: z.array(tBookOptionDefSchema).default([]),
})

function validateUniqueOptionKeys(
  options: z.infer<typeof tBookOptionDefSchema>[],
  ctx: z.RefinementCtx,
  label: string
) {
  const keys = new Set<string>()
  for (const option of options) {
    if (keys.has(option.key)) {
      ctx.addIssue({ code: "custom", message: `${label}: duplikált kulcs: ${option.key}` })
    }
    keys.add(option.key)
    if (
      (option.type === "select" || option.type === "multiselect") &&
      (!option.choices || option.choices.length === 0)
    ) {
      ctx.addIssue({
        code: "custom",
        message: `A(z) '${option.key}' opcióhoz választási lehetőségek szükségesek`,
      })
    }
  }
}

export const tBookAccommodationModeSchema = z.enum(["room_nights", "packages", "both"]).optional()

export const tBookHotelPricingSchema = z
  .object({
    priceBasis: tBookPriceBasisSchema.default("net"),
    vatPercent: tBookVatPercentSchema,
    accommodationMode: tBookAccommodationModeSchema,
    roomTypes: z.array(tBookRoomTypeSchema).default([]),
    packages: z.array(tBookPackageDealSchema).default([]),
    extrasSection: tBookExtrasSectionSchema.nullable().optional(),
    addonGroups: z
      .array(tBookAddonGroupSchema)
      .default([])
      .superRefine((groups, ctx) => {
        const groupKeys = new Set<string>()
        const optionKeys = new Set<string>()
        for (const group of groups) {
          if (groupKeys.has(group.key)) {
            ctx.addIssue({ code: "custom", message: `Duplikált felár-csoport: ${group.key}` })
          }
          groupKeys.add(group.key)
          for (const option of group.options) {
            if (optionKeys.has(option.key)) {
              ctx.addIssue({
                code: "custom",
                message: `Duplikált opció kulcs a szálláson: ${option.key}`,
              })
            }
            optionKeys.add(option.key)
          }
          validateUniqueOptionKeys(group.options, ctx, group.label)
        }
      }),
    /** Legacy fields — accepted on input, stripped on output */
    baseRateHuf: z.number().min(0).optional(),
    baseRateMode: z
      .enum(["per_person_per_night", "per_night", "per_person", "per_booking"])
      .optional(),
    options: z.array(tBookOptionDefSchema).optional(),
  })
  .superRefine((pricing, ctx) => {
    const hasLegacy = pricing.baseRateHuf != null || (pricing.options?.length ?? 0) > 0
    const packages = pricing.packages ?? []
    const mode =
      pricing.accommodationMode ??
      (packages.length > 0 && pricing.roomTypes.length === 0
        ? "packages"
        : packages.length > 0
          ? "both"
          : "room_nights")

    if ((mode === "room_nights" || mode === "both") && pricing.roomTypes.length === 0 && !hasLegacy) {
      ctx.addIssue({
        code: "custom",
        message: "Legalább egy szobatípus szükséges",
      })
    }
    if (mode === "packages" && packages.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Legalább egy csomagajánlat szükséges",
      })
    }
    const roomKeys = new Set<string>()
    for (const room of pricing.roomTypes) {
      if (roomKeys.has(room.key)) {
        ctx.addIssue({ code: "custom", message: `Duplikált szobatípus: ${room.key}` })
      }
      roomKeys.add(room.key)
    }
    const extrasOptions = pricing.extrasSection?.options ?? []
    if (extrasOptions.length > 0) {
      validateUniqueOptionKeys(extrasOptions, ctx, pricing.extrasSection?.label ?? "Extrák")
    }
    const packageKeys = new Set<string>()
    for (const pkg of pricing.packages ?? []) {
      if (packageKeys.has(pkg.key)) {
        ctx.addIssue({ code: "custom", message: `Duplikált csomagajánlat: ${pkg.key}` })
      }
      packageKeys.add(pkg.key)
    }
  })

/** @deprecated alias */
export const tBookAccommodationPricingSchema = tBookHotelPricingSchema

export const eventGroupInputSchema = z.object({
  name: z.string().min(1, "Név kötelező"),
  description: z.string().optional().default(""),
  status: tBookStatusSchema.default("draft"),
  defaultBookingOptions: z.array(tBookOptionDefSchema).default([]),
  defaultPriceBasis: tBookPriceBasisSchema.default("net"),
  defaultVatPercent: tBookVatPercentSchema,
  listOnTBookSite: z.boolean().default(false),
  listingTitle: z.string().optional().default(""),
  listingUrl: z.string().optional().default(""),
  listingImage: z.string().optional().default(""),
  defaultHeroImage: z.string().optional().default(""),
  voucherHeaderImage: z.string().optional().default(""),
})

export const tBookEventTimeSchema = z.preprocess(
  (value) => {
    const trimmed = String(value ?? "").trim()
    return trimmed || null
  },
  z
    .union([z.null(), z.string().regex(TBOOK_TIME_PATTERN, "Érvényes időpont: HH:mm (pl. 09:00)")])
    .optional()
)

export const eventInputSchema = z.object({
  groupId: z.string().nullable().optional(),
  name: z.string().min(1, "Név kötelező"),
  description: z.string().optional().default(""),
  location: tBookLocationSchema.optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  startTime: tBookEventTimeSchema,
  endTime: tBookEventTimeSchema,
  currency: tBookCurrencySchema.optional(),
  ticketFeeHuf: z.number().min(0),
  ticketFeeMode: z.enum(["per_person", "per_booking", "per_team"]).default("per_person"),
  registrationUnit: z.enum(["person", "team"]).default("person"),
  /** Max listed members per team registration (null = unlimited). */
  teamMemberLimit: z.number().int().min(1).max(100).nullable().optional(),
  teamMemberFieldSchema: z.array(tBookAttendeeFieldDefSchema).default([]),
  ticketPriceBasis: tBookPriceBasisSchema.default("net"),
  ticketVatPercent: tBookVatPercentSchema,
  capacity: z.number().int().min(0).nullable().optional(),
  heroImage: z.string().optional().default(""),
  voucherHeaderImage: z.string().optional().default(""),
  vouchersEnabled: z.boolean().default(true),
  attendeeFieldSchema: z.array(tBookAttendeeFieldDefSchema).default([]),
  status: tBookStatusSchema.default("draft"),
  sortOrder: z.number().int().default(0),
})

export const hotelInputSchema = z
  .object({
    groupId: z.string().optional(),
    eventId: z.string().optional(),
    name: z.string().min(1, "Név kötelező"),
    description: z.string().optional().default(""),
    address: z.string().optional().default(""),
    distanceFromVenueKm: z.number().min(0).nullable().optional(),
    contactEmail: z.string().optional().default(""),
    contactPhone: z.string().optional().default(""),
    gallery: z.array(z.string()).default([]),
    currency: tBookCurrencySchema.optional(),
    registrationFieldSchema: z.array(tBookAttendeeFieldDefSchema).default([]),
    pricing: tBookHotelPricingSchema,
    status: tBookStatusSchema.default("draft"),
    sortOrder: z.number().int().default(0),
  })
  .refine((data) => Boolean(data.groupId || data.eventId), {
    message: "groupId vagy eventId kötelező",
  })

export const selectionsSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])
)

export const quoteRequestSchema = z.object({
  eventId: z.string().min(1),
  guests: z.number().int().min(1).max(50),
  hotelId: z.string().nullable().optional(),
  nights: z.number().int().min(1).max(60).nullable().optional(),
  selections: selectionsSchema.nullable().optional(),
})

export const createBookingSchema = z.object({
  eventId: z.string().min(1),
  guests: z.number().int().min(1).max(50),
  customer: z.object({
    name: z.string().min(1, "Név kötelező"),
    email: z.string().email("Érvényes email szükséges"),
    phone: z.string().min(6, "Telefonszám kötelező"),
    note: z.string().max(2000).optional().default(""),
  }),
  billing: z
    .object({
      name: z.string().min(1),
      zip: z.string().min(1),
      city: z.string().min(1),
      street: z.string().min(1),
      countryCode: z.string().default("HU"),
      taxNumber: z.string().optional().default(""),
    })
    .nullable()
    .optional(),
  hotelId: z.string().nullable().optional(),
  nights: z.number().int().min(1).max(60).nullable().optional(),
  selections: selectionsSchema.nullable().optional(),
  attendees: z.array(tBookBookingAttendeeSchema).optional().default([]),
})

export type EventGroupInput = z.infer<typeof eventGroupInputSchema>
export type EventInput = z.infer<typeof eventInputSchema>
export type HotelInput = z.infer<typeof hotelInputSchema>
export type QuoteRequest = z.infer<typeof quoteRequestSchema>
export type CreateBookingInput = z.infer<typeof createBookingSchema>
