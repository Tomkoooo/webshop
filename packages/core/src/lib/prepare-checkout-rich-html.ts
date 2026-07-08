/**
 * Normalizes HTML for checkout `dangerouslySetInnerHTML`.
 * Foxpost APT finder often returns entity-encoded markup; admin TipTap HTML is usually raw.
 */
export function prepareCheckoutRichHtml(html: string | null | undefined): string | null {
  const trimmed = html?.trim()
  if (!trimmed) return null

  if (!/&(?:lt|gt|amp|quot|#39|#x[0-9a-f]+|#\d+);/i.test(trimmed)) {
    return trimmed
  }

  if (typeof document !== "undefined") {
    const textarea = document.createElement("textarea")
    textarea.innerHTML = trimmed
    const decoded = textarea.value.trim()
    return decoded || trimmed
  }

  return decodeHtmlEntities(trimmed)
}

/** Node/test fallback when `document` is unavailable. */
export function decodeHtmlEntities(html: string): string {
  return html
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, "&")
}
