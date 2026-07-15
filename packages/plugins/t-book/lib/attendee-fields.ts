import { slugifyHotelKey } from "./hotel-pricing"
import type { TBookRegistrationUnit } from "./registration-fields"

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

export type AttendeeValidationIssue = { index: number; fieldKey: string; message: string }

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
    const choices = field.choices?.map((choice, choiceIndex) => ({
      ...choice,
      value: resolveKey(choice.label, choice.value, choiceValues, `option_${choiceIndex + 1}`),
    }))
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
  raw: unknown
): string | null {
  if (raw == null || raw === "") {
    return field.required ? `Kötelező mező: ${field.label}` : null
  }

  switch (field.type) {
    case "text":
      if (typeof raw !== "string" || !raw.trim()) return `${field.label}: érvénytelen szöveg`
      return null
    case "email": {
      if (typeof raw !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim())) {
        return `${field.label}: érvénytelen e-mail`
      }
      return null
    }
    case "phone":
      if (typeof raw !== "string" || raw.trim().length < 6) {
        return `${field.label}: érvénytelen telefonszám`
      }
      return null
    case "number": {
      const num = typeof raw === "number" ? raw : Number(raw)
      if (!Number.isFinite(num)) return `${field.label}: érvénytelen szám`
      if (field.min != null && num < field.min) {
        return `${field.label}: minimum ${field.min}`
      }
      if (field.max != null && num > field.max) {
        return `${field.label}: maximum ${field.max}`
      }
      return null
    }
    case "date":
      if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        return `${field.label}: érvénytelen dátum (YYYY-MM-DD)`
      }
      return null
    case "select": {
      const value = String(raw)
      const allowed = field.choices?.map((c) => c.value) ?? []
      if (!allowed.includes(value)) {
        return `${field.label}: érvénytelen választás`
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
  }
): AttendeeValidationIssue[] {
  const normalized = normalizeAttendeeFieldSchema(schema)
  const memberSchema = normalizeAttendeeFieldSchema(teamOpts?.teamMemberFieldSchema)
  const memberLimit = teamOpts?.teamMemberLimit ?? null

  if (normalized.length === 0 && memberSchema.length === 0) return []

  const issues: AttendeeValidationIssue[] = []
  const rows = attendees ?? []
  const unitLabel = registrationUnit === "team" ? "csapat" : "résztvevő"

  if (rows.length !== guests) {
    issues.push({
      index: -1,
      fieldKey: "",
      message: `Minden ${unitLabel} adata kötelező (${guests} db).`,
    })
    return issues
  }

  rows.forEach((attendee, index) => {
    for (const field of normalized) {
      const message = validateFieldValue(field, attendee.fields?.[field.key])
      if (message) {
        issues.push({ index, fieldKey: field.key, message })
      }
    }

    if (registrationUnit !== "team" || memberSchema.length === 0) return

    const members = attendee.members ?? []
    if (members.length === 0) {
      issues.push({
        index,
        fieldKey: "",
        message: `${index + 1}. csapat: legalább egy csapattag adata kötelező.`,
      })
      return
    }
    if (memberLimit != null && members.length > memberLimit) {
      issues.push({
        index,
        fieldKey: "",
        message: `${index + 1}. csapat: legfeljebb ${memberLimit} csapattag adható meg.`,
      })
    }

    members.forEach((member, memberIndex) => {
      for (const field of memberSchema) {
        const message = validateFieldValue(field, member.fields?.[field.key])
        if (message) {
          issues.push({
            index,
            fieldKey: field.key,
            message: `${index + 1}. csapat, ${memberIndex + 1}. tag: ${message}`,
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
