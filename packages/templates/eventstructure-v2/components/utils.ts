/** Split pipe-delimited CMS copy into chips without changing the source string. */
export function splitPipeItems(value: string): string[] {
  return value
    .split(/\s*\|\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function padIndex(n: number): string {
  return String(n).padStart(2, "0")
}
