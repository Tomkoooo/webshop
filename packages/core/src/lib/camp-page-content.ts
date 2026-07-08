import { PageContentService } from "@wse/core/services/page-content"
import {
  campBookingContentSchema,
  campListContentSchema,
  campSuccessContentSchema,
  type CampBookingContent,
  type CampListContent,
  type CampSuccessContent,
} from "@wse/template-minecraft-camp/pages/camp/schemas"
import {
  campBookingDefaultContent,
  campListDefaultContent,
  campSuccessDefaultContent,
} from "@wse/template-minecraft-camp/pages/camp/defaultContent"

export async function getCampListContent(templateId: string): Promise<CampListContent> {
  try {
    const raw = await PageContentService.get(templateId, "page:jegyvasarlas")
    return campListContentSchema.parse(raw)
  } catch {
    return campListDefaultContent
  }
}

export async function getCampBookingContent(templateId: string): Promise<CampBookingContent> {
  try {
    const raw = await PageContentService.get(templateId, "page:foglalas")
    return campBookingContentSchema.parse(raw)
  } catch {
    return campBookingDefaultContent
  }
}

export async function getCampSuccessContent(templateId: string): Promise<CampSuccessContent> {
  try {
    const raw = await PageContentService.get(templateId, "page:foglalas-siker")
    return campSuccessContentSchema.parse(raw)
  } catch {
    return campSuccessDefaultContent
  }
}
