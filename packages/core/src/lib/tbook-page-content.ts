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

export async function getTBookListContent(templateId: string, locale?: string): Promise<TBookListContent> {
  try {
    const raw = await PageContentService.get(templateId, "page:jegyek", locale)
    return tBookListContentSchema.parse(raw)
  } catch {
    return tBookListDefaultContent
  }
}

export async function getTBookBookingContent(templateId: string, locale?: string): Promise<TBookBookingContent> {
  try {
    const raw = await PageContentService.get(templateId, "page:tbook-foglalas", locale)
    return tBookBookingContentSchema.parse(raw)
  } catch {
    return tBookBookingDefaultContent
  }
}

export async function getTBookSuccessContent(templateId: string, locale?: string): Promise<TBookSuccessContent> {
  try {
    const raw = await PageContentService.get(templateId, "page:tbook-foglalas-siker", locale)
    return tBookSuccessContentSchema.parse(raw)
  } catch {
    return tBookSuccessDefaultContent
  }
}
