import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { revalidateStorefrontSitemap } from "@wse/core/lib/sitemap/revalidate-storefront-sitemap"
import { z } from "zod"
import { requireAdmin } from "@wse/core/lib/admin-auth"
import { PageContentService } from "@wse/core/services/page-content"
import { isRegisteredTemplateId } from "@wse/core/templates/registry"

const pageKeySchema = z.string().min(1).max(120)
const templateIdSchema = z.string().min(1)

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

const resetPublishedSchema = z.object({
  action: z.literal("reset-published"),
  templateId: templateIdSchema,
  pageKey: pageKeySchema,
})

/** Legacy body: PUT with value only → save-draft */
const legacySaveSchema = z.object({
  templateId: templateIdSchema,
  pageKey: pageKeySchema,
  value: z.unknown(),
})

const resetSchema = z.object({
  templateId: templateIdSchema,
  pageKey: pageKeySchema,
})

const actionBodySchema = z.discriminatedUnion("action", [
  saveDraftSchema,
  publishSchema,
  discardDraftSchema,
  resetPublishedSchema,
])

import { parseProductSlugFromPdpPageKey } from "@wse/core/lib/product-page-content"

function pageKeyToPaths(pageKey: string): string[] {
  if (pageKey === "page:home") return ["/"]
  if (pageKey === "page:shop") return ["/shop"]
  if (pageKey === "page:pdp") return ["/products/[slug]"]
  const productSlug = parseProductSlugFromPdpPageKey(pageKey)
  if (productSlug) return [`/products/${productSlug}`]
  if (pageKey.startsWith("page:")) return [`/${pageKey.slice("page:".length)}`]
  return []
}

function revalidateForPage(pageKey: string) {
  for (const path of pageKeyToPaths(pageKey)) {
    revalidatePath(path, "layout")
  }
  revalidateStorefrontSitemap()
}

async function guardTemplate(templateId: string): Promise<Response | null> {
  if (!isRegisteredTemplateId(templateId)) {
    return NextResponse.json(
      { ok: false, error: `Unknown template id '${templateId}'` },
      { status: 400 }
    )
  }
  return null
}

export async function PUT(request: Request) {
  const session = await requireAdmin()
  const email = session.user?.email ?? undefined
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }

  const legacy = legacySaveSchema.safeParse(json)
  const wantsAction =
    typeof json === "object" &&
    json !== null &&
    "action" in json &&
    typeof (json as { action?: unknown }).action === "string"
  const actionParsed = wantsAction ? actionBodySchema.safeParse(json) : null

  if (!actionParsed?.success && legacy.success) {
    const guard = await guardTemplate(legacy.data.templateId)
    if (guard) return guard
    try {
      const saved = await PageContentService.saveDraft(
        legacy.data.templateId,
        legacy.data.pageKey,
        legacy.data.value,
        email
      )
      /* Draft does not alter live storefront */
      return NextResponse.json({ ok: true, action: "save-draft", value: saved })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Validation failed"
      return NextResponse.json({ ok: false, error: message }, { status: 400 })
    }
  }

  if (!actionParsed?.success) {
    const err =
      actionParsed && !actionParsed.success ? actionParsed.error.flatten() : null
    return NextResponse.json(
      { ok: false, error: "Invalid body", details: err },
      { status: 400 }
    )
  }

  const body = actionParsed.data
  const guard = await guardTemplate(body.templateId)
  if (guard) return guard

  try {
    switch (body.action) {
      case "save-draft": {
        const saved = await PageContentService.saveDraft(
          body.templateId,
          body.pageKey,
          body.value,
          email
        )
        return NextResponse.json({ ok: true, action: "save-draft", value: saved })
      }
      case "publish": {
        const published = await PageContentService.publish(
          body.templateId,
          body.pageKey,
          email
        )
        revalidateForPage(body.pageKey)
        return NextResponse.json({ ok: true, action: "publish", value: published })
      }
      case "discard-draft": {
        await PageContentService.discardDraft(body.templateId, body.pageKey)
        const draft = await PageContentService.getDraft(body.templateId, body.pageKey)
        return NextResponse.json({ ok: true, action: "discard-draft", value: draft })
      }
      case "reset-published": {
        await PageContentService.reset(body.templateId, body.pageKey)
        revalidateForPage(body.pageKey)
        return NextResponse.json({ ok: true, action: "reset-published" })
      }
      default: {
        return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 })
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Operation failed"
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  await requireAdmin()
  const body = resetSchema.parse(await request.json())
  if (!isRegisteredTemplateId(body.templateId)) {
    return NextResponse.json(
      { ok: false, error: `Unknown template id '${body.templateId}'` },
      { status: 400 }
    )
  }
  await PageContentService.reset(body.templateId, body.pageKey)
  revalidateForPage(body.pageKey)
  return NextResponse.json({ ok: true })
}
