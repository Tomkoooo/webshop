/** ISO 3166-1 alpha-2 helpers for checkout + shop territory settings. */

const FALLBACK_ISO2 = [
  "HU", "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "IE", "IT", "LV", "LT",
  "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "CH", "GB", "NO", "US",
] as const

/** HU / EN display names used for autocomplete and admin copy-paste UX. */
const EXTRA_SYNONYMS: Record<string, string[]> = {
  HU: ["hungary", "magyarorszag", "hungaria", "ungarn", "ungheria", "magyar"],
  AT: ["austria", "osztrak", "osterreich"],
  RO: ["romania"],
  DE: ["germany", "nemetorszag", "deutschland"],
  GB: ["united kingdom", "uk", "great britain", "england", "anglia", "britain"],
}

let cachedRegions: string[] | null = null

export function allIsoCountryCodes(): string[] {
  if (cachedRegions) return cachedRegions
  try {
    const iv = Intl as unknown as { supportedValuesOf?: (type: string) => string[] }
    const vals = iv.supportedValuesOf?.("region")
    if (Array.isArray(vals) && vals.length) {
      cachedRegions = vals.filter((c) => typeof c === "string" && c.length === 2 && c === c.toUpperCase())
      return cachedRegions
    }
  } catch {
    /* ignore */
  }
  cachedRegions = [...FALLBACK_ISO2]
  return cachedRegions
}

export function getCountryDisplayName(code: string, locale = "hu-HU"): string {
  const cc = normalizeIso2(code)
  if (!cc) return String(code ?? "").trim() || ""
  try {
    const dn = new Intl.DisplayNames([locale, "en"], { type: "region" })
    return dn.of(cc) || cc
  } catch {
    return cc
  }
}

export function normalizeIso2(input: unknown): string | null {
  if (input == null) return null
  const raw = String(input).trim().toUpperCase()
  if (raw.length === 2 && /^[A-Z]{2}$/.test(raw)) {
    const all = allIsoCountryCodes()
    if (all.includes(raw)) return raw
  }
  return null
}

function normalizeComparable(s: string): string {
  const lower = String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
  return lower.replace(/[^a-z0-9]+/g, "")
}

type Suggestion = { code: string; labelHu: string; labelEn: string; reason: "exact" | "partial" | "synonym" }

/** Map arbitrary user input → ISO code, with ranked suggestions when ambiguous or unknown. */
export function resolveCountryInput(raw: unknown): { code: string | null; suggestions: Suggestion[] } {
  const text = typeof raw === "string" ? raw.trim() : ""
  if (!text) return { code: null, suggestions: [] }

  const asIso = normalizeIso2(text)
  if (asIso) {
    const sug: Suggestion = {
      code: asIso,
      labelHu: getCountryDisplayName(asIso, "hu-HU"),
      labelEn: getCountryDisplayName(asIso, "en"),
      reason: "exact",
    }
    return { code: asIso, suggestions: [sug] }
  }

  const comp = normalizeComparable(text)
  const out: Suggestion[] = []
  const seen = new Set<string>()
  const add = (code: string, reason: Suggestion["reason"]) => {
    const c = normalizeIso2(code)
    if (!c || seen.has(c)) return
    seen.add(c)
    out.push({
      code: c,
      labelHu: getCountryDisplayName(c, "hu-HU"),
      labelEn: getCountryDisplayName(c, "en"),
      reason,
    })
  }

  for (const [iso, syns] of Object.entries(EXTRA_SYNONYMS)) {
    for (const syn of syns) {
      if (normalizeComparable(syn) === comp || normalizeComparable(syn).includes(comp) || comp.includes(normalizeComparable(syn))) {
        add(iso, "synonym")
        break
      }
    }
  }

  const regions = allIsoCountryCodes().slice().sort((a, b) => a.localeCompare(b))
  for (const iso of regions) {
    const hu = normalizeComparable(getCountryDisplayName(iso, "hu-HU"))
    const en = normalizeComparable(getCountryDisplayName(iso, "en"))
    const isoLc = iso.toLowerCase()
    if (hu === comp || en === comp || isoLc === comp) {
      add(iso, "exact")
      continue
    }
    if (
      hu.startsWith(comp) ||
      en.startsWith(comp) ||
      (comp.length >= 3 && (hu.includes(comp) || en.includes(comp)))
    ) {
      add(iso, "partial")
    }
  }

  out.sort((a, b) => {
    const rank = { exact: 0, synonym: 1, partial: 2 }
    const d = rank[a.reason] - rank[b.reason]
    if (d !== 0) return d
    return a.labelHu.localeCompare(b.labelHu, "hu")
  })

  const dedup = out.filter((item, idx, arr) => arr.findIndex((x) => x.code === item.code) === idx).slice(0, 12)
  const uniqExact =
    dedup.find((x) => x.reason === "exact") ||
    dedup.filter((x) => x.reason === "synonym" && dedup.every((y) => y.reason !== "exact"))[0]

  const code =
    uniqExact?.reason === "exact" ||
    (uniqExact?.reason === "synonym" && dedup.filter((x) => x.reason !== "partial").length === 1)
      ? uniqExact.code
      : null

  return { code, suggestions: dedup }
}

export function formatAllowedCountriesList(codes: string[], locale = "hu-HU"): string {
  const uniq = [...new Set(codes.map((c) => normalizeIso2(c)).filter(Boolean) as string[])]
  return uniq.map((c) => getCountryDisplayName(c, locale)).join(", ")
}
