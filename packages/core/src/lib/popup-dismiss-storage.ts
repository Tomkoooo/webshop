export const POPUP_DISMISSED_STORAGE_KEY = "popup-dismissed-ids"

export function readDismissedPopupIds(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = sessionStorage.getItem(POPUP_DISMISSED_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : []
  } catch {
    return []
  }
}

export function dismissPopupId(id: string): void {
  if (typeof window === "undefined") return
  const current = readDismissedPopupIds()
  if (current.includes(id)) return
  sessionStorage.setItem(POPUP_DISMISSED_STORAGE_KEY, JSON.stringify([...current, id]))
}

export function isExternalPopupHref(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://")
}
