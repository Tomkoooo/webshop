/**
 * Resolve a CMS/authored href into a safe `href` plus whether it should open externally.
 * Bare domains like `google.com/maps/...` (no protocol) are treated as https URLs so Next.js
 * `<Link>` does not turn them into same-origin paths (`/google.com/maps`).
 */
export function resolveCmsHref(raw: string | null | undefined): {
  href: string
  external: boolean
} {
  const trimmed = String(raw ?? "").trim()
  if (!trimmed || trimmed === "#") return { href: trimmed || "#", external: false }

  if (/^(mailto:|tel:|sms:)/i.test(trimmed)) {
    return { href: trimmed, external: true }
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return { href: trimmed, external: true }
  }

  if (trimmed.startsWith("//")) {
    return { href: `https:${trimmed}`, external: true }
  }

  // Protocol-relative-looking host without scheme: google.com/maps, www.example.com/path
  if (/^(?:www\.)?[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(?:[/:?#]|$)/i.test(trimmed)) {
    return { href: `https://${trimmed}`, external: true }
  }

  return { href: trimmed, external: false }
}
