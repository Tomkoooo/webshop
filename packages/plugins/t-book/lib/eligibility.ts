import type { TBookAttendeeFieldDef, TBookBookingAttendee } from "./attendee-fields"
import { tbookT } from "./i18n"

/** Organizer-facing presets. Darts-specific U18/women shortcuts were removed. */
export type TBookEligibilityPreset = "none" | "custom" | "form_rules"

/** Still present on some stored events; resolved into `custom` at runtime. */
export type TBookLegacyEligibilityPreset = "under18" | "under18_female" | "women"

export type TBookEligibilityMatchOp =
  | "equals"
  | "not_equals"
  | "contains"
  | "regex"
  | "min"
  | "max"
  | "min_age"
  | "max_age"
  | "in"
  | "not_in"

export type TBookEligibilityRule = {
  id: string
  fieldKey: string
  op: TBookEligibilityMatchOp
  /** Comparison value (string/number). For `in`/`not_in`, comma-separated. */
  value: string
  /** Shown when the rule fails. */
  message?: string
}

export type TBookEligibilityRulesConfig = {
  /** Logical combination of rules. */
  logic: "and" | "or"
  rules: TBookEligibilityRule[]
}

export type TBookEligibilityRules = {
  minAge: number | null
  maxAge: number | null
  allowedGenders: string[] | null
  birthDateFieldKey: string | null
  genderFieldKey: string | null
  formRules: TBookEligibilityRulesConfig | null
}

export type EligibilityEventLike = {
  eligibilityPreset?: TBookEligibilityPreset | TBookLegacyEligibilityPreset | string
  eligibilityMinAge?: number | null
  eligibilityMaxAge?: number | null
  eligibilityAllowedGenders?: string[] | null
  eligibilityBirthDateFieldKey?: string | null
  eligibilityGenderFieldKey?: string | null
  eligibilityFormRules?: TBookEligibilityRulesConfig | null
  startDate?: Date | string
}

export type EligibilityIssue = {
  ticketIndex: number
  playerIndex: number | null
  message: string
}

/** Map common display labels / slugs to stable gender keys used in eligibility rules. */
const GENDER_ALIASES: Record<string, string> = {
  female: "female",
  woman: "female",
  women: "female",
  f: "female",
  no: "female",
  noi: "female",
  "nő": "female",
  "női": "female",
  male: "male",
  man: "male",
  men: "male",
  m: "male",
  ferfi: "male",
  "férfi": "male",
  "férfiak": "male",
}

export function canonicalizeGenderValue(value: string): string {
  const normalized = value.trim().toLowerCase()
  return GENDER_ALIASES[normalized] ?? normalized
}

function normalizeGender(value: string): string {
  return canonicalizeGenderValue(value)
}

