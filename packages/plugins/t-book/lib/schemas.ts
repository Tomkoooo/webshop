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
  maxGuests: z.number().int().min(1).max(50).nullable().optional(),
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

export const tBookRegistrationFieldsModeSchema = z.enum(["extend", "replace"]).default("extend")

export const eventGroupInputSchema = z.object({
  name: z.string().min(1, "Név kötelező"),
  description: z.string().optional().default(""),
  status: tBookStatusSchema.default("draft"),
  defaultBookingOptions: z.array(tBookOptionDefSchema).default([]),
  defaultAttendeeFieldSchema: z.array(tBookAttendeeFieldDefSchema).default([]),
  defaultPriceBasis: tBookPriceBasisSchema.default("net"),
  defaultVatPercent: tBookVatPercentSchema,
  listOnTBookSite: z.boolean().default(false),
  listingTitle: z.string().optional().default(""),
  listingUrl: z.string().optional().default(""),
  listingImage: z.string().optional().default(""),
  defaultHeroImage: z.string().optional().default(""),
  voucherHeaderImage: z.string().optional().default(""),
})

/**
 * Partial group PATCH — no Zod defaults (defaults on .partial() would overwrite
 * omitted fields, e.g. status→draft or voucherHeaderImage→"").
 */
export const eventGroupUpdateSchema = z.object({
  name: z.string().min(1, "Név kötelező").optional(),
  description: z.string().optional(),
  status: tBookStatusSchema.optional(),
  defaultBookingOptions: z.array(tBookOptionDefSchema).optional(),
  defaultAttendeeFieldSchema: z.array(tBookAttendeeFieldDefSchema).optional(),
  defaultPriceBasis: z.enum(["net", "gross"]).optional(),
  defaultVatPercent: z.number().min(0).max(100).optional(),
  listOnTBookSite: z.boolean().optional(),
  listingTitle: z.string().optional(),
  listingUrl: z.string().optional(),
  listingImage: z.string().optional(),
  defaultHeroImage: z.string().optional(),
  voucherHeaderImage: z.string().optional(),
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

/** Accept legacy darts presets so old events still validate; they expand to `custom` at runtime. */
export const tBookEligibilityPresetSchema = z.enum([
  "none",
  "custom",
  "form_rules",
  "under18",
  "under18_female",
  "women",
])

export const tBookEligibilityFormRuleSchema = z.object({
  id: z.string().min(1),
  fieldKey: z.string().min(1),
  op: z.enum([
    "equals",
    "not_equals",
    "contains",
    "regex",
    "min",
    "max",
    "min_age",
    "max_age",
    "in",
    "not_in",
  ]),
  value: z.string().default(""),
  message: z.string().optional(),
})

export const tBookEligibilityFormRulesSchema = z
  .object({
    logic: z.enum(["and", "or"]).default("and"),
    rules: z.array(tBookEligibilityFormRuleSchema).default([]),
  })
  .nullable()
  .optional()

export const tBookPricingRuleSchema = z.object({
  id: z.string().min(1),
  enabled: z.boolean().default(true),
  label: z.string().min(1),
  when: z.enum(["always", "with_hotel", "without_hotel", "with_package"]),
  action: z.enum([
    "set_ticket_fee",
    "adjust_ticket",
    "adjust_accommodation",
    "adjust_total",
  ]),
  amount: z.number(),
  amountMode: z.enum([
    "fixed",
    "per_person",
    "per_accommodation_guest",
    "percent_accommodation",
    "percent_ticket",
  ]),
})

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
  /** Players per ticket/team — drives roster forms and hotel headcount. */
  playersPerTicket: z.number().int().min(1).max(100).default(1),
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
  attendeeFieldSchemaMode: tBookRegistrationFieldsModeSchema,
  eligibilityPreset: tBookEligibilityPresetSchema.default("none"),
  eligibilityMinAge: z.number().int().min(0).max(120).nullable().optional(),
  eligibilityMaxAge: z.number().int().min(0).max(120).nullable().optional(),
  eligibilityAllowedGenders: z.array(z.string()).default([]),
  eligibilityBirthDateFieldKey: z.string().nullable().optional(),
  eligibilityGenderFieldKey: z.string().nullable().optional(),
  eligibilityFormRules: tBookEligibilityFormRulesSchema,
  pricingRules: z.array(tBookPricingRuleSchema).default([]),
  status: tBookStatusSchema.default("draft"),
  sortOrder: z.number().int().default(0),
})

