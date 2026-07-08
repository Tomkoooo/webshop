import { loadTemplateModule } from "@wse/core/templates/registry"
import { findPageDefinition } from "@wse/core/templates/resolve-page-definition"
import { listEditablePages } from "@wse/core/templates/cms-pages"
import { PageContentService } from "@wse/core/services/page-content"
import { TemplateService } from "@wse/core/services/template"
import { homepageSnapshotSchema } from "@wse/core/features/homepage-cms/types/homepage-schema"
import type { HomepageSnapshot } from "@wse/core/features/homepage-cms/types/block-types"
import { isShopEnabled } from "@wse/core/lib/features/shop"
import { PluginService } from "@wse/core/services/plugin"
import { resolveAllowedHomepageBlockTypes } from "@wse/core/features/homepage-cms/utils/homepage-block-allowlist"
import { z } from "zod"

export type CmsInspectReport = {
  generatedAt: string
  shopEnabled: boolean
  databaseActiveTemplateId: string
  requestedTemplateId: string
  templateMismatchWarning: string | null
  template: {
    id: string
    name: string
    deployment: string
    staticPageSlugs: string[]
    homeCmsKind: string | undefined
    allowedHomepageBlockTypes: string[]
  }
  adminCmsRoutes: Array<{
    adminSegment: string
    pageKey: string
    label: string
    editorKind: string
  }>
  importablePageKeys: Array<{
    pageKey: string
    label: string
    editorKind: string
    schemaTopLevelKeys: string[]
    hasDraft: boolean
    publishedAt?: string
    contentPreview: unknown
  }>
  homepageBlockFieldGuide: Record<string, string[]>
  agentHints: string[]
}

const HOMEPAGE_BLOCK_FIELDS: Record<string, string[]> = {
  hero: [
    "data.title",
    "data.description",
    "data.primaryCtaLabel",
    "data.primaryCtaHref",
    "data.secondaryCtaLabel",
    "data.secondaryCtaHref",
    "data.badges[]",
    "data.heroImage",
  ],
  about: [
    "data.title",
    "data.paragraph",
    "data.accordions[{title,content}]",
    "data.cards[{title,description,icon?}]",
  ],
  features: [
    "data.title",
    "data.subtitle",
    "data.cards[{title,description,icon?}]",
  ],
  productGrid: [
    "data.title",
    "data.description",
    "data.viewAllLabel",
    "data.categoriesTitle",
    "data.selectedProductIds[]",
  ],
  contact: [
    "data.title",
    "data.description",
    "data.companyName",
    "data.address",
    "data.phone",
    "data.email",
    "data.sendButtonLabel",
  ],
  testimonials: [
    "data.title",
    "data.subtitle",
    "data.items[{quote,name,role,rating}]",
  ],
  cta: [
    "data.title",
    "data.description",
    "data.primaryLabel",
    "data.primaryHref",
    "data.secondaryLabel",
    "data.secondaryHref",
  ],
  gallery: ["data.title", "data.items[{image,caption}]"],
  richText: ["data.title", "data.html"],
  divider: ["data.label"],
}

function zodObjectKeys(schema: z.ZodType): string[] {
  const def = (schema as { _zod?: { def?: { type?: string; shape?: Record<string, unknown> } } })._zod
    ?.def
  if (def?.type === "object" && def.shape) {
    return Object.keys(def.shape)
  }
  if (def?.type === "default" || def?.type === "optional") {
    const inner = (def as { innerType?: z.ZodType }).innerType
    if (inner) return zodObjectKeys(inner)
  }
  return []
}

function summarizeHomepageBlocks(snapshot: HomepageSnapshot) {
  return snapshot.blocks.map((b) => ({
    id: b.id,
    type: b.type,
    enabled: b.enabled,
    dataKeys: Object.keys(b.data),
    textPreview: pickTextPreview(b.data as Record<string, unknown>),
  }))
}

function pickTextPreview(data: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === "string" && v.trim()) {
      out[k] = v.length > 120 ? `${v.slice(0, 117)}…` : v
    }
  }
  return out
}

function summarizeSurfaceContent(content: unknown): unknown {
  if (!content || typeof content !== "object") return content
  const obj = content as Record<string, unknown>
  const preview: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (k === "meta" && v && typeof v === "object") {
      preview.meta = v
      continue
    }
    if (typeof v === "string") {
      preview[k] = v.length > 160 ? `${v.slice(0, 157)}…` : v
    } else if (typeof v === "number" || typeof v === "boolean") {
      preview[k] = v
    } else if (Array.isArray(v)) {
      preview[k] = `[array length ${v.length}]`
    } else {
      preview[k] = typeof v
    }
  }
  return preview
}

