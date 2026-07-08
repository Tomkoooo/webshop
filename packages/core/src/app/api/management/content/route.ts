import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireManagementAuth } from "@wse/core/lib/management-auth"
import { PageContentService } from "@wse/core/services/page-content"
import { isRegisteredTemplateId } from "@wse/core/templates/registry"
import { revalidateStorefrontSitemap } from "@wse/core/lib/sitemap/revalidate-storefront-sitemap"

export const dynamic = "force-dynamic"

const templateIdSchema = z.string().min(1)
const pageKeySchema = z.string().min(1).max(120)

const saveDraftSchema = z.object({
  action: z.literal("save-draft"),
  templateId: templateIdSchema,
  pageKey: pageKeySchema,
  value: z.unknown(),
})

const publishSchema = z.object({
  action: z.literal("publish"),
  templateId: templateIdSchema,
  pageKey: pageKeySchema,
})

const discardDraftSchema = z.object({
  action: z.literal("discard-draft"),
  templateId: templateIdSchema,
  pageKey: pageKeySchema,
})

const actionBodySchema = z.discriminatedUnion("action", [
  saveDraftSchema,
  publishSchema,
  discardDraftSchema,
])

function guardTemplate(templateId: string): Response | null {
  if (!isRegisteredTemplateId(templateId)) {
    return NextResponse.json(
      { ok: false, error: `Unknown template id '${templateId}'` },
      { status: 400 }
    )
  }
  return null
}

function revalidateForPage(pageKey: string) {
  if (pageKey === "page:home") revalidatePath("/", "layout")
  else if (pageKey.startsWith("page:")) revalidatePath(`/${pageKey.slice("page:".length)}`, "layout")
  revalidateStorefrontSitemap()
}

/** Read draft + published content for one page: ?templateId=…&pageKey=… */
export async function GET(request: Request) {
  const denied = requireManagementAuth(request)
  if (denied) return denied
  const url = new URL(request.url)
  const templateId = templateIdSchema.parse(url.searchParams.get("templateId"))
  const pageKey = pageKeySchema.parse(url.searchParams.get("pageKey"))
  const badTemplate = guardTemplate(templateId)
  if (badTemplate) return badTemplate
  const [draft, published] = await Promise.all([
    PageContentService.getDraft(templateId, pageKey),
    PageContentService.getPublished(templateId, pageKey),
  ])
  return NextResponse.json({ ok: true, templateId, pageKey, draft, published })
}

/** Draft/publish lifecycle: { action: "save-draft" | "publish" | "discard-draft", … } */
export async function POST(request: Request) {
  const denied = requireManagementAuth(request)
  if (denied) return denied
  const body = actionBodySchema.parse(await request.json())
  const badTemplate = guardTemplate(body.templateId)
  if (badTemplate) return badTemplate

  if (body.action === "save-draft") {
    await PageContentService.saveDraft(body.templateId, body.pageKey, body.value)
  } else if (body.action === "publish") {
    await PageContentService.publish(body.templateId, body.pageKey, "management-api")
    revalidateForPage(body.pageKey)
  } else {
    await PageContentService.discardDraft(body.templateId, body.pageKey)
  }
  return NextResponse.json({ ok: true })
}
