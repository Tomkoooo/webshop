import dbConnect from "@wse/core/lib/db";
import Product, { IProduct } from "@wse/core/models/Product";
import "@wse/core/models/Category";
import { revalidatePath, unstable_cache } from "next/cache";
import { cache } from "react";
import { revalidateStorefrontSitemap } from "@wse/core/lib/sitemap/revalidate-storefront-sitemap";
import { revalidateStorefrontTags, STOREFRONT_CACHE_TAGS } from "@wse/core/lib/storefront-cache-tags";
import { MediaService } from "./media";
import Review from "@wse/core/models/Review";
import mongoose from "mongoose";
import { resolveFeaturedProductIds } from "@wse/core/lib/featured-products";
import { toStorefrontProduct } from "@wse/core/lib/storefront-product";

export interface ProductFilters {
  search?: string;
  /** `text` uses MongoDB full-text index; `substring` matches name/slug partially (admin pickers). */
  searchStyle?: "text" | "substring";
  isActive?: boolean;
  isVisible?: boolean;
  deleted?: boolean;
  isDiscounted?: boolean;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeProductForListing(product: Record<string, unknown> | object) {
  const row = product as Record<string, unknown>
  const variants = Array.isArray(row.variants)
    ? (row.variants as Array<Record<string, unknown>>).filter((v) => v.isActive !== false)
    : [];
  const hasActiveVariants = variants.length > 0;
  const needsVariantSelection =
    Boolean(row.requireVariantSelection) && hasActiveVariants;
  const netPrice = Number(row.netPrice) || 0;
  const minVariantNetPrice = needsVariantSelection
    ? Math.min(
        ...variants.map((v) => Number(v.netPrice ?? netPrice) || netPrice)
      )
    : netPrice;
  const maxVariantDiscount = needsVariantSelection
    ? Math.max(...variants.map((v) => Number(v.discount || 0) || 0))
    : Number(row.discount || 0) || 0;
  const totalVariantStock = needsVariantSelection
    ? variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
    : Number(row.stock || 0) || 0;
  return toStorefrontProduct({
    ...row,
    variants,
    variantOptions: row.variantOptions,
    __displayNetPrice: minVariantNetPrice,
    __displayDiscount: maxVariantDiscount,
    __displayStock: totalVariantStock,
  }) as Record<string, unknown> & {
    __displayNetPrice: number
    __displayDiscount: number
    __displayStock: number
    createdAt?: string | Date
  }
}

async function buildProductListingQuery(filters: ProductFilters): Promise<Record<string, unknown>> {
  const query: Record<string, unknown> = {};

  const search = filters.search?.trim();
  if (search && search.length >= 2) {
    if (filters.searchStyle === "substring") {
      const re = new RegExp(escapeRegExp(search), "i");
      query.$or = [
        { name: re },
        { slug: re },
        { searchText: re },
        { "variants.sku": re },
      ];
    } else {
      query.$text = { $search: search };
    }
  }

  if (filters.isActive !== undefined) query.isActive = filters.isActive;
  if (filters.isVisible !== undefined) query.isVisible = filters.isVisible;
  query.deletedAt = filters.deleted ? { $ne: null } : null;

  if (filters.category) {
    const { CategoryService } = await import("./category");
    const categoryIds = await CategoryService.getDescendantIds(filters.category);
    query.category = { $in: categoryIds };
  }

  if (filters.isDiscounted) {
    query.$or = [
      { hasDiscount: true },
      { displayMaxDiscount: { $gt: 0 } },
      { discount: { $gt: 0 } },
      { "variants.discount": { $gt: 0 } },
    ];
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    query.displayMinGrossPrice = {
      ...(filters.minPrice !== undefined ? { $gte: filters.minPrice } : {}),
      ...(filters.maxPrice !== undefined ? { $lte: filters.maxPrice } : {}),
    };
  }

  return query;
}

function productId(product: Record<string, unknown>): string {
  const id = product._id as string | { toString(): string } | undefined;
  return typeof id === "string" ? id : id?.toString() ?? "";
}

function compareFeaturedListIndex(
  a: Record<string, unknown> & { createdAt?: string | Date },
  b: Record<string, unknown> & { createdAt?: string | Date }
): number {
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
}

function orderByFeaturedSettings<T extends Record<string, unknown> & { createdAt?: string | Date }>(
  products: T[],
  featuredIds: string[]
): T[] {
  const rank = new Map(featuredIds.map((id, index) => [id, index]));
  return [...products].sort((a, b) => {
    const ar = rank.get(productId(a));
    const br = rank.get(productId(b));
    const aFeatured = ar !== undefined;
    const bFeatured = br !== undefined;

    if (aFeatured && bFeatured) return ar - br;
    if (aFeatured) return -1;
    if (bFeatured) return 1;
    return compareFeaturedListIndex(a, b);
  });
}

function sortFieldForFilter(sort?: string): Record<string, 1 | -1> {
  switch (sort) {
    case "oldest":
      return { createdAt: 1 };
    case "price-asc":
      return { displayMinGrossPrice: 1, createdAt: -1 };
    case "price-desc":
      return { displayMinGrossPrice: -1, createdAt: -1 };
    case "discount":
      return { displayMaxDiscount: -1, createdAt: -1 };
    case "newest":
    default:
      return { createdAt: -1 };
  }
}

const LISTING_SELECT =
  "name slug images category stock netPrice grossPrice discount limitedPrice vatPercent variantOptions variants requireVariantSelection isActive isVisible deletedAt featuredListIndex displayMinGrossPrice displayMaxDiscount displayTotalStock hasDiscount";

const getCachedProductBySlug = cache(async (slug: string) =>
  unstable_cache(
    async () => {
      await dbConnect();
      const product = await Product.findOne({ slug, deletedAt: null, $or: [{ isActive: true }, { isVisible: true }] })
        .populate("category")
        .lean();

      if (!product) return null;

      const reviews = await Review.find({
        product: product._id,
        $or: [{ status: "approved" }, { status: { $exists: false } }],
      })
        .populate("user", "name")
        .sort({ createdAt: -1 })
        .lean();

      return toStorefrontProduct({
        ...product,
        reviews,
      } as Record<string, unknown>);
    },
    ["storefront-product-by-slug", slug],
    { revalidate: 60, tags: [STOREFRONT_CACHE_TAGS.products] }
  )()
);

export class ProductService {
  static async getPaginated(page: number = 1, limit: number = 10, filters: ProductFilters = {}) {
    await dbConnect();

    const query = await buildProductListingQuery(filters);

    const needsInMemoryFilter = false;

    if (!needsInMemoryFilter) {
      const skip = (page - 1) * limit;
      const [products, total] = await Promise.all([
        Product.find(query)
          .select(LISTING_SELECT)
          .populate("category")
          .sort(sortFieldForFilter(filters.sort))
          .skip(skip)
          .limit(limit)
          .lean(),
        Product.countDocuments(query),
      ]);
      return {
        products: products.map((p) => normalizeProductForListing(p)),
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      };
    }

    const allProducts = await Product.find(query).populate("category").lean();
    const normalizedProducts = allProducts.map((product) => normalizeProductForListing(product));

    const filteredProducts = normalizedProducts.filter((product) => {
      if (filters.isDiscounted && product.__displayDiscount <= 0) return false;
      if (filters.minPrice !== undefined && product.__displayNetPrice < filters.minPrice)
        return false;
      if (filters.maxPrice !== undefined && product.__displayNetPrice > filters.maxPrice)
        return false;
      return true;
    });

    filteredProducts.sort((a, b) => {
      const sort = filters.sort || "newest";
      switch (sort) {
        case "price-asc":
          return a.__displayNetPrice - b.__displayNetPrice;
        case "price-desc":
          return b.__displayNetPrice - a.__displayNetPrice;
        case "oldest":
          return new Date(a.createdAt as string).getTime() - new Date(b.createdAt as string).getTime();
        case "discount":
          return b.__displayDiscount - a.__displayDiscount;
        case "newest":
        default:
          return new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime();
      }
    });

    const total = filteredProducts.length;
    const skip = (page - 1) * limit;
    const products = filteredProducts.slice(skip, skip + limit);

    return {
      products,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  static async getStorefrontPaginated(
    page: number = 1,
    limit: number = 10,
    filters: ProductFilters = {}
  ) {
    const sort = filters.sort || "featured";
    if (sort !== "featured") {
      return this.getPaginated(page, limit, filters);
    }

    await dbConnect();
    const query = await buildProductListingQuery(filters);
    const [rows, featuredIds] = await Promise.all([
      Product.find(query)
        .select(LISTING_SELECT)
        .populate("category")
        .lean(),
      resolveFeaturedProductIds(),
    ]);
    const ordered = orderByFeaturedSettings(
      rows.map((p) => normalizeProductForListing(p)),
      featuredIds
    );
    const total = ordered.length;
    const skip = (page - 1) * limit;

    return {
      products: ordered.slice(skip, skip + limit),
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  static async getByIds(ids: string[], options: { includeDeleted?: boolean } = {}) {
    await dbConnect();
    const objectIds = ids.filter((id) => mongoose.isValidObjectId(id));
    if (objectIds.length === 0) return [];
    const query: Record<string, unknown> = { _id: { $in: objectIds } };
    if (!options.includeDeleted) query.deletedAt = null;
    const rows = await Product.find(query)
      .populate("category")
      .lean();
    return rows;
  }

  static async getHomepageFeaturedByIds(ids: string[]) {
    await dbConnect();
    const objectIds = ids.filter((id) => mongoose.isValidObjectId(id));
    if (objectIds.length === 0) return [];
    return await Product.find({ _id: { $in: objectIds }, deletedAt: null })
      .select(LISTING_SELECT)
      .populate("category", "name slug seo image")
      .lean();
  }

  static async getById(id: string, options: { includeDeleted?: boolean } = {}) {
    await dbConnect();
    const query: Record<string, unknown> = { _id: id };
    if (!options.includeDeleted) query.deletedAt = null;
    return await Product.findOne(query).populate("category").lean();
  }

  static async getBySlug(slug: string) {
    return getCachedProductBySlug(slug);
  }

  static async create(data: Partial<IProduct>) {
    await dbConnect();
    const product = await Product.create(data);

    if (product.images && product.images.length > 0) {
      await MediaService.incrementUsage(product.images);
    }

    revalidatePath("/admin/products");
    revalidateStorefrontSitemap();
    revalidateStorefrontTags(STOREFRONT_CACHE_TAGS.products);
    return product;
  }

  static async update(id: string, data: Partial<IProduct>) {
    await dbConnect();
    const oldProduct = await Product.findById(id).lean();
    const product = await Product.findByIdAndUpdate(id, data, { returnDocument: "after" });

    if (oldProduct && product) {
      await MediaService.syncUsage(oldProduct.images || [], product.images || []);
    }

    revalidatePath("/admin/products");
    revalidateStorefrontSitemap();
    revalidateStorefrontTags(STOREFRONT_CACHE_TAGS.products);
    return product;
  }

  static async delete(id: string) {
    await dbConnect();
    const product = await Product.findByIdAndUpdate(
      id,
      {
        $set: {
          deletedAt: new Date(),
          isActive: false,
          isVisible: false,
        },
      },
      { returnDocument: "after" }
    );
    revalidatePath("/admin/products");
    revalidateStorefrontSitemap();
    revalidateStorefrontTags(STOREFRONT_CACHE_TAGS.products);
    return product;
  }

  static async restore(id: string) {
    await dbConnect();
    const product = await Product.findByIdAndUpdate(
      id,
      {
        $set: {
          deletedAt: null,
          isActive: false,
          isVisible: false,
        },
      },
      { returnDocument: "after" }
    );
    revalidatePath("/admin/products");
    revalidateStorefrontSitemap();
    revalidateStorefrontTags(STOREFRONT_CACHE_TAGS.products);
    return product;
  }

  static async resetLimitedPriceCounters(id: string, variantId?: string) {
    await dbConnect();
    if (variantId) {
      await Product.updateOne(
        { _id: id, "variants.id": variantId },
        {
          $set: {
            "variants.$.limitedPrice.claimedCount": 0,
            "variants.$.limitedPrice.reservedCount": 0,
            "variants.$.limitedPrice.soldCount": 0,
          },
        }
      );
    } else {
      await Product.updateOne(
        { _id: id },
        {
          $set: {
            "limitedPrice.claimedCount": 0,
            "limitedPrice.reservedCount": 0,
            "limitedPrice.soldCount": 0,
          },
        }
      );
    }
    revalidatePath("/admin/products");
    revalidateStorefrontSitemap();
    revalidateStorefrontTags(STOREFRONT_CACHE_TAGS.products);
  }
}
