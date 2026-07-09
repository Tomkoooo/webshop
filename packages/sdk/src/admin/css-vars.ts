import type { AdminLayoutTokens, AdminTokens } from "./tokens"

function toKebab(key: string): string {
  return key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
}

/** CSS custom properties for `.admin-shell` (e.g. inline style or SSR). */
export function adminTokensToCssVars(
  tokens: AdminTokens,
  layout?: Partial<AdminLayoutTokens>
): Record<string, string> {
  const vars: Record<string, string> = {}
  for (const [key, value] of Object.entries(tokens)) {
    vars[`--admin-${toKebab(key)}`] = value
  }
  if (layout) {
    for (const [key, value] of Object.entries(layout)) {
      vars[`--admin-${toKebab(key)}`] = value
    }
  }
  return vars
}
