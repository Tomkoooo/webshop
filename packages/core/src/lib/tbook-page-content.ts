import { PageContentService } from "@wse/core/services/page-content"
import {
  tBookBookingContentSchema,
  tBookListContentSchema,
  tBookSuccessContentSchema,
  type TBookBookingContent,
  type TBookListContent,
  type TBookSuccessContent,
} from "@wse/template-world-darts-festival/pages/tbook/schemas"
import {
  tBookBookingDefaultContent,
  tBookListDefaultContent,
  tBookSuccessDefaultContent,
} from "@wse/template-world-darts-festival/pages/tbook/defaultContent"

/** WDF storefront checkout is English — skip CMS overrides that may still be Hungarian. */
function preferWdfEnglishDefaults(templateId: string): boolean {
  return templateId === "world-darts-festival"
}

export async function getTBookListContent(templateId: string): Promise<TBookListContent> {
  if (preferWdfEnglishDefaults(templateId)) return tBookListDefaultContent
  try {
    const raw = await PageContentService.get(templateId, "page:jegyek")
    return tBookListContentSchema.parse(raw)
  } catch {
    return tBookListDefaultContent
  }
}

export async function getTBookBookingContent(templateId: string): Promise<TBookBookingContent> {
  if (preferWdfEnglishDefaults(templateId)) return tBookBookingDefaultContent
  try {
    const raw = await PageContentService.get(templateId, "page:tbook-foglalas")
    return tBookBookingContentSchema.parse(raw)
  } catch {
    return tBookBookingDefaultContent
  }
}

export async function getTBookSuccessContent(templateId: string): Promise<TBookSuccessContent> {
  if (preferWdfEnglishDefaults(templateId)) return tBookSuccessDefaultContent
  try {
    const raw = await PageContentService.get(templateId, "page:tbook-foglalas-siker")
    return tBookSuccessContentSchema.parse(raw)
  } catch {
    return tBookSuccessDefaultContent
  }
}
