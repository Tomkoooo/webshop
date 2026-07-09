/** Longest-prefix active nav (tCrm pattern) — parent routes don't stay active with children. */
export function resolveActiveNavHref(pathname: string, hrefs: string[]): string | null {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname

  const matches = hrefs.filter((href) => normalized === href || normalized.startsWith(`${href}/`))
  if (matches.length === 0) return null

  return matches.sort((a, b) => b.length - a.length)[0] ?? null
}

export function isNavItemActive(pathname: string, href: string, siblingHrefs: string[]): boolean {
  return resolveActiveNavHref(pathname, siblingHrefs) === href
}
