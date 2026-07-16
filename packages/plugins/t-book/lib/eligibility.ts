import type { TBookAttendeeFieldDef, TBookBookingAttendee } from "./attendee-fields"

export type TBookEligibilityPreset = "none" | "under18" | "under18_female" | "women" | "custom"

export type TBookEligibilityRules = {
  minAge: number | null
  maxAge: number | null
  allowedGenders: string[] | null
  birthDateFieldKey: string | null
  genderFieldKey: string | null
}

export type EligibilityEventLike = {
  eligibilityPreset?: TBookEligibilityPreset
  eligibilityMinAge?: number | null
  eligibilityMaxAge?: number | null
  eligibilityAllowedGenders?: string[] | null
  eligibilityBirthDateFieldKey?: string | null
  eligibilityGenderFieldKey?: string | null
  startDate?: Date | string
}

export type EligibilityIssue = {
  ticketIndex: number
  playerIndex: number | null
  message: string
}

const GENDER_FEMALE = new Set(["female", "f", "no", "nő", "n", "woman", "women", "girl", "girls"])

function normalizeGender(value: string): string {
  return value.trim().toLowerCase()
}

function isFemaleGender(value: string): boolean {
  return GENDER_FEMALE.has(normalizeGender(value))
}

function parseBirthDate(raw: string | number | undefined): Date | null {
  if (raw == null || raw === "") return null
  if (typeof raw === "number") {
    if (raw >= 1900 && raw <= 2100) return new Date(raw, 0, 1)
    return null
  }
  const trimmed = String(raw).trim()
  if (/^\d{4}$/.test(trimmed)) return new Date(Number(trimmed), 0, 1)
  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function ageOnDate(birth: Date, on: Date): number {
  let age = on.getFullYear() - birth.getFullYear()
  const monthDiff = on.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && on.getDate() < birth.getDate())) age -= 1
  return age
}

function detectBirthDateField(schemas: TBookAttendeeFieldDef[]): string | null {
  for (const field of schemas) {
    const key = field.key.toLowerCase()
    const label = field.label.toLowerCase()
    if (
      field.type === "date" ||
      key.includes("birth") ||
      key.includes("szuletes") ||
      key.includes("dob") ||
      label.includes("szület")
    ) {
      return field.key
    }
  }
  for (const field of schemas) {
    if (field.type === "number" && (field.key.includes("birth") || field.label.toLowerCase().includes("szület"))) {
      return field.key
    }
  }
  return null
}

function detectGenderField(schemas: TBookAttendeeFieldDef[]): string | null {
  for (const field of schemas) {
    const key = field.key.toLowerCase()
    const label = field.label.toLowerCase()
    if (field.type === "select" && (key.includes("gender") || key.includes("nem") || label.includes("nem"))) {
      return field.key
    }
  }
  return null
}

export function resolveEligibilityRules(event: EligibilityEventLike): TBookEligibilityRules | null {
  const preset = event.eligibilityPreset ?? "none"
  if (preset === "none") return null

  const custom = {
    minAge: event.eligibilityMinAge ?? null,
    maxAge: event.eligibilityMaxAge ?? null,
    allowedGenders:
      event.eligibilityAllowedGenders && event.eligibilityAllowedGenders.length > 0
        ? event.eligibilityAllowedGenders
        : null,
    birthDateFieldKey: event.eligibilityBirthDateFieldKey?.trim() || null,
    genderFieldKey: event.eligibilityGenderFieldKey?.trim() || null,
  }

  switch (preset) {
    case "under18":
      return { ...custom, maxAge: 17, minAge: null, allowedGenders: null }
    case "under18_female":
      return { ...custom, maxAge: 17, minAge: null, allowedGenders: ["female"] }
    case "women":
      return { ...custom, minAge: 18, maxAge: null, allowedGenders: ["female"] }
    case "custom":
      if (
        custom.minAge == null &&
        custom.maxAge == null &&
        !custom.allowedGenders?.length
      ) {
        return null
      }
      return custom
    default:
      return null
  }
}

