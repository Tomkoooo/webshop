import dbConnect from "@wse/core/lib/db"
import TemplateContent from "@wse/core/models/TemplateContent"
import { FALLBACK_TEMPLATE_ID, loadTemplateModule } from "@wse/core/templates/registry"
import { findPageDefinition } from "@wse/core/templates/resolve-page-definition"
import { HomepageCmsService } from "@wse/core/services/homepage-cms"
import { insertMissingHomepageBlocks } from "@wse/core/features/homepage-cms/utils/insert-missing-homepage-blocks"
import {
  pruneAndDedupeHomepageBlocks,
  resolveAllowedHomepageBlockTypes,
} from "@wse/core/features/homepage-cms/utils/homepage-block-allowlist"
import { homepageSnapshotSchema } from "@wse/core/features/homepage-cms/types/homepage-schema"
import type { HomepageSnapshot } from "@wse/core/features/homepage-cms/types/block-types"
import type { PageDefinition } from "@wse/sdk/templates/types"
import { deepMergeRecords } from "@wse/core/lib/deep-merge-records"
import { normalizeWdfHomeContent } from "@wse/template-world-darts-festival/lib/normalize-wdf-home-content"
import type { HomeContent } from "@wse/template-world-darts-festival/pages/home/schema"

function normalizeParsedContentSync<T>(
  templateId: string,
  pageKey: string,
  data: T,
  def: PageDefinition<unknown> | null
): T {
  if (templateId === "world-darts-festival" && pageKey === "page:home" && def) {
    return normalizeWdfHomeContent(data, def.defaultContent as HomeContent) as T
  }
  return data
}

async function findPageDefinitionByTemplateId(
  templateId: string,
  pageKey: string
): Promise<PageDefinition<unknown> | null> {
  try {
    const template = await loadTemplateModule(templateId || FALLBACK_TEMPLATE_ID)
    return findPageDefinition(template, pageKey)
  } catch {
    return null
  }
}

function parseWithDef<T>(
  raw: string,
  def: PageDefinition<unknown> | null,
  templateId: string,
  pageKey: string
): T {
  if (!def) {
    try {
      return JSON.parse(raw) as T
    } catch {
      throw new Error(
        `Stored content for templateId='${templateId}' pageKey='${pageKey}' is not valid JSON and there is no schema to fall back to.`
      )
    }
  }
  try {
    const parsed = JSON.parse(raw)
    const merged =
      def && parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? deepMergeRecords(
            def.defaultContent as Record<string, unknown>,
            parsed as Record<string, unknown>
          )
        : parsed
    const data = def.schema.parse(merged) as T
    if (pageKey === "page:home") {
      const ref = def.defaultContent as HomepageSnapshot
      const homeParsed = homepageSnapshotSchema.safeParse(data)
      const refParsed = homepageSnapshotSchema.safeParse(ref)
      if (homeParsed.success && refParsed.success) {
        const mergedHome = insertMissingHomepageBlocks(homeParsed.data, refParsed.data)
        const allowed = resolveAllowedHomepageBlockTypes(def)
        return normalizeParsedContentSync(
          templateId,
          pageKey,
          pruneAndDedupeHomepageBlocks(mergedHome, allowed) as T,
          def
        )
      }
    }
    return normalizeParsedContentSync(templateId, pageKey, data, def)
  } catch (error) {
    console.error(
      `[PageContentService] Failed to parse content for ${templateId}/${pageKey}; falling back to default.`,
      error
    )
    return normalizeParsedContentSync(templateId, pageKey, def.defaultContent as T, def)
  }
}

export type TemplateContentMeta = {
  hasDraft: boolean
  publishedAt?: Date
}

export class PageContentService {
  /**
   * Live storefront content (published snapshot only).
   * Alias: use `get` for backward compatibility.
   */
  static async getPublished<T = unknown>(templateId: string, pageKey: string): Promise<T> {
    return this.get<T>(templateId, pageKey)
  }

