import dbConnect from "@wse/core/lib/db";
import { revalidatePath } from "next/cache";
import { revalidateStorefrontTags, STOREFRONT_CACHE_TAGS } from "@wse/core/lib/storefront-cache-tags";
import ShopFeaturedSetting, {
  type FeaturedProductsMode,
  type IShopFeaturedSetting,
} from "@wse/core/models/ShopFeaturedSetting";

export type ShopFeaturedSettings = {
  mode: FeaturedProductsMode;
  manualProductIds: string[];
  orderedCategoryIds: string[];
  maxItems: number;
  perCategoryLimit: number;
};

const DEFAULTS: ShopFeaturedSettings = {
  mode: "auto",
  manualProductIds: [],
  orderedCategoryIds: [],
  maxItems: 24,
  perCategoryLimit: 0,
};

function fromDoc(doc: IShopFeaturedSetting | null): ShopFeaturedSettings {
  if (!doc) return { ...DEFAULTS };
  return {
    mode: doc.mode ?? "auto",
    manualProductIds: Array.isArray(doc.manualProductIds) ? [...doc.manualProductIds] : [],
    orderedCategoryIds: Array.isArray(doc.orderedCategoryIds) ? [...doc.orderedCategoryIds] : [],
    maxItems: Math.min(48, Math.max(1, Number(doc.maxItems) || DEFAULTS.maxItems)),
    perCategoryLimit: Math.max(0, Math.min(48, Number(doc.perCategoryLimit) || 0)),
  };
}

export class ShopFeaturedSettingsService {
  static async get(): Promise<ShopFeaturedSettings> {
    await dbConnect();
    const doc = await ShopFeaturedSetting.findOneAndUpdate(
      { key: "featured" },
      { $setOnInsert: { key: "featured", ...DEFAULTS } },
      { upsert: true, returnDocument: "after", lean: true }
    );
    return fromDoc(doc as IShopFeaturedSetting | null);
  }

  static async update(input: Partial<ShopFeaturedSettings>): Promise<ShopFeaturedSettings> {
    await dbConnect();
    const current = await this.get();
    const merged: ShopFeaturedSettings = {
      mode: input.mode ?? current.mode,
      manualProductIds: input.manualProductIds ?? current.manualProductIds,
      orderedCategoryIds: input.orderedCategoryIds ?? current.orderedCategoryIds,
      maxItems: input.maxItems ?? current.maxItems,
      perCategoryLimit: input.perCategoryLimit ?? current.perCategoryLimit,
    };
    await ShopFeaturedSetting.findOneAndUpdate(
      { key: "featured" },
      { key: "featured", ...merged },
      { upsert: true, returnDocument: "after" }
    );
    revalidatePath("/");
    revalidateStorefrontTags(STOREFRONT_CACHE_TAGS.products, STOREFRONT_CACHE_TAGS.homepage);
    return merged;
  }
}