function collectPlayerFieldRows(
  attendees: TBookBookingAttendee[],
  ticketFieldSchema: TBookAttendeeFieldDef[],
  playerFieldSchema: TBookAttendeeFieldDef[],
  fixedRoster: number | null
): Array<{ ticketIndex: number; playerIndex: number | null; fields: Record<string, string | number> }> {
  const rows: Array<{
    ticketIndex: number
    playerIndex: number | null
    fields: Record<string, string | number>
  }> = []

  attendees.forEach((attendee, ticketIndex) => {
    const members = attendee.members ?? []
    if (playerFieldSchema.length > 0 && (fixedRoster != null || members.length > 0)) {
      members.forEach((member, playerIndex) => {
        rows.push({ ticketIndex, playerIndex, fields: member.fields ?? {} })
      })
      return
    }
    if (ticketFieldSchema.length > 0) {
      rows.push({ ticketIndex, playerIndex: null, fields: attendee.fields ?? {} })
    }
  })

  return rows
}

export function validateEligibility(
  event: EligibilityEventLike,
  attendees: TBookBookingAttendee[] | undefined | null,
  ticketFieldSchema: TBookAttendeeFieldDef[],
  playerFieldSchema: TBookAttendeeFieldDef[],
  fixedRoster: number | null
): EligibilityIssue[] {
  const rules = resolveEligibilityRules(event)
  if (!rules) return []

  const allSchemas = [...ticketFieldSchema, ...playerFieldSchema]
  const birthKey = rules.birthDateFieldKey ?? detectBirthDateField(allSchemas)
  const genderKey = rules.genderFieldKey ?? detectGenderField(allSchemas)
  const referenceDate = event.startDate ? new Date(event.startDate) : new Date()
  const issues: EligibilityIssue[] = []

  const rows = collectPlayerFieldRows(
    attendees ?? [],
    ticketFieldSchema,
    playerFieldSchema,
    fixedRoster
  )

  for (const row of rows) {
    const prefix =
      row.playerIndex != null
        ? `${row.ticketIndex + 1}. jegy, ${row.playerIndex + 1}. játékos`
        : `${row.ticketIndex + 1}. jegy`

    if (birthKey && (rules.minAge != null || rules.maxAge != null)) {
      const birth = parseBirthDate(row.fields[birthKey])
      if (!birth) {
        issues.push({
          ticketIndex: row.ticketIndex,
          playerIndex: row.playerIndex,
          message: `${prefix}: születési dátum szükséges az eligibilitás ellenőrzéséhez.`,
        })
      } else {
        const age = ageOnDate(birth, referenceDate)
        if (rules.minAge != null && age < rules.minAge) {
          issues.push({
            ticketIndex: row.ticketIndex,
            playerIndex: row.playerIndex,
            message: `${prefix}: minimum ${rules.minAge} éves kor szükséges (életkor: ${age}).`,
          })
        }
        if (rules.maxAge != null && age > rules.maxAge) {
          issues.push({
            ticketIndex: row.ticketIndex,
            playerIndex: row.playerIndex,
            message: `${prefix}: legfeljebb ${rules.maxAge} éves lehet (életkor: ${age}).`,
          })
        }
      }
    }

    if (genderKey && rules.allowedGenders?.length) {
      const raw = row.fields[genderKey]
      if (raw == null || String(raw).trim() === "") {
        issues.push({
          ticketIndex: row.ticketIndex,
          playerIndex: row.playerIndex,
          message: `${prefix}: nem megadása kötelező ehhez az eseményhez.`,
        })
      } else {
        const femaleOnly = rules.allowedGenders.every((g) => normalizeGender(g) === "female")
        if (femaleOnly && !isFemaleGender(String(raw))) {
          issues.push({
            ticketIndex: row.ticketIndex,
            playerIndex: row.playerIndex,
            message: `${prefix}: ez az esemény csak női résztvevők számára nyitott.`,
          })
        }
      }
    }
  }

  return issues
}

export const ELIGIBILITY_PRESET_LABELS: Record<TBookEligibilityPreset, string> = {
  none: "Nincs korlátozás",
  under18: "U18 (18 év alatti)",
  under18_female: "U18 lányok",
  women: "Női verseny (18+)",
  custom: "Egyedi szabályok",
}
