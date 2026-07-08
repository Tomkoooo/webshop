import mongoose from "mongoose";
import dbConnect from "@wse/core/lib/db";
import { unstable_cache } from "next/cache";
import Product from "@wse/core/models/Product";
import Category from "@wse/core/models/Category";
import { STOREFRONT_CACHE_TAGS } from "@wse/core/lib/storefront-cache-tags";
import {
  ShopFeaturedSettingsService,
  type ShopFeaturedSettings,
} from "@wse/core/services/shop-featured-settings";

type WithFeaturedIndex = {
  featuredListIndex?: number | null;
  createdAt?: Date | string;
  _id: { toString(): string };
};

/** Lower index first; unset indexes sort after set ones, then newest. */
export function sortByFeaturedListIndex<T extends WithFeaturedIndex>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ai = a.featuredListIndex;
    const bi = b.featuredListIndex;
    const aSet = ai != null && Number.isFinite(Number(ai));
    const bSet = bi != null && Number.isFinite(Number(bi));
    if (aSet && bSet) return Number(ai) - Number(bi);
    if (aSet) return -1;
    if (bSet) return 1;
    const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bt - at;
  });
}

export function orderIdsByList<T extends { _id: { toString(): string } }>(
  ids: string[],
  rows: T[]
): T[] {
  const byId = new Map(rows.map((row) => [row._id.toString(), row]));
  const ordered: T[] = [];
  for (const id of ids) {
    const row = byId.get(id);
    if (row) ordered.push(row);
  }
  return ordered;
}

export type ResolveFeaturedProductsInput = {
  /** CMS productGrid block overrides shop mode when non-empty. */
  cmsSelectedProductIds?: string[];
  maxItems?: number;
};

export async function resolveFeaturedProductIds(
  input: ResolveFeaturedProductsInput = {}
): Promise<string[]> {
  const cmsKey = (input.cmsSelectedProductIds ?? []).join(",");
  const maxKey = String(input.maxItems ?? "");
  return unstable_cache(
    () => resolveFeaturedProductIdsUncached(input),
    ["homepage-featured-product-ids", cmsKey, maxKey],
    {
      revalidate: 60,
      tags: [
        STOREFRONT_CACHE_TAGS.homepage,
        STOREFRONT_CACHE_TAGS.products,
        STOREFRONT_CACHE_TAGS.categories,
      ],
    }
  )();
}

async function resolveFeaturedProductIdsUncached(
  input: ResolveFeaturedProductsInput = {}
): Promise<string[]> {
  await dbConnect();
  const settings = await ShopFeaturedSettingsService.get();
  const limit = Math.min(
    48,
    Math.max(1, input.maxItems ?? settings.maxItems ?? 24)
  );

  const cmsIds = (input.cmsSelectedProductIds ?? []).filter(Boolean);
  if (cmsIds.length > 0) {
    const visible = await Product.find({
      _id: { $in: cmsIds.filter((id) => mongoose.isValidObjectId(id)) },
      isVisible: true,
    })
      .select("_id")
      .lean();
    const ordered = orderIdsByList(cmsIds, visible);
    return ordered.map((p) => p._id.toString()).slice(0, limit);
  }

  return resolveFromShopSettings(settings, limit);
}

async function resolveFromShopSettings(
  settings: ShopFeaturedSettings,
  limit: number
): Promise<string[]> {
  if (settings.mode === "manual" && settings.manualProductIds.length > 0) {
    const ids = settings.manualProductIds.filter((id) => mongoose.isValidObjectId(id));
    const rows = await Product.find({ _id: { $in: ids }, isVisible: true }).select("_id").lean();
    return orderIdsByList(ids, rows)
      .map((p) => p._id.toString())
      .slice(0, limit);
  }

  if (settings.mode === "byCategory" && settings.orderedCategoryIds.length > 0) {
    const categoryIds = settings.orderedCategoryIds.filter((id) =>
      mongoose.isValidObjectId(id)
    );
    const perCat =
      settings.perCategoryLimit > 0 ? settings.perCategoryLimit : limit;
    const perCategoryRows = await Promise.all(
      categoryIds.map(async (categoryId) => {
        const products = await Product.find({
          category: categoryId,
          isVisible: true,
        })
          .select("_id featuredListIndex createdAt")
          .lean();
        return sortByFeaturedListIndex(products as WithFeaturedIndex[]);
      })
    );

    const result: string[] = [];
    for (let i = 0; i < categoryIds.length && result.length < limit; i++) {
      const sorted = perCategoryRows[i];
      const take = Math.min(perCat, limit - result.length);
      for (const p of sorted.slice(0, take)) {
        result.push(p._id.toString());
      }
    }
    return result;
  }

  const products = await Product.find({ isVisible: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("_id")
    .lean();
  return products.map((p) => p._id.toString());
}

export async function resolveFeaturedCategoryIds(limit = 4): Promise<string[]> {
  return unstable_cache(
    () => resolveFeaturedCategoryIdsUncached(limit),
    ["homepage-featured-category-ids", String(limit)],
    {
      revalidate: 60,
      tags: [
        STOREFRONT_CACHE_TAGS.homepage,
        STOREFRONT_CACHE_TAGS.products,
        STOREFRONT_CACHE_TAGS.categories,
      ],
    }
  )();
}

async function resolveFeaturedCategoryIdsUncached(limit = 4): Promise<string[]> {
  await dbConnect();
  const settings = await ShopFeaturedSettingsService.get();

  if (settings.mode === "byCategory" && settings.orderedCategoryIds.length > 0) {
    return settings.orderedCategoryIds
      .filter((id) => mongoose.isValidObjectId(id))
      .slice(0, limit);
  }

  const categories = await Category.find({}).select("_id featuredListIndex createdAt").lean();
  return sortByFeaturedListIndex(categories as WithFeaturedIndex[])
    .map((c) => c._id.toString())
    .slice(0, limit);
}
