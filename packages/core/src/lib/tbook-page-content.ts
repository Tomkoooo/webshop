import { PageContentService } from "@wse/core/services/page-content"
import { loadTemplateModule } from "@wse/core/templates/registry"
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
import type { ZodType } from "zod"

type TBookPageKey = "jegyek" | "foglalas" | "foglalasSiker"

async function tBookFallback<T>(
  templateId: string,
  key: TBookPageKey,
  schema: ZodType<T>,
  engineDefault: T,
  locale?: string
): Promise<T> {
  try {
    const template = await loadTemplateModule(templateId)
    const def = template.tBookPages?.[key]
    if (!def) return engineDefault
    const byLocale = def.defaultContentByLocale as Record<string, T> | undefined
    const localized = locale && byLocale ? byLocale[locale] : undefined
    return schema.parse(localized ?? def.defaultContent)
  } catch {
    return engineDefault
  }
}

export async function getTBookListContent(templateId: string, locale?: string): Promise<TBookListContent> {
  try {
    const raw = await PageContentService.get(templateId, "page:jegyek", locale)
    return tBookListContentSchema.parse(raw)
  } catch {
    return tBookFallback(templateId, "jegyek", tBookListContentSchema, tBookListDefaultContent, locale)
  }
}

export async function getTBookBookingContent(
  templateId: string,
  locale?: string
): Promise<TBookBookingContent> {
  try {
    const raw = await PageContentService.get(templateId, "page:tbook-foglalas", locale)
    return tBookBookingContentSchema.parse(raw)
  } catch {
    return tBookFallback(
      templateId,
      "foglalas",
      tBookBookingContentSchema,
      tBookBookingDefaultContent,
      locale
    )
  }
}

export async function getTBookSuccessContent(
  templateId: string,
  locale?: string
): Promise<TBookSuccessContent> {
  try {
    const raw = await PageContentService.get(templateId, "page:tbook-foglalas-siker", locale)
    return tBookSuccessContentSchema.parse(raw)
  } catch {
    return tBookFallback(
      templateId,
      "foglalasSiker",
      tBookSuccessContentSchema,
      tBookSuccessDefaultContent,
      locale
    )
  }
}
