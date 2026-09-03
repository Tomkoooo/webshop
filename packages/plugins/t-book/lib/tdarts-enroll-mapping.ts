import type { TBookAttendeeFieldDef, TBookAttendeeFieldValue } from "./attendee-fields"

/**
 * Best-effort country-name/demonym → ISO 3166-1 alpha-2 lookup for the
 * free-text or select "nationality" fields moderators configure on
 * tournament events. Real event schemas are moderator-authored (not
 * guaranteed to match `tournamentAttendeeFieldPreset`), so values arrive as
 * messy free text — country names, demonyms, mixed case, with/without
 * diacritics (e.g. "danish", "Hungarian", "Northern ireland", "Malta").
 * tDarts' partner enroll `country` is optional and only used for
 * nationality eligibility — when we can't confidently map a value we omit
 * it rather than guess wrong.
 */
const COUNTRY_ALIASES: [string[], string][] = [
  [["magyarorszag", "magyar", "hungary", "hungarian", "hu"], "HU"],
  [["romania", "român", "roman", "romanian", "ro"], "RO"],
  [["szlovakia", "slovakia", "slovak", "sk"], "SK"],
  [["ausztria", "austria", "austrian", "at"], "AT"],
  [["nemetorszag", "germany", "german", "de"], "DE"],
  [["egyesult kiralysag", "united kingdom", "great britain", "britain", "british", "england", "english", "scotland", "scottish", "wales", "welsh", "northern ireland", "uk", "gb"], "GB"],
  [["ireland", "irish", "eire", "ie"], "IE"],
  [["france", "french", "fr"], "FR"],
  [["spain", "spanish", "espana", "es"], "ES"],
  [["portugal", "portuguese", "pt"], "PT"],
  [["italy", "italia", "italian", "it"], "IT"],
  [["netherlands", "holland", "dutch", "nl"], "NL"],
  [["belgium", "belgian", "belgie", "be"], "BE"],
  [["luxembourg", "luxembourgish", "lu"], "LU"],
  [["switzerland", "swiss", "schweiz", "ch"], "CH"],
  [["denmark", "danish", "danmark", "dk"], "DK"],
  [["sweden", "swedish", "sverige", "se"], "SE"],
  [["norway", "norwegian", "norge", "no"], "NO"],
  [["finland", "finnish", "suomi", "fi"], "FI"],
  [["iceland", "icelandic", "is"], "IS"],
  [["poland", "polish", "polska", "pl"], "PL"],
  [["czech republic", "czechia", "czech", "cz"], "CZ"],
  [["croatia", "croatian", "hrvatska", "hr"], "HR"],
  [["slovenia", "slovenian", "si"], "SI"],
  [["serbia", "serbian", "rs"], "RS"],
  [["bosnia", "bosnian", "herzegovina", "ba"], "BA"],
  [["montenegro", "montenegrin", "me"], "ME"],
  [["north macedonia", "macedonia", "macedonian", "mk"], "MK"],
  [["albania", "albanian", "al"], "AL"],
  [["greece", "greek", "gr"], "GR"],
  [["cyprus", "cypriot", "cy"], "CY"],
  [["turkey", "turkiye", "turkish", "tr"], "TR"],
  [["bulgaria", "bulgarian", "bg"], "BG"],
  [["ukraine", "ukrainian", "ua"], "UA"],
  [["belarus", "belarusian", "by"], "BY"],
  [["moldova", "moldovan", "md"], "MD"],
  [["lithuania", "lithuanian", "lt"], "LT"],
  [["latvia", "latvian", "lv"], "LV"],
  [["estonia", "estonian", "ee"], "EE"],
  [["russia", "russian", "ru"], "RU"],
  [["malta", "maltese", "mt"], "MT"],
  [["monaco", "monacan", "monegasque", "mc"], "MC"],
  [["andorra", "andorran", "ad"], "AD"],
  [["san marino", "sammarinese", "sm"], "SM"],
  [["liechtenstein", "li"], "LI"],
  [["united states", "usa", "america", "american", "us"], "US"],
  [["canada", "canadian", "ca"], "CA"],
  [["australia", "australian", "au"], "AU"],
  [["new zealand", "kiwi", "nz"], "NZ"],
  [["south africa", "south african", "za"], "ZA"],
]

