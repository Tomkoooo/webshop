import type { TBookEligibilityRulesConfig } from "./eligibility"
import { normalizeEligibilityFormRules } from "./eligibility"

/** Eligibility fields safe to expose on the public booking API (no secrets). */
export type TBookPublicEligibility = {
  eligibilityPreset: string
  eligibilityMinAge: number | null
  eligibilityMaxAge: number | null
  eligibilityAllowedGenders: string[] | null
  eligibilityBirthDateFieldKey: string | null
  eligibilityGenderFieldKey: string | null
  eligibilityFormRules: TBookEligibilityRulesConfig | null
}

type EligibilitySource = {
  eligibilityPreset?: string | null
  eligibilityMinAge?: number | null
  eligibilityMaxAge?: number | null
  eligibilityAllowedGenders?: string[] | null
  eligibilityBirthDateFieldKey?: string | null
  eligibilityGenderFieldKey?: string | null
  eligibilityFormRules?: TBookEligibilityRulesConfig | null
}

/** Serialize organizer eligibility rules for the storefront wizard (inline validation). */
export function publicEligibilityFromEvent(event: EligibilitySource): TBookPublicEligibility {
  const genders = event.eligibilityAllowedGenders
  return {
    eligibilityPreset: event.eligibilityPreset ?? "none",
    eligibilityMinAge: event.eligibilityMinAge ?? null,
    eligibilityMaxAge: event.eligibilityMaxAge ?? null,
    eligibilityAllowedGenders:
      genders && genders.length > 0 ? genders.map((g) => String(g)) : null,
    eligibilityBirthDateFieldKey: event.eligibilityBirthDateFieldKey?.trim() || null,
    eligibilityGenderFieldKey: event.eligibilityGenderFieldKey?.trim() || null,
    eligibilityFormRules: normalizeEligibilityFormRules(event.eligibilityFormRules),
  }
}
