import type { TBookOptionDef } from "./pricing-types"

/** Group-level defaults first; event/hotel options override on duplicate keys. */
export function mergeOptionSchemas(
  groupOptions: TBookOptionDef[] = [],
  localOptions: TBookOptionDef[] = []
): TBookOptionDef[] {
  const byKey = new Map<string, TBookOptionDef>()
  for (const option of groupOptions) byKey.set(option.key, option)
  for (const option of localOptions) byKey.set(option.key, option)
  return [...byKey.values()].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
}
