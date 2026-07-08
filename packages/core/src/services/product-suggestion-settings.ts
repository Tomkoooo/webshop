import dbConnect from "@wse/core/lib/db"
import ProductSuggestionSetting from "@wse/core/models/ProductSuggestionSetting"
import {
  DEFAULT_PRODUCT_SUGGESTION_SETTINGS,
  productSuggestionSettingsSchema,
  type ProductSuggestionSettings,
} from "@wse/core/lib/product-suggestion-settings-schema"

const KEY = "default"

function parseDoc(raw: unknown): ProductSuggestionSettings {
  const merged = {
    ...DEFAULT_PRODUCT_SUGGESTION_SETTINGS,
    ...(typeof raw === "object" && raw !== null ? raw : {}),
  }
  const parsed = productSuggestionSettingsSchema.safeParse(merged)
  return parsed.success ? parsed.data : DEFAULT_PRODUCT_SUGGESTION_SETTINGS
}

export class ProductSuggestionSettingsService {
  static async get(): Promise<ProductSuggestionSettings> {
    await dbConnect()
    const doc = await ProductSuggestionSetting.findOneAndUpdate(
      { key: KEY },
      { $setOnInsert: { key: KEY, ...DEFAULT_PRODUCT_SUGGESTION_SETTINGS } },
      { upsert: true, returnDocument: "after", lean: true }
    )
    return parseDoc({
      enabled: doc?.enabled,
      showCartLinesInModal: doc?.showCartLinesInModal,
      modalTitle: doc?.modalTitle,
      modalHelper: doc?.modalHelper,
      maxSuggestions: doc?.maxSuggestions,
      sources: doc?.sources,
    })
  }

  static async update(input: Partial<ProductSuggestionSettings>): Promise<ProductSuggestionSettings> {
    await dbConnect()
    const current = await this.get()
    const merged = { ...current, ...input }
    const parsed = productSuggestionSettingsSchema.parse(merged)
    await ProductSuggestionSetting.findOneAndUpdate(
      { key: KEY },
      {
        $set: {
          enabled: parsed.enabled,
          showCartLinesInModal: parsed.showCartLinesInModal,
          modalTitle: parsed.modalTitle,
          modalHelper: parsed.modalHelper,
          maxSuggestions: parsed.maxSuggestions,
          sources: parsed.sources,
        },
      },
      { upsert: true }
    )
    return parsed
  }
}
