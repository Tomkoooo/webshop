/** Normalize pathname: leading slash, no trailing slash except root. */
export function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") return "/"
  const trimmed = pathname.startsWith("/") ? pathname : `/${pathname}`
  return trimmed.replace(/\/+$/, "") || "/"
}

/** Parse a stored target path (may include query string). */
export function parseTargetPath(target: string): { pathname: string; searchParams: URLSearchParams | null } {
  const trimmed = target.trim()
  if (!trimmed) return { pathname: "/", searchParams: null }

  const qIndex = trimmed.indexOf("?")
  const pathPart = qIndex >= 0 ? trimmed.slice(0, qIndex) : trimmed
  const queryPart = qIndex >= 0 ? trimmed.slice(qIndex + 1) : ""

  const pathname = normalizePathname(pathPart || "/")
  const searchParams = queryPart ? new URLSearchParams(queryPart) : null
  return { pathname, searchParams }
}

/** Whether stored query params are a subset of current (order-independent). */
function queryParamsMatch(
  required: URLSearchParams,
  current: URLSearchParams
): boolean {
  for (const [key, value] of required.entries()) {
    if (current.get(key) !== value) return false
  }
  return true
}

/**
 * Match current storefront location against a stored target path.
 * - Path-only targets match any query on that pathname.
 * - Targets with query require those params on the current URL.
 */
export function matchesTargetPath(
  currentPathname: string,
  currentSearch: string,
  target: string
): boolean {
  const current = normalizePathname(currentPathname)
  const { pathname: targetPath, searchParams: requiredParams } = parseTargetPath(target)

  if (current !== targetPath) return false

  if (!requiredParams || [...requiredParams.keys()].length === 0) {
    return true
  }

  const currentParams = new URLSearchParams(
    currentSearch.startsWith("?") ? currentSearch.slice(1) : currentSearch
  )
  return queryParamsMatch(requiredParams, currentParams)
}

/** True if any target path matches the current location. */
export function matchesAnyTargetPath(
  currentPathname: string,
  currentSearch: string,
  targets: readonly string[]
): boolean {
  return targets.some((t) => matchesTargetPath(currentPathname, currentSearch, t))
}