function fieldValueMatchesAllowed(
  raw: string,
  allowed: string[],
  fieldDef: TBookAttendeeFieldDef | undefined
): boolean {
  const submitted = normalizeGender(raw)
  const allowedSet = new Set(allowed.map(normalizeGender))
  if (allowedSet.has(submitted)) return true

  // Organizers often paste display labels into allowed-values; guests submit choice values.
  if (fieldDef?.choices?.length) {
    const byValue = fieldDef.choices.find((c) => normalizeGender(c.value) === submitted)
    if (byValue && allowedSet.has(normalizeGender(byValue.label))) return true
    const byLabel = fieldDef.choices.find((c) => normalizeGender(c.label) === submitted)
    if (byLabel && allowedSet.has(normalizeGender(byLabel.value))) return true
    for (const choice of fieldDef.choices) {
      if (
        (normalizeGender(choice.value) === submitted || normalizeGender(choice.label) === submitted) &&
        (allowedSet.has(normalizeGender(choice.value)) ||
          allowedSet.has(normalizeGender(choice.label)))
      ) {
        return true
      }
    }
  }
  return false
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

function normalizeFormRules(
  raw: TBookEligibilityRulesConfig | null | undefined
): TBookEligibilityRulesConfig | null {
  if (!raw || !Array.isArray(raw.rules) || raw.rules.length === 0) return null
  const rules = raw.rules
    .filter((r) => r && typeof r === "object" && String(r.fieldKey || "").trim())
    .map((r, i) => ({
      id: String(r.id || `rule-${i}`),
      fieldKey: String(r.fieldKey).trim(),
      op: (r.op || "equals") as TBookEligibilityMatchOp,
      value: r.value != null ? String(r.value) : "",
      message: r.message != null ? String(r.message) : undefined,
    }))
  if (rules.length === 0) return null
  return { logic: raw.logic === "or" ? "or" : "and", rules }
}

type LegacyEligibilityExpandInput = {
  eligibilityPreset?: string | null
  eligibilityMinAge?: number | null
  eligibilityMaxAge?: number | null
  eligibilityAllowedGenders?: string[] | null
}

/**
 * Expand legacy darts presets into organizer-editable custom age/value fields.
 * Call when loading an event into the admin form so old data migrates on next save.
 */
export function expandLegacyEligibilityForEdit(event: LegacyEligibilityExpandInput): {
  eligibilityPreset: TBookEligibilityPreset
  eligibilityMinAge: number | null
  eligibilityMaxAge: number | null
  eligibilityAllowedGenders: string[] | null
} {
  const preset = event.eligibilityPreset ?? "none"
  const base = {
    eligibilityMinAge: event.eligibilityMinAge ?? null,
    eligibilityMaxAge: event.eligibilityMaxAge ?? null,
    eligibilityAllowedGenders:
      event.eligibilityAllowedGenders && event.eligibilityAllowedGenders.length > 0
        ? event.eligibilityAllowedGenders
        : null,
  }

  switch (preset) {
    case "under18":
      return {
        eligibilityPreset: "custom",
        eligibilityMinAge: null,
        eligibilityMaxAge: 17,
        eligibilityAllowedGenders: null,
      }
    case "under18_female":
      return {
        eligibilityPreset: "custom",
        eligibilityMinAge: null,
        eligibilityMaxAge: 17,
        eligibilityAllowedGenders: ["female"],
      }
    case "women":
      return {
        eligibilityPreset: "custom",
        eligibilityMinAge: 18,
        eligibilityMaxAge: null,
        eligibilityAllowedGenders: ["female"],
      }
    case "custom":
    case "form_rules":
      return { eligibilityPreset: preset, ...base }
    default:
      return { eligibilityPreset: "none", ...base }
  }
}

export function resolveEligibilityRules(event: EligibilityEventLike): TBookEligibilityRules | null {
  const expanded = expandLegacyEligibilityForEdit(event)
  const preset = expanded.eligibilityPreset
  if (preset === "none") return null

  const formRules = normalizeFormRules(event.eligibilityFormRules)

  const custom = {
    minAge: expanded.eligibilityMinAge,
    maxAge: expanded.eligibilityMaxAge,
    allowedGenders: expanded.eligibilityAllowedGenders,
    birthDateFieldKey: event.eligibilityBirthDateFieldKey?.trim() || null,
    genderFieldKey: event.eligibilityGenderFieldKey?.trim() || null,
    formRules,
  }

  switch (preset) {
    case "form_rules":
      if (!formRules) return null
      return {
        minAge: null,
        maxAge: null,
        allowedGenders: null,
        birthDateFieldKey: custom.birthDateFieldKey,
        genderFieldKey: custom.genderFieldKey,
        formRules,
      }
    case "custom":
      if (
        custom.minAge == null &&
        custom.maxAge == null &&
        !custom.allowedGenders?.length &&
        !formRules
      ) {
        return null
      }
      return custom
    default:
      return null
  }
}

function listValues(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

function evaluateFormRule(
  rule: TBookEligibilityRule,
  fields: Record<string, string | number>,
  fieldDefs: TBookAttendeeFieldDef[],
  referenceDate: Date
): boolean {
  const raw = fields[rule.fieldKey]
  const asString = raw == null ? "" : String(raw).trim()
  const def = fieldDefs.find((f) => f.key === rule.fieldKey)
  const expected = rule.value

  const genderLike =
    def?.type === "select" &&
    (rule.fieldKey.toLowerCase().includes("gender") ||
      rule.fieldKey.toLowerCase().includes("nem") ||
      (def.label || "").toLowerCase().includes("nem") ||
      (def.label || "").toLowerCase().includes("gender"))

  switch (rule.op) {
    case "equals":
      if (genderLike) {
        return canonicalizeGenderValue(asString) === canonicalizeGenderValue(expected)
      }
      return asString.toLowerCase() === expected.trim().toLowerCase()
    case "not_equals":
      if (genderLike) {
        return canonicalizeGenderValue(asString) !== canonicalizeGenderValue(expected)
      }
      return asString.toLowerCase() !== expected.trim().toLowerCase()
    case "contains":
      return asString.toLowerCase().includes(expected.trim().toLowerCase())
    case "regex": {
      try {
        return new RegExp(expected).test(asString)
      } catch {
        return false
      }
    }
    case "min": {
      const n = Number(asString)
      const min = Number(expected)
      return Number.isFinite(n) && Number.isFinite(min) && n >= min
    }
    case "max": {
      const n = Number(asString)
      const max = Number(expected)
      return Number.isFinite(n) && Number.isFinite(max) && n <= max
    }
    case "min_age":
    case "max_age": {
      const birth =
        def?.type === "date" || def?.type === "number"
          ? parseBirthDate(raw)
          : parseBirthDate(asString)
      if (!birth) return false
      const age = ageOnDate(birth, referenceDate)
      const bound = Number(expected)
      if (!Number.isFinite(bound)) return false
      return rule.op === "min_age" ? age >= bound : age <= bound
    }
    case "in":
      if (genderLike) {
        return listValues(expected)
          .map(canonicalizeGenderValue)
          .includes(canonicalizeGenderValue(asString))
      }
      return listValues(expected).includes(asString.toLowerCase())
    case "not_in":
      if (genderLike) {
        return !listValues(expected)
          .map(canonicalizeGenderValue)
          .includes(canonicalizeGenderValue(asString))
      }
      return !listValues(expected).includes(asString.toLowerCase())
    default:
      return true
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
  fixedRoster: number | null,
  locale?: string
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
        ? tbookT(locale, "entryPrefixPlayer", { ticket: row.ticketIndex + 1, player: row.playerIndex + 1 })
        : tbookT(locale, "entryPrefix", { ticket: row.ticketIndex + 1 })

    if (birthKey && (rules.minAge != null || rules.maxAge != null)) {
      const birth = parseBirthDate(row.fields[birthKey])
      if (!birth) {
        issues.push({
          ticketIndex: row.ticketIndex,
          playerIndex: row.playerIndex,
          message: tbookT(locale, "dobRequired", { prefix }),
        })
      } else {
        const age = ageOnDate(birth, referenceDate)
        if (rules.minAge != null && age < rules.minAge) {
          issues.push({
            ticketIndex: row.ticketIndex,
            playerIndex: row.playerIndex,
            message: tbookT(locale, "minAgeIssue", { prefix, minAge: rules.minAge, age }),
          })
        }
        if (rules.maxAge != null && age > rules.maxAge) {
          issues.push({
            ticketIndex: row.ticketIndex,
            playerIndex: row.playerIndex,
            message: tbookT(locale, "maxAgeIssue", { prefix, maxAge: rules.maxAge, age }),
          })
        }
      }
    }

    if (genderKey && rules.allowedGenders?.length) {
      const raw = row.fields[genderKey]
      const genderDef = allSchemas.find((f) => f.key === genderKey)
      if (raw == null || String(raw).trim() === "") {
        issues.push({
          ticketIndex: row.ticketIndex,
          playerIndex: row.playerIndex,
          message: tbookT(locale, "fieldRequiredForEvent", {
            prefix,
            field: genderDef?.label ?? genderKey,
          }),
        })
      } else if (!fieldValueMatchesAllowed(String(raw), rules.allowedGenders, genderDef)) {
        issues.push({
          ticketIndex: row.ticketIndex,
          playerIndex: row.playerIndex,
          message: tbookT(locale, "valueNotAllowed", { prefix, value: String(raw) }),
        })
      }
    }

    if (rules.formRules) {
      const results = rules.formRules.rules.map((rule) => {
        const ok = evaluateFormRule(rule, row.fields, allSchemas, referenceDate)
        return { rule, ok }
      })
      const passes =
        rules.formRules.logic === "or"
          ? results.some((r) => r.ok)
          : results.every((r) => r.ok)

      if (!passes) {
        const failed = results.filter((r) => !r.ok)
        const detail =
          failed[0]?.rule.message ||
          failed.map((f) => `${f.rule.fieldKey} ${f.rule.op} ${f.rule.value}`).join("; ") ||
          tbookT(locale, "formConditionsFallback")
        issues.push({
          ticketIndex: row.ticketIndex,
          playerIndex: row.playerIndex,
          message: tbookT(locale, "doesNotMeetRequirements", { prefix, detail }),
        })
      }
    }
  }

  return issues
}

export const ELIGIBILITY_PRESET_LABELS: Record<TBookEligibilityPreset, string> = {
  none: "Nincs korlátozás",
  custom: "Kor / mező érték (egyedi, régi)",
  form_rules: "Űrlapmező szabályok (ajánlott)",
}

export const ELIGIBILITY_OP_LABELS: Record<TBookEligibilityMatchOp, string> = {
  equals: "Legyen (egyenlő)",
  not_equals: "Ne legyen (elutasít ha ez)",
  contains: "Tartalmazza",
  regex: "Regex",
  min: "Minimum érték",
  max: "Maximum érték",
  min_age: "Minimum életkor",
  max_age: "Maximum életkor",
  in: "Egyik ezek közül",
  not_in: "Egyik se ezek közül",
}

export function normalizeEligibilityFormRules(
  raw: unknown
): TBookEligibilityRulesConfig | null {
  return normalizeFormRules(raw as TBookEligibilityRulesConfig)
}
