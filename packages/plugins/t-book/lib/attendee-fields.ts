import { slugifyHotelKey } from "./hotel-pricing"
import type { TBookRegistrationUnit } from "./registration-fields"
import { tbookT } from "./i18n"

export type TBookAttendeeFieldType = "text" | "email" | "phone" | "number" | "date" | "select"

export type TBookAttendeeFieldChoice = {
  value: string
  label: string
}

export type TBookAttendeeFieldDef = {
  key: string
  label: string
  type: TBookAttendeeFieldType
  required?: boolean
  helpText?: string
  choices?: TBookAttendeeFieldChoice[]
  min?: number
  max?: number
  sortOrder?: number
}

export type TBookAttendeeFieldValue = string | number

export type TBookBookingAttendee = {
  fields: Record<string, TBookAttendeeFieldValue>
  /** Listed team members when registration unit is team. */
  members?: TBookBookingTeamMember[]
}

export type TBookBookingTeamMember = {
  fields: Record<string, TBookAttendeeFieldValue>
}

export type AttendeeValidationIssue = {
  index: number
  fieldKey: string
  message: string
  /** Set when this issue belongs to a team member row, so callers don't need to parse `message`. */
  memberIndex?: number
}

const FIELD_TYPE_LABELS: Record<TBookAttendeeFieldType, string> = {
  text: "Szöveg",
  email: "E-mail",
  phone: "Telefon",
  number: "Szám",
  date: "Dátum",
  select: "Választó",
}

export { FIELD_TYPE_LABELS }

function uniqueKey(base: string, used: Set<string>, fallback: string): string {
  const slug = slugifyHotelKey(base) || fallback
  if (!used.has(slug)) {
    used.add(slug)
    return slug
  }
  let index = 2
  while (used.has(`${slug}_${index}`)) index += 1
  const key = `${slug}_${index}`
  used.add(key)
  return key
}

/** Prefer stable English keys for common gender labels so eligibility rules match. */
const GENDER_LABEL_VALUES: Record<string, string> = {
  female: "female",
  woman: "female",
  women: "female",
  "nő": "female",
  noi: "female",
  male: "male",
  man: "male",
  men: "male",
  "férfi": "male",
  ferfi: "male",
}

function preferredChoiceValue(label: string, currentValue: string | undefined): string | undefined {
  if (currentValue && /^[a-z0-9_]+$/.test(currentValue) && currentValue.length > 0) {
    return currentValue
  }
  return GENDER_LABEL_VALUES[label.trim().toLowerCase()]
}

function resolveKey(
  label: string,
  currentKey: string | undefined,
  used: Set<string>,
  fallback: string
): string {
  if (currentKey && /^[a-z0-9_]+$/.test(currentKey) && !used.has(currentKey)) {
    used.add(currentKey)
    return currentKey
  }
  return uniqueKey(label, used, fallback)
}

/** Auto-assign internal keys from labels (hidden from moderators). */
export function assignAttendeeFieldKeys(fields: TBookAttendeeFieldDef[]): TBookAttendeeFieldDef[] {
  const used = new Set<string>()
  return fields.map((field, index) => {
    const choiceValues = new Set<string>()
    const choices = field.choices?.map((choice, choiceIndex) => {
      const preferred = preferredChoiceValue(choice.label, choice.value)
      return {
        ...choice,
        value: resolveKey(
          preferred ?? choice.label,
          preferred ?? choice.value,
          choiceValues,
          `option_${choiceIndex + 1}`
        ),
      }
    })
    return {
      ...field,
      key: resolveKey(field.label, field.key, used, `field_${index + 1}`),
      choices,
    }
  })
}

export function normalizeAttendeeFieldSchema(
  fields: TBookAttendeeFieldDef[] | undefined | null
): TBookAttendeeFieldDef[] {
  if (!fields?.length) return []
  return assignAttendeeFieldKeys(
    fields
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((field, index) => ({ ...field, sortOrder: index }))
  )
}

