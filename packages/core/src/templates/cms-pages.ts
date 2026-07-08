import type { FlowRouteKey, TemplateModule } from "@wse/sdk/templates/types"

function staticPageAdminLabel(slug: string): string {
  return slug
    .split("-")
    .map((segment) =>
      segment.length ? segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase() : segment
    )
    .join(" ")
}

export type EditableNavCategory = "landing" | "shop" | "static" | "flow" | "camp"

/** `homepage-blocks` uses {@link VisualHomepageEditor}; `surface-json` uses template JSON surface + chrome. */
export type CmsAdminEditorKind = "homepage-blocks" | "surface-json"

export type EditablePageNavItem = {
  adminSegment: string
  pageKey: string
  label: string
  category: EditableNavCategory
  editorKind: CmsAdminEditorKind
}

const FLOW_META: Record<FlowRouteKey, string> = {
  cart: "Kosár",
  checkout: "Pénztár",
  profile: "Fiókom",
}

/** Pages listed under `/admin/cms` and editable at `/admin/cms/[adminSegment]`. */
export function listEditablePages(
  template: TemplateModule,
  shopEnabled: boolean,
  campBookingEnabled = false
): EditablePageNavItem[] {
  const pages: EditablePageNavItem[] = []

  const homeSegment = template.manifest.surfaces.home.adminSegment
  pages.push({
    adminSegment: homeSegment,
    pageKey: `page:${homeSegment}`,
    label: "Főoldal",
    category: "landing",
    editorKind: template.pages.home.cmsPageKind === "homepage-blocks" ? "homepage-blocks" : "surface-json",
  })

  if (shopEnabled) {
    const shopSeg = template.manifest.surfaces.shop.adminSegment
    pages.push({
      adminSegment: shopSeg,
      pageKey: `page:${shopSeg}`,
      label: "Bolt",
      category: "shop",
      editorKind: "surface-json",
    })
    const pdpSeg = template.manifest.surfaces.pdp.adminSegment
    pages.push({
      adminSegment: pdpSeg,
      pageKey: `page:${pdpSeg}`,
      label: "Termék oldal · keret",
      category: "shop",
      editorKind: "surface-json",
    })

    const fp = template.flowPages
    if (fp) {
      ;(["cart", "checkout", "profile"] as FlowRouteKey[]).forEach((key) => {
        if (!fp[key]?.shell) return
        pages.push({
          adminSegment: key,
          pageKey: `page:${key}`,
          label: FLOW_META[key],
          category: "flow",
          editorKind: "surface-json",
        })
      })
    }
  }

  for (const slug of template.manifest.capabilities.staticPages) {
    if (!template.staticPages[slug]) continue
    const customLabel = template.manifest.capabilities.staticPageLabels?.[slug]
    pages.push({
      adminSegment: slug,
      pageKey: `page:${slug}`,
      label: customLabel ?? staticPageAdminLabel(slug),
      category: "static",
      editorKind: "surface-json",
    })
  }

  if (campBookingEnabled && template.campPages) {
    const campMeta: Array<{
      key: keyof NonNullable<TemplateModule["campPages"]>
      adminSegment: string
      label: string
    }> = [
      { key: "jegyvasarlas", adminSegment: "jegyvasarlas", label: "Jegyvásárlás" },
      { key: "foglalas", adminSegment: "foglalas", label: "Foglalás / regisztráció" },
      { key: "foglalasSiker", adminSegment: "foglalas-siker", label: "Foglalás siker" },
    ]
    for (const entry of campMeta) {
      if (!template.campPages[entry.key]) continue
      pages.push({
        adminSegment: entry.adminSegment,
        pageKey: `page:${entry.adminSegment}`,
        label: entry.label,
        category: "camp",
        editorKind: "surface-json",
      })
    }
  }

  return pages
}