  /** @deprecated Prefer getPublished — behavior is identical. */
  static async get<T = unknown>(templateId: string, pageKey: string): Promise<T> {
    await dbConnect()
    let doc = await TemplateContent.findOne({ templateId, pageKey }).lean()
    const def = await findPageDefinitionByTemplateId(templateId, pageKey)

    if (!doc && templateId === FALLBACK_TEMPLATE_ID && pageKey === "page:home" && def) {
      const legacy = await HomepageCmsService.getPublished()
      const parsed = def.schema.safeParse(legacy)
      if (parsed.success) {
        const asDefault =
          JSON.stringify(parsed.data) === JSON.stringify(def.defaultContent)
        if (!asDefault) {
          await TemplateContent.findOneAndUpdate(
            { templateId, pageKey },
            {
              templateId,
              pageKey,
              value: JSON.stringify(parsed.data),
            },
            { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
          )
          doc = await TemplateContent.findOne({ templateId, pageKey }).lean()
        }
      }
    }

    if (!doc) {
      if (!def) {
        throw new Error(
          `No page definition for templateId='${templateId}' pageKey='${pageKey}' and no stored content.`
        )
      }
      return def.defaultContent as T
    }

    return parseWithDef<T>(doc.value, def, templateId, pageKey)
  }

  /**
   * Editor baseline: draft when present, otherwise published `value`.
   */
  static async getDraft<T = unknown>(templateId: string, pageKey: string): Promise<T> {
    await dbConnect()
    let doc = await TemplateContent.findOne({ templateId, pageKey }).lean()
    const def = await findPageDefinitionByTemplateId(templateId, pageKey)

    if (!doc && templateId === FALLBACK_TEMPLATE_ID && pageKey === "page:home" && def) {
      const legacy = await HomepageCmsService.getPublished()
      const parsed = def.schema.safeParse(legacy)
      if (parsed.success) {
        const asDefault =
          JSON.stringify(parsed.data) === JSON.stringify(def.defaultContent)
        if (!asDefault) {
          await TemplateContent.findOneAndUpdate(
            { templateId, pageKey },
            {
              templateId,
              pageKey,
              value: JSON.stringify(parsed.data),
            },
            { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
          )
          doc = await TemplateContent.findOne({ templateId, pageKey }).lean()
        }
      }
    }

    if (!doc) {
      if (!def) {
        throw new Error(
          `No page definition for templateId='${templateId}' pageKey='${pageKey}' and no stored content.`
        )
      }
      return def.defaultContent as T
    }

    const source =
      doc.draftValue && doc.draftValue.trim().length > 0 ? doc.draftValue : doc.value
    return parseWithDef<T>(source, def, templateId, pageKey)
  }

  static async getMeta(templateId: string, pageKey: string): Promise<TemplateContentMeta> {
    await dbConnect()
    const doc = await TemplateContent.findOne({ templateId, pageKey }).lean()
    if (!doc) return { hasDraft: false }
    return {
      hasDraft: Boolean(doc.draftValue && doc.draftValue.trim().length > 0),
      publishedAt: doc.publishedAt,
    }
  }

  static async hasStoredContent(templateId: string, pageKey: string): Promise<boolean> {
    await dbConnect()
    const doc = await TemplateContent.findOne({ templateId, pageKey }).select({ _id: 1 }).lean()
    return Boolean(doc)
  }

  static async saveDraft<T>(
    templateId: string,
    pageKey: string,
    value: T,
    updatedBy?: string
  ): Promise<T> {
    const def = await findPageDefinitionByTemplateId(templateId, pageKey)
    if (!def) {
      throw new Error(
        `Cannot save draft: no page definition for templateId='${templateId}' pageKey='${pageKey}'.`
      )
    }
    const validated = def.schema.parse(value)

    await dbConnect()
    await TemplateContent.findOneAndUpdate(
      { templateId, pageKey },
      {
        $set: { draftValue: JSON.stringify(validated), updatedBy },
        $setOnInsert: {
          templateId,
          pageKey,
          value: JSON.stringify(def.defaultContent),
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    )
    return validated as T
  }

  static async publish<T>(
    templateId: string,
    pageKey: string,
    publishedBy?: string
  ): Promise<T> {
    const def = await findPageDefinitionByTemplateId(templateId, pageKey)
    if (!def) {
      throw new Error(
        `Cannot publish: no page definition for templateId='${templateId}' pageKey='${pageKey}'.`
      )
    }

    await dbConnect()
    const doc = await TemplateContent.findOne({ templateId, pageKey }).lean()
    if (!doc) {
      const baseline = def.defaultContent
      await TemplateContent.findOneAndUpdate(
        { templateId, pageKey },
        {
          $set: {
            templateId,
            pageKey,
            value: JSON.stringify(baseline),
            publishedBy,
            publishedAt: new Date(),
          },
          $unset: { draftValue: 1 },
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
      )
      return baseline as T
    }

    const raw =
      doc.draftValue && doc.draftValue.trim().length > 0 ? doc.draftValue : doc.value
    const validated = def.schema.parse(JSON.parse(raw))

    await TemplateContent.findOneAndUpdate(
      { templateId, pageKey },
      {
        $set: {
          value: JSON.stringify(validated),
          publishedBy,
          publishedAt: new Date(),
          updatedBy: publishedBy,
        },
        $unset: { draftValue: 1 },
      }
    )
    return validated as T
  }

  static async discardDraft(templateId: string, pageKey: string): Promise<void> {
    await dbConnect()
    await TemplateContent.findOneAndUpdate(
      { templateId, pageKey },
      { $unset: { draftValue: 1 } }
    )
  }

  /**
   * Immediate write to published (no draft). Used for migrations / rare admin tools.
   */
  static async savePublished<T>(
    templateId: string,
    pageKey: string,
    value: T,
    updatedBy?: string
  ): Promise<T> {
    const def = await findPageDefinitionByTemplateId(templateId, pageKey)
    if (!def) {
      throw new Error(
        `Cannot save: no page definition for templateId='${templateId}' pageKey='${pageKey}'.`
      )
    }
    const validated = def.schema.parse(value)

    await dbConnect()
    await TemplateContent.findOneAndUpdate(
      { templateId, pageKey },
      {
        $set: {
          value: JSON.stringify(validated),
          updatedBy,
          publishedBy: updatedBy,
          publishedAt: new Date(),
        },
        $unset: { draftValue: 1 },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    )
    return validated as T
  }

  /** @deprecated Use saveDraft + publish */
  static async save<T>(
    templateId: string,
    pageKey: string,
    value: T,
    updatedBy?: string
  ): Promise<T> {
    return this.saveDraft(templateId, pageKey, value, updatedBy)
  }

  static async reset(templateId: string, pageKey: string): Promise<void> {
    await dbConnect()
    await TemplateContent.deleteOne({ templateId, pageKey })
  }

  static async listForTemplate(
    templateId: string
  ): Promise<Array<{ pageKey: string; updatedAt: Date }>> {
    await dbConnect()
    const docs = await TemplateContent.find({ templateId })
      .select({ pageKey: 1, updatedAt: 1 })
      .lean()
    return docs.map((d) => ({
      pageKey: d.pageKey,
      updatedAt: (d as { updatedAt?: Date }).updatedAt ?? new Date(),
    }))
  }
}