function fieldLabel(schema: TBookAttendeeFieldDef[], key: string): string {
  return schema.find((field) => field.key === key)?.label ?? key
}

function validateFieldValue(
  field: TBookAttendeeFieldDef,
  raw: unknown,
  locale?: string
): string | null {
  if (raw == null || raw === "") {
    return field.required ? tbookT(locale, "requiredField", { label: field.label }) : null
  }

  switch (field.type) {
    case "text":
      if (typeof raw !== "string" || !raw.trim()) return tbookT(locale, "invalidText", { label: field.label })
      return null
    case "email": {
      if (typeof raw !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim())) {
        return tbookT(locale, "invalidEmail", { label: field.label })
      }
      return null
    }
    case "phone":
      if (typeof raw !== "string" || raw.trim().length < 6) {
        return tbookT(locale, "invalidPhone", { label: field.label })
      }
      return null
    case "number": {
      const num = typeof raw === "number" ? raw : Number(raw)
      if (!Number.isFinite(num)) return tbookT(locale, "invalidNumber", { label: field.label })
      if (field.min != null && num < field.min) {
        return tbookT(locale, "minimumValue", { label: field.label, min: field.min })
      }
      if (field.max != null && num > field.max) {
        return tbookT(locale, "maximumValue", { label: field.label, max: field.max })
      }
      return null
    }
    case "date":
      if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        return tbookT(locale, "invalidDate", { label: field.label })
      }
      return null
    case "select": {
      const value = String(raw)
      const allowed = field.choices?.map((c) => c.value) ?? []
      if (!allowed.includes(value)) {
        return tbookT(locale, "invalidChoice", { label: field.label })
      }
      return null
    }
    default:
      return null
  }
}

export function validateAttendees(
  schema: TBookAttendeeFieldDef[],
  guests: number,
  attendees: TBookBookingAttendee[] | undefined | null,
  registrationUnit: TBookRegistrationUnit = "person",
  teamOpts?: {
    teamMemberFieldSchema?: TBookAttendeeFieldDef[]
    teamMemberLimit?: number | null
    /** Fixed player count per ticket (overrides flexible roster). */
    playersPerTicket?: number | null
  },
  locale?: string
): AttendeeValidationIssue[] {
  const normalized = normalizeAttendeeFieldSchema(schema)
  const memberSchema = normalizeAttendeeFieldSchema(teamOpts?.teamMemberFieldSchema)
  const memberLimit = teamOpts?.teamMemberLimit ?? null
  const fixedRoster = teamOpts?.playersPerTicket != null && teamOpts.playersPerTicket > 1
    ? teamOpts.playersPerTicket
    : null

  if (normalized.length === 0 && memberSchema.length === 0) return []

  const issues: AttendeeValidationIssue[] = []
  const rows = attendees ?? []
  const unitLabel = tbookT(locale, registrationUnit === "team" ? "unitTeam" : "unitEntry")

  if (rows.length !== guests) {
    issues.push({
      index: -1,
      fieldKey: "",
      message: tbookT(locale, "detailsRequiredForEvery", { unit: unitLabel, guests }),
    })
    return issues
  }

  const needsMembers =
    memberSchema.length > 0 &&
    (fixedRoster != null || registrationUnit === "team")

  rows.forEach((attendee, index) => {
    for (const field of normalized) {
      const message = validateFieldValue(field, attendee.fields?.[field.key], locale)
      if (message) {
        issues.push({ index, fieldKey: field.key, message })
      }
    }

    if (!needsMembers) return

    const members = attendee.members ?? []
    const requiredCount = fixedRoster ?? (members.length > 0 ? members.length : 1)

    if (fixedRoster != null && members.length !== fixedRoster) {
      issues.push({
        index,
        fieldKey: "",
        message: tbookT(locale, "exactlyPlayersRequired", {
          ordinal: index + 1,
          unit: unitLabel,
          count: fixedRoster,
        }),
      })
      return
    }

    if (members.length === 0) {
      issues.push({
        index,
        fieldKey: "",
        message: tbookT(locale, "atLeastOnePlayerRequired", { ordinal: index + 1, unit: unitLabel }),
      })
      return
    }
    if (memberLimit != null && fixedRoster == null && members.length > memberLimit) {
      issues.push({
        index,
        fieldKey: "",
        message: tbookT(locale, "atMostPlayersAllowed", {
          ordinal: index + 1,
          unit: unitLabel,
          limit: memberLimit,
        }),
      })
    }

    members.forEach((member, memberIndex) => {
      for (const field of memberSchema) {
        const message = validateFieldValue(field, member.fields?.[field.key], locale)
        if (message) {
          issues.push({
            index,
            fieldKey: field.key,
            memberIndex,
            message: tbookT(locale, "memberFieldError", {
              ordinal: index + 1,
              unit: unitLabel,
              memberOrdinal: memberIndex + 1,
              message,
            }),
          })
        }
      }
    })
  })

  return issues
}

