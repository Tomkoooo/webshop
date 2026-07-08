/** Known seed/placeholder values — treated as empty on the storefront. */
const PLACEHOLDER_CONTACT_VALUES = new Set([
  "+36...",
  "+1 555 000 0000",
  "+1 (555) 010-2030",
  "hello@example.com",
  "123 Example Street, Example City",
  "123 Placeholder Avenue, Lorem City",
  "Company address",
])

/**
 * Whether a contact field should be shown on the storefront (phone, email, address).
 */
export function hasContactFieldValue(value: string | undefined | null): boolean {
  if (value == null) return false
  const trimmed = value.trim()
  if (!trimmed) return false
  return !PLACEHOLDER_CONTACT_VALUES.has(trimmed)
}

/**
 * Prefer CMS/block value, then company/shop fallback; returns "" when neither is set.
 */
export function resolveContactDisplayField(
  primary?: string | null,
  fallback?: string | null
): string {
  if (hasContactFieldValue(primary)) return primary!.trim()
  if (hasContactFieldValue(fallback)) return fallback!.trim()
  return ""
}
