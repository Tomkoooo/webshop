import type { EditablePageNavItem } from "@wse/core/templates/cms-pages"
import type { TemplateCmsPageRow } from "@wse/core/lib/admin-guide/types"

const CATEGORY_LABELS: Record<string, string> = {
  landing: "Főoldal",
  shop: "Bolt",
  static: "Statikus oldal",
  flow: "Vásárlási folyamat",
  camp: "Tábor",
}

export function editablePagesToRows(pages: EditablePageNavItem[]): TemplateCmsPageRow[] {
  return pages.map((page) => ({
    label: page.label,
    href: `/admin/cms/${page.adminSegment}`,
    category: CATEGORY_LABELS[page.category] ?? page.category,
  }))
}

export function buildCmsPagesMarkdownTable(rows: TemplateCmsPageRow[]): string {
  if (rows.length === 0) {
    return "\n\n> Ehhez a sablonhoz jelenleg nincs szerkeszthető CMS oldal ezen a telepítésen.\n"
  }

  const lines = [
    "",
    "### Szerkeszthető CMS oldalak (automatikus lista)",
    "",
    "| Oldal | Kategória | Admin link |",
    "| --- | --- | --- |",
    ...rows.map(
      (row) => `| ${row.label} | ${row.category} | [Megnyitás](${row.href}) |`
    ),
    "",
  ]
  return lines.join("\n")
}