export async function buildCmsInspectReport(
  templateId: string
): Promise<CmsInspectReport> {
  const template = await loadTemplateModule(templateId)

  const dbActive = (await TemplateService.getActiveInfo()).templateId
  const shopEnabled = isShopEnabled()
  const campBookingEnabled = await PluginService.isEnabled("camp-booking")
  const editable = listEditablePages(template, shopEnabled, campBookingEnabled)

  const pageKeys = new Set<string>()
  for (const e of editable) pageKeys.add(e.pageKey)
  pageKeys.add("page:home")
  pageKeys.add("page:shop")
  pageKeys.add("page:pdp")
  for (const slug of template.manifest.capabilities.staticPages) {
    pageKeys.add(`page:${slug}`)
  }
  if (template.campPages) {
    pageKeys.add("page:jegyvasarlas")
    pageKeys.add("page:foglalas")
    pageKeys.add("page:foglalas-siker")
  }

  const importablePageKeys: CmsInspectReport["importablePageKeys"] = []

  for (const pageKey of [...pageKeys].sort()) {
    const def = findPageDefinition(template, pageKey)
    if (!def) continue

    const entry = editable.find((e) => e.pageKey === pageKey)
    const meta = await PageContentService.getMeta(templateId, pageKey)
    const draft = await PageContentService.getDraft(templateId, pageKey)

    let contentPreview: unknown
    if (pageKey === "page:home" && template.pages.home.cmsPageKind === "homepage-blocks") {
      const parsed = homepageSnapshotSchema.safeParse(draft)
      contentPreview = parsed.success
        ? {
            meta: parsed.data.meta,
            blocks: summarizeHomepageBlocks(parsed.data),
          }
        : { error: "invalid homepage snapshot" }
    } else {
      contentPreview = summarizeSurfaceContent(draft)
    }

    importablePageKeys.push({
      pageKey,
      label: entry?.label ?? pageKey,
      editorKind: entry?.editorKind ?? "surface-json",
      schemaTopLevelKeys: zodObjectKeys(def.schema as z.ZodType),
      hasDraft: meta.hasDraft,
      publishedAt: meta.publishedAt?.toISOString(),
      contentPreview,
    })
  }

  const allowed = resolveAllowedHomepageBlockTypes(template.pages.home)
  const blockGuide: Record<string, string[]> = {}
  for (const t of allowed) {
    if (HOMEPAGE_BLOCK_FIELDS[t]) blockGuide[t] = HOMEPAGE_BLOCK_FIELDS[t]
  }

  const mismatch =
    dbActive !== templateId
      ? `Database active template is "${dbActive}" but you requested "${templateId}". Imports target requested template only; activate the correct template in admin if the shop should use this content live.`
      : null

  return {
    generatedAt: new Date().toISOString(),
    shopEnabled,
    databaseActiveTemplateId: dbActive,
    requestedTemplateId: templateId,
    templateMismatchWarning: mismatch,
    template: {
      id: template.manifest.id,
      name: template.manifest.name,
      deployment: template.manifest.deployment,
      staticPageSlugs: [...template.manifest.capabilities.staticPages],
      homeCmsKind: template.pages.home.cmsPageKind,
      allowedHomepageBlockTypes: allowed,
    },
    adminCmsRoutes: editable.map((e) => ({
      adminSegment: e.adminSegment,
      pageKey: e.pageKey,
      label: e.label,
      editorKind: e.editorKind,
    })),
    importablePageKeys,
    homepageBlockFieldGuide: blockGuide,
    agentHints: [
      "Paste raw customer copy in scripts/imports/customer-copy.txt (not applied automatically).",
      "Map copy to blockPatches or page content, write scripts/imports/payload.json, then: npm run cms:apply-import -- --template=<id> --payload=scripts/imports/payload.json",
      "Use --dry-run to validate without writing MongoDB.",
      "Homepage: prefer blockPatches with matchBy=type for hero/about/features/contact; use matchBy=id when multiple blocks share a type.",
      "Add --publish only when the user wants changes live immediately; otherwise admins review draft at /admin/cms.",
    ],
  }
}
