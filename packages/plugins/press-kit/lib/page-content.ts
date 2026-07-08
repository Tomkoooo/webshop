import { v4 as uuidv4 } from "uuid"
import type { IPressKitSettings } from "../models/PressKitSettings"

export type PressKitBlockType = "hero" | "embargo" | "richText" | "plainText" | "highlights"

export type PressKitHeroBlock = {
  id: string
  type: "hero"
  pageTitle: string
  eyebrow: string
  heroImage: string
}

export type PressKitEmbargoBlock = {
  id: string
  type: "embargo"
  text: string
}

export type PressKitRichTextBlock = {
  id: string
  type: "richText"
  title: string
  bodyHtml: string
}

export type PressKitPlainTextBlock = {
  id: string
  type: "plainText"
  /** @deprecated use bodyHtml */
  body?: string
  bodyHtml: string
}

export type PressKitHighlightsBlock = {
  id: string
  type: "highlights"
  items: Array<{ label: string; detail: string }>
}

export type PressKitPageBlock =
  | PressKitHeroBlock
  | PressKitEmbargoBlock
  | PressKitRichTextBlock
  | PressKitPlainTextBlock
  | PressKitHighlightsBlock

export type PressKitPageContent = {
  blocks: PressKitPageBlock[]
}

export const PRESS_KIT_BLOCK_LABELS: Record<PressKitBlockType, string> = {
  hero: "Hero / fejléc",
  embargo: "Embargó figyelmeztetés",
  richText: "Formázott szöveg",
  plainText: "Szöveg (képekkel)",
  highlights: "Kiemelések",
}

export function createPressKitBlock(type: PressKitBlockType): PressKitPageBlock {
  const id = uuidv4()
  switch (type) {
    case "hero":
      return { id, type, pageTitle: "Sajtóanyagok", eyebrow: "Sajtóanyag", heroImage: "" }
    case "embargo":
      return { id, type, text: "" }
    case "richText":
      return { id, type, title: "", bodyHtml: "<p></p>" }
    case "plainText":
      return { id, type, bodyHtml: "<p></p>" }
    case "highlights":
      return { id, type, items: [{ label: "", detail: "" }] }
    default:
      return { id, type: "plainText", bodyHtml: "<p></p>" }
  }
}

export function defaultPressKitPageContent(): PressKitPageContent {
  return {
    blocks: [
      createPressKitBlock("hero"),
      createPressKitBlock("embargo"),
      createPressKitBlock("richText"),
    ],
  }
}

/** Migrate legacy plainText `body` fields and coerce unknown blocks. */
export function normalizePressKitPageContentBlocks(
  blocks: PressKitPageBlock[]
): PressKitPageBlock[] {
  return blocks.map((block) => {
    if (block.type === "plainText") {
      const legacy = block as PressKitPlainTextBlock
      if (!legacy.bodyHtml && legacy.body) {
        return {
          ...legacy,
          bodyHtml: `<p>${escapeHtml(legacy.body).replace(/\n/g, "<br>")}</p>`,
        }
      }
      if (!legacy.bodyHtml) {
        return { ...legacy, bodyHtml: "<p></p>" }
      }
    }
    return block
  })
}

/** Build visual CMS document from stored settings (legacy fields or pageBlocks). */
export function normalizePressKitPageContent(
  settings: Pick<
    IPressKitSettings,
    | "pageBlocks"
    | "pageTitle"
    | "heroImage"
    | "embargoNote"
    | "sections"
    | "productHighlights"
  >
): PressKitPageContent {
  const raw = (settings as { pageBlocks?: PressKitPageBlock[] }).pageBlocks
  if (Array.isArray(raw) && raw.length > 0) {
    return { blocks: normalizePressKitPageContentBlocks(raw) }
  }

  const blocks: PressKitPageBlock[] = []

  blocks.push({
    id: uuidv4(),
    type: "hero",
    pageTitle: settings.pageTitle || "Sajtóanyagok",
    eyebrow: "Sajtóanyag",
    heroImage: settings.heroImage || "",
  })

  if (settings.embargoNote?.trim()) {
    blocks.push({
      id: uuidv4(),
      type: "embargo",
      text: settings.embargoNote,
    })
  }

  for (const section of settings.sections || []) {
    blocks.push({
      id: section.id || uuidv4(),
      type: "richText",
      title: section.title || "",
      bodyHtml: section.bodyHtml || "",
    })
  }

  if ((settings.productHighlights || []).length > 0) {
    blocks.push({
      id: uuidv4(),
      type: "highlights",
      items: settings.productHighlights.map((h) => ({
        label: h.label,
        detail: h.detail,
      })),
    })
  }

  return { blocks }
}

/** Flatten page content back onto settings fields for API/storefront compat. */
export function flattenPressKitPageContent(content: PressKitPageContent): {
  pageBlocks: PressKitPageBlock[]
  pageTitle: string
  heroImage: string
  embargoNote: string
  sections: Array<{ id: string; title: string; bodyHtml: string }>
  productHighlights: Array<{ label: string; detail: string }>
} {
  const hero = content.blocks.find((b): b is PressKitHeroBlock => b.type === "hero")
  const embargo = content.blocks.find((b): b is PressKitEmbargoBlock => b.type === "embargo")
  const sections = content.blocks
    .filter((b): b is PressKitRichTextBlock => b.type === "richText")
    .map((b) => ({ id: b.id, title: b.title, bodyHtml: b.bodyHtml }))
  const plainSections = content.blocks
    .filter((b): b is PressKitPlainTextBlock => b.type === "plainText")
    .map((b) => ({
      id: b.id,
      title: "",
      bodyHtml: b.bodyHtml || (b.body ? `<p>${escapeHtml(b.body)}</p>` : "<p></p>"),
    }))
  const highlights = content.blocks
    .filter((b): b is PressKitHighlightsBlock => b.type === "highlights")
    .flatMap((b) => b.items)

  return {
    pageBlocks: content.blocks,
    pageTitle: hero?.pageTitle || "Sajtóanyagok",
    heroImage: hero?.heroImage || "",
    embargoNote: embargo?.text || "",
    sections: [...sections, ...plainSections],
    productHighlights: highlights,
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
