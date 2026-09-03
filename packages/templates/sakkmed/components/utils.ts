/** Split pipe-delimited CMS copy into chips without changing the source string. */
export function splitPipeItems(value: string): string[] {
  return value
    .split(/\s*\|\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/** True when body looks like a multi-line spec sheet (HUD layout). */
export function looksLikeSpecBody(body: string): boolean {
  const lines = body.split("\n").filter((l) => l.trim())
  if (lines.length < 2) return false
  const shortLines = lines.filter((l) => l.length < 80).length
  return shortLines / lines.length >= 0.6
}

export function padIndex(n: number): string {
  return String(n).padStart(2, "0")
}
