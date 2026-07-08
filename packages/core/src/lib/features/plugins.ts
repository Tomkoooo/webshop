/** Admin URL prefix for plugin surfaces. */
export const PLUGIN_ADMIN_PREFIX = "/admin/plugins"

/** Public API prefix for plugin handlers. */
export const PLUGIN_API_PREFIX = "/api/plugins"

export function isPluginAdminPath(pathname: string): boolean {
  return pathname === PLUGIN_ADMIN_PREFIX || pathname.startsWith(`${PLUGIN_ADMIN_PREFIX}/`)
}

export function isPluginApiPath(pathname: string): boolean {
  return pathname === PLUGIN_API_PREFIX || pathname.startsWith(`${PLUGIN_API_PREFIX}/`)
}

export function parsePluginAdminPath(pathname: string): { pluginId: string; path: string[] } | null {
  if (!pathname.startsWith(`${PLUGIN_ADMIN_PREFIX}/`)) return null
  const rest = pathname.slice(PLUGIN_ADMIN_PREFIX.length + 1)
  const segments = rest.split("/").filter(Boolean)
  if (segments.length === 0) return null
  const [pluginId, ...path] = segments
  return { pluginId, path }
}

export function parsePluginApiPath(pathname: string): { pluginId: string; path: string[] } | null {
  if (!pathname.startsWith(`${PLUGIN_API_PREFIX}/`)) return null
  const rest = pathname.slice(PLUGIN_API_PREFIX.length + 1)
  const segments = rest.split("/").filter(Boolean)
  if (segments.length === 0) return null
  const [pluginId, ...path] = segments
  return { pluginId, path }
}
