export const ADMIN_THEME_STORAGE_KEY = "wse-admin-theme"

export type AdminTheme = "light" | "dark"

export const DEFAULT_ADMIN_THEME: AdminTheme = "light"

/** Inline in `<head>` on admin routes to avoid a light flash before hydration. */
export const ADMIN_THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem("${ADMIN_THEME_STORAGE_KEY}");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-admin-theme",t)}}catch(e){}})();`

export function isAdminTheme(value: string | null | undefined): value is AdminTheme {
  return value === "light" || value === "dark"
}

export function readStoredAdminTheme(): AdminTheme {
  if (typeof window === "undefined") return DEFAULT_ADMIN_THEME
  try {
    const stored = window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY)
    return isAdminTheme(stored) ? stored : DEFAULT_ADMIN_THEME
  } catch {
    return DEFAULT_ADMIN_THEME
  }
}

export function writeStoredAdminTheme(theme: AdminTheme) {
  try {
    window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, theme)
  } catch {
    // ignore quota / private mode
  }
}

export function applyAdminThemeToDocument(theme: AdminTheme) {
  if (typeof document === "undefined") return
  document.documentElement.setAttribute("data-admin-theme", theme)
  document.querySelector(".admin-shell")?.setAttribute("data-admin-theme", theme)
}