function buildCountryTable(): Map<string, string> {
  const table = new Map<string, string>()
  for (const [aliases, iso2] of COUNTRY_ALIASES) {
    for (const alias of aliases) table.set(alias, iso2)
  }
  return table
}

const COUNTRY_TABLE = buildCountryTable()

function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "")
}

function normalizeCountryKey(value: string): string {
  return stripDiacritics(value.trim().toLowerCase()).replace(/[^a-z ]/g, "").trim()
}

function guessCountryIso2(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const key = normalizeCountryKey(raw)
  if (!key) return undefined
  // Already a bare ISO2 code (e.g. moderator-entered "HU").
  if (/^[a-z]{2}$/.test(key) && COUNTRY_TABLE.has(key)) return COUNTRY_TABLE.get(key)
  return COUNTRY_TABLE.get(key) ?? COUNTRY_TABLE.get(key.replace(/\bs$/, ""))
}

const NAME_KEYWORDS = ["nev", "name"]
const COUNTRY_KEYWORDS = [
  "allampolgar",
  "nemzetiseg",
  "country",
  "nationality",
  "citizenship",
  "orszag",
]
const DOB_KEYWORDS = ["szulet", "birth", "dob"]

function fieldLabelKey(field: TBookAttendeeFieldDef): string {
  return stripDiacritics(`${field.key} ${field.label}`.toLowerCase())
}

function findFieldByKeywords(
  schema: TBookAttendeeFieldDef[],
  keywords: string[],
  types?: TBookAttendeeFieldDef["type"][]
): TBookAttendeeFieldDef | undefined {
  return schema.find((f) => {
    if (types && !types.includes(f.type)) return false
    const haystack = fieldLabelKey(f)
    return keywords.some((kw) => haystack.includes(kw))
  })
}

export type TDartsParticipantContact = {
  email: string
  name: string
  country?: string
  /** ISO date (YYYY-MM-DD), only when the schema has a genuine `date`-type field. */
  birthDate?: string
}

/**
 * Pull an enroll-ready contact out of one attendee/team-member `fields` row.
 * Field keys are moderator-assigned slugs with no fixed schema, so fields
 * are matched by label/key keywords first (Hungarian + English), falling
 * back to matching by declared field `type` for email (unambiguous) and
 * name (first required text field). Country is only ever taken from a
 * keyword-matched field — never guessed from an arbitrary select field,
 * since that has previously matched unrelated fields like gender.
 */
export function extractParticipantContact(
  schema: TBookAttendeeFieldDef[],
  fields: Record<string, TBookAttendeeFieldValue> | undefined,
  fallback: { name: string; email: string }
): TDartsParticipantContact {
  const values = fields ?? {}

  const emailField = schema.find((f) => f.type === "email") ?? findFieldByKeywords(schema, ["email", "mail"])
  const email = (emailField ? String(values[emailField.key] ?? "") : "").trim() || fallback.email

  const nameField =
    findFieldByKeywords(schema, NAME_KEYWORDS, ["text"]) ??
    schema.find((f) => f.type === "text" && f.required) ??
    schema.find((f) => f.type === "text")
  const name = (nameField ? String(values[nameField.key] ?? "") : "").trim() || fallback.name

  const countryField = findFieldByKeywords(schema, COUNTRY_KEYWORDS, ["text", "select"])
  let country: string | undefined
  if (countryField) {
    const raw = values[countryField.key]
    if (countryField.type === "select") {
      const choiceLabel = countryField.choices?.find((c) => c.value === raw)?.label
      country = guessCountryIso2(choiceLabel) ?? guessCountryIso2(raw != null ? String(raw) : undefined)
    } else {
      country = guessCountryIso2(raw != null ? String(raw) : undefined)
    }
  }

  const dobField =
    schema.find((f) => f.type === "date") ?? findFieldByKeywords(schema, DOB_KEYWORDS, ["date"])
  let birthDate: string | undefined
  if (dobField) {
    const raw = values[dobField.key]
    if (raw != null && /^\d{4}-\d{2}-\d{2}$/.test(String(raw))) {
      birthDate = String(raw)
    }
  }

  return { email, name, country, birthDate }
}
