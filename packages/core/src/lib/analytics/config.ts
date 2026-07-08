export function isAnalyticsEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED
  if (flag === "0" || flag?.toLowerCase() === "false") return false
  return Boolean(getGtmId() || getMetaPixelId())
}

export function getGtmId(): string | null {
  const id = process.env.NEXT_PUBLIC_GTM_ID?.trim()
  return id || null
}

export function getMetaPixelId(): string | null {
  const id = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim()
  return id || null
}