/** Partial event PATCH — no Zod defaults / preprocess (avoids wiping omitted fields). */
export const eventUpdateSchema = z.object({
  groupId: z.string().nullable().optional(),
  name: z.string().min(1, "Név kötelező").optional(),
  description: z.string().optional(),
  location: tBookLocationSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  startTime: z
    .union([z.null(), z.string().regex(TBOOK_TIME_PATTERN, "Érvényes időpont: HH:mm (pl. 09:00)")])
    .optional(),
  endTime: z
    .union([z.null(), z.string().regex(TBOOK_TIME_PATTERN, "Érvényes időpont: HH:mm (pl. 09:00)")])
    .optional(),
  currency: z.string().min(3).max(3).optional(),
  ticketFeeHuf: z.number().min(0).optional(),
  ticketFeeMode: z.enum(["per_person", "per_booking", "per_team"]).optional(),
  registrationUnit: z.enum(["person", "team"]).optional(),
  playersPerTicket: z.number().int().min(1).max(100).optional(),
  teamMemberLimit: z.number().int().min(1).max(100).nullable().optional(),
  teamMemberFieldSchema: z.array(tBookAttendeeFieldDefSchema).optional(),
  ticketPriceBasis: z.enum(["net", "gross"]).optional(),
  ticketVatPercent: z.number().min(0).max(100).optional(),
  capacity: z.number().int().min(0).nullable().optional(),
  heroImage: z.string().optional(),
  voucherHeaderImage: z.string().optional(),
  vouchersEnabled: z.boolean().optional(),
  attendeeFieldSchema: z.array(tBookAttendeeFieldDefSchema).optional(),
  attendeeFieldSchemaMode: z.enum(["extend", "replace"]).optional(),
  eligibilityPreset: tBookEligibilityPresetSchema.optional(),
  eligibilityMinAge: z.number().int().min(0).max(120).nullable().optional(),
  eligibilityMaxAge: z.number().int().min(0).max(120).nullable().optional(),
  eligibilityAllowedGenders: z.array(z.string()).optional(),
  eligibilityBirthDateFieldKey: z.string().nullable().optional(),
  eligibilityGenderFieldKey: z.string().nullable().optional(),
  eligibilityFormRules: tBookEligibilityFormRulesSchema,
  pricingRules: z.array(tBookPricingRuleSchema).optional(),
  status: tBookStatusSchema.optional(),
  sortOrder: z.number().int().optional(),
})

export const hotelInputBaseSchema = z.object({
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

export const hotelInputSchema = hotelInputBaseSchema.refine(
  (data) => Boolean(data.groupId || data.eventId),
  {
    message: "groupId vagy eventId kötelező",
  }
)

/**
 * Partial hotel PATCH — no Zod defaults (`.partial()` on create schema would
 * apply defaults for omitted keys and wipe e.g. status / gallery).
 */
export const hotelInputUpdateSchema = z.object({
  groupId: z.string().optional(),
  eventId: z.string().optional(),
  name: z.string().min(1, "Név kötelező").optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  distanceFromVenueKm: z.number().min(0).nullable().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  gallery: z.array(z.string()).optional(),
  currency: z.string().min(3).max(3).optional(),
  registrationFieldSchema: z.array(tBookAttendeeFieldDefSchema).optional(),
  pricing: tBookHotelPricingSchema.optional(),
  status: tBookStatusSchema.optional(),
  sortOrder: z.number().int().optional(),
})

export const tBookBillingTypeSchema = z.enum(["personal", "company", "sport"])

export type TBookBillingType = z.infer<typeof tBookBillingTypeSchema>

export const tBookBillingSchema = z
  .object({
    billingType: tBookBillingTypeSchema.default("personal"),
    name: z.string().min(1, "Számlázási név kötelező"),
    zip: z.string().min(1, "Irányítószám kötelező"),
    city: z.string().min(1, "Város kötelező"),
    street: z.string().min(1, "Cím kötelező"),
    countryCode: z.string().default("HU"),
    taxNumber: z.string().optional().default(""),
  })
  .superRefine((data, ctx) => {
    if (data.billingType === "company" && !data.taxNumber?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Adószám kötelező cég esetén",
        path: ["taxNumber"],
      })
    }
  })

export const selectionsSchema = z.record(
  z.string(),
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.record(z.string(), z.number().int().min(0)),
  ])
)

export const quoteRequestSchema = z.object({
  eventId: z.string().min(1),
  guests: z.number().int().min(1).max(50),
  /** Hotel headcount; omit for all entries. Use 0 with no hotelId for tickets-only. */
  accommodationGuests: z.number().int().min(0).max(200).nullable().optional(),
  hotelId: z.string().nullable().optional(),
  nights: z.number().int().min(1).max(60).nullable().optional(),
  selections: selectionsSchema.nullable().optional(),
})

export const createBookingSchema = z.object({
  eventId: z.string().min(1),
  guests: z.number().int().min(1).max(50),
  accommodationGuests: z.number().int().min(0).max(200).nullable().optional(),
  customer: z.object({
    name: z.string().min(1, "Név kötelező"),
    email: z.string().email("Érvényes email szükséges"),
    phone: z.string().min(6, "Telefonszám kötelező"),
    note: z.string().max(2000).optional().default(""),
  }),
  billing: tBookBillingSchema,
  returnBaseUrl: z.string().url().optional(),
  hotelId: z.string().nullable().optional(),
  nights: z.number().int().min(1).max(60).nullable().optional(),
  selections: selectionsSchema.nullable().optional(),
  attendees: z.array(tBookBookingAttendeeSchema).optional().default([]),
})

export type EventGroupInput = z.infer<typeof eventGroupInputSchema>
export type EventGroupUpdateInput = z.infer<typeof eventGroupUpdateSchema>
export type EventInput = z.infer<typeof eventInputSchema>
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>
export type HotelInput = z.infer<typeof hotelInputSchema>
export type HotelUpdateInput = z.infer<typeof hotelInputUpdateSchema>
export type QuoteRequest = z.infer<typeof quoteRequestSchema>
export type CreateBookingInput = z.infer<typeof createBookingSchema>