export function normalizeAttendeePayload(
  schema: TBookAttendeeFieldDef[],
  attendees: TBookBookingAttendee[] | undefined | null,
  teamMemberSchema: TBookAttendeeFieldDef[] = []
): TBookBookingAttendee[] {
  const normalized = normalizeAttendeeFieldSchema(schema)
  const normalizedMembers = normalizeAttendeeFieldSchema(teamMemberSchema)
  if (normalized.length === 0 && normalizedMembers.length === 0) return []

  const normalizeFields = (
    fieldDefs: TBookAttendeeFieldDef[],
    rawFields: Record<string, TBookAttendeeFieldValue> | undefined
  ) => {
    const fields: Record<string, TBookAttendeeFieldValue> = {}
    for (const field of fieldDefs) {
      const raw = rawFields?.[field.key]
      if (raw == null || raw === "") continue
      if (field.type === "number") {
        fields[field.key] = typeof raw === "number" ? raw : Number(raw)
      } else {
        fields[field.key] = String(raw).trim()
      }
    }
    return fields
  }

  return (attendees ?? []).map((attendee) => {
    const fields = normalizeFields(normalized, attendee.fields)
    if (normalizedMembers.length === 0) return { fields }
    const members = (attendee.members ?? []).map((member) => ({
      fields: normalizeFields(normalizedMembers, member.fields),
    }))
    return { fields, members }
  })
}

export function formatAttendeeFieldValue(
  field: TBookAttendeeFieldDef,
  value: TBookAttendeeFieldValue | undefined
): string {
  if (value == null || value === "") return "—"
  if (field.type === "select") {
    const choice = field.choices?.find((c) => c.value === String(value))
    return choice?.label ?? String(value)
  }
  return String(value)
}

export function attendeeFieldLabelMap(schema: TBookAttendeeFieldDef[]): Map<string, string> {
  return new Map(schema.map((field) => [field.key, field.label]))
}

/** Quick-start preset for tournament events. */
export function tournamentAttendeeFieldPreset(): TBookAttendeeFieldDef[] {
  return assignAttendeeFieldKeys([
    { key: "", label: "Teljes név", type: "text", required: true, sortOrder: 0 },
    { key: "", label: "E-mail", type: "email", required: true, sortOrder: 1 },
    { key: "", label: "Születési év", type: "number", required: true, min: 1900, max: 2100, sortOrder: 2 },
    {
      key: "",
      label: "Állampolgárság",
      type: "select",
      required: true,
      sortOrder: 3,
      choices: [
        { value: "", label: "Magyarország" },
        { value: "", label: "Románia" },
        { value: "", label: "Szlovákia" },
        { value: "", label: "Ausztria" },
        { value: "", label: "Németország" },
        { value: "", label: "Egyéb" },
      ],
    },
  ])
}
