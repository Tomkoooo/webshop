/** Strip HTML tags and collapse whitespace for previews, SEO, and validation. */
export function plainTextFromHtml(html: string | null | undefined): string {
  if (!html?.trim()) return ""
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}
