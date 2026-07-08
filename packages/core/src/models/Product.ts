import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRating {
  user: mongoose.Types.ObjectId;
  rating: number; // 1-5
  comment?: string;
  createdAt: Date;
}

export interface IVariantOption {
  name: string;
  values: string[];
}

export interface ILimitedVariantPrice {
  enabled: boolean;
  limitQuantity: number;
  netPrice?: number;
  grossPrice?: number;
  reservedCount: number;
  soldCount: number;
  /** Internal atomic quota counter: reserved + sold for active claims. */
  claimedCount: number;
}

export interface IProductVariant {
  id: string;
  slugPart?: string;
  sku?: string;
  attributes: Record<string, string>;
  nameOverride?: string;
  descriptionOverride?: string;
  netPrice: number;
  /** Merchant-entered customer gross (HUF); when set, overrides netToGross for display/checkout. */
  grossPrice?: number;
  discount: number;
  stock: number;
  isActive: boolean;
  isDefault?: boolean;
  images?: string[];
  limitedPrice?: ILimitedVariantPrice;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

export interface IUniqueNumberedVariants {
  enabled: boolean;
  attributeName: string;
  maxQuantityPerLine: number;
  /** HTML shown on PDP when a numbered variant is selected; supports {{number}}. Falls back to product description when empty. */
  descriptionHtml?: string;
  baseVariantId?: string;
  numberRanges?: Array<{ from: number; to: number; exclude?: number[] }>;
}

export interface IProduct extends Document {
  /** VAT % included in gross price calculations (Hungary default 27). */
  vatPercent: number;
  name: string;
  images: string[];
  description: string;
  ratings: IRating[];
  variantOptions: IVariantOption[];
  variants: IProductVariant[];
  requireVariantSelection: boolean;
  /** One-of-a-kind numbered variants (e.g. comic issue numbers), stock 1 per variant. */
  uniqueNumberedVariants?: IUniqueNumberedVariants;
  stock: number;
  netPrice: number;
  grossPrice?: number;
  discount: number;
  limitedPrice?: ILimitedVariantPrice;
  category: mongoose.Types.ObjectId | any;
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  slug: string;
  isActive: boolean;
  isVisible: boolean;
  deletedAt?: Date | null;
  /** Lower = earlier in homepage featured section (within category / manual lists). */
  featuredListIndex?: number | null;
  displayMinGrossPrice?: number;
  displayMaxDiscount?: number;
  displayTotalStock?: number;
  hasDiscount?: boolean;
  searchText?: string;
}

const ProductSchema = new Schema<IProduct>(
  {
    vatPercent: { type: Number, default: 27, min: 0, max: 100 },
    name: { type: String, required: true },
    images: { type: [String], required: true, default: [] },
    description: { type: String, required: true },
    ratings: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    variantOptions: [
      {
        name: { type: String, required: true },
        values: [{ type: String, required: true }],
      },
    ],
    variants: [
      {
        id: { type: String, required: true },
        slugPart: { type: String },
        sku: { type: String },
        attributes: { type: Schema.Types.Mixed, default: {} },
        nameOverride: { type: String },
        descriptionOverride: { type: String },
        netPrice: { type: Number, required: true },
        grossPrice: { type: Number },
        discount: { type: Number, default: 0 },
        stock: { type: Number, required: true, default: 0 },
        isActive: { type: Boolean, default: true },
        isDefault: { type: Boolean, default: false },
        images: [{ type: String }],
        limitedPrice: {
          enabled: { type: Boolean, default: false },
          limitQuantity: { type: Number, default: 0, min: 0 },
          netPrice: { type: Number },
          grossPrice: { type: Number },
          reservedCount: { type: Number, default: 0, min: 0 },
          soldCount: { type: Number, default: 0, min: 0 },
          claimedCount: { type: Number, default: 0, min: 0 },
        },
        seo: {
          title: { type: String },
          description: { type: String },
          keywords: [{ type: String }],
        },
      },
    ],
    requireVariantSelection: { type: Boolean, default: false },
    uniqueNumberedVariants: {
      enabled: { type: Boolean, default: false },
      attributeName: { type: String, default: "Szám" },
      maxQuantityPerLine: { type: Number, default: 1, min: 1 },
      descriptionHtml: { type: String },
      baseVariantId: { type: String, default: "base" },
      numberRanges: [
        {
          from: { type: Number, required: true },
          to: { type: Number, required: true },
          exclude: [{ type: Number }],
        },
      ],
    },
    stock: { type: Number, required: true, default: 0 },
    netPrice: { type: Number, required: true },
    grossPrice: { type: Number },
    discount: { type: Number, default: 0 },
    limitedPrice: {
      enabled: { type: Boolean, default: false },
      limitQuantity: { type: Number, default: 0, min: 0 },
      netPrice: { type: Number },
      grossPrice: { type: Number },
      reservedCount: { type: Number, default: 0, min: 0 },
      soldCount: { type: Number, default: 0, min: 0 },
      claimedCount: { type: Number, default: 0, min: 0 },
    },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    seo: {
      title: { type: String },
      description: { type: String },
      keywords: [{ type: String }],
    },
    slug: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: false },
    isVisible: { type: Boolean, default: true }, // "Disabled but not hidden" by default
    deletedAt: { type: Date, default: null },
    featuredListIndex: { type: Number, default: null },
    displayMinGrossPrice: { type: Number, default: 0 },
    displayMaxDiscount: { type: Number, default: 0 },
    displayTotalStock: { type: Number, default: 0 },
    hasDiscount: { type: Boolean, default: false },
    searchText: { type: String, default: "" },
  },
  { timestamps: true }
);

ProductSchema.pre("validate", function () {
  const product = this as IProduct;
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const activeVariants = variants.filter((variant) => variant.isActive !== false);
  const vatRate = Math.max(0, Math.min(100, Number(product.vatPercent ?? 27))) / 100;
  const priceLines = activeVariants.length > 0
    ? activeVariants.map((variant) => ({
        netPrice:
          variant.limitedPrice?.enabled &&
          Number(variant.limitedPrice.limitQuantity || 0) > Number(variant.limitedPrice.claimedCount || 0) &&
          Number(variant.limitedPrice.netPrice || 0) > 0
            ? Number(variant.limitedPrice.netPrice)
            : Number(variant.netPrice ?? product.netPrice) || 0,
        grossPrice:
          variant.limitedPrice?.enabled &&
          Number(variant.limitedPrice.limitQuantity || 0) > Number(variant.limitedPrice.claimedCount || 0) &&
          Number(variant.limitedPrice.grossPrice || 0) > 0
            ? Number(variant.limitedPrice.grossPrice)
            : Number(variant.grossPrice) || 0,
        discount:
          variant.limitedPrice?.enabled &&
          Number(variant.limitedPrice.limitQuantity || 0) > Number(variant.limitedPrice.claimedCount || 0)
            ? 0
            : Number(variant.discount || 0) || 0,
        stock: Number(variant.stock || 0) || 0,
      }))
    : [
        {
          netPrice:
            product.limitedPrice?.enabled &&
            Number(product.limitedPrice.limitQuantity || 0) > Number(product.limitedPrice.claimedCount || 0) &&
            Number(product.limitedPrice.netPrice || 0) > 0
              ? Number(product.limitedPrice.netPrice)
              : Number(product.netPrice) || 0,
          grossPrice:
            product.limitedPrice?.enabled &&
            Number(product.limitedPrice.limitQuantity || 0) > Number(product.limitedPrice.claimedCount || 0) &&
            Number(product.limitedPrice.grossPrice || 0) > 0
              ? Number(product.limitedPrice.grossPrice)
              : Number(product.grossPrice) || 0,
          discount:
            product.limitedPrice?.enabled &&
            Number(product.limitedPrice.limitQuantity || 0) > Number(product.limitedPrice.claimedCount || 0)
              ? 0
              : Number(product.discount || 0) || 0,
          stock: Number(product.stock || 0) || 0,
        },
      ];

  const grossPrices = priceLines.map((line) => {
    const baseGross = line.grossPrice > 0 ? line.grossPrice : Math.round(line.netPrice * (1 + vatRate));
    return Math.round(baseGross * (1 - line.discount / 100));
  });

  product.displayMinGrossPrice = grossPrices.length > 0 ? Math.min(...grossPrices) : 0;
  product.displayMaxDiscount = Math.max(0, ...priceLines.map((line) => line.discount));
  product.displayTotalStock = priceLines.reduce((sum, line) => sum + line.stock, 0);
  product.hasDiscount = product.displayMaxDiscount > 0;
  product.searchText = [
    product.name,
    product.slug,
    product.description,
    ...(product.variantOptions || []).flatMap((option) => [option.name, ...(option.values || [])]),
    ...variants.flatMap((variant) => [
      variant.sku,
      variant.nameOverride,
      variant.descriptionOverride,
      ...Object.values(variant.attributes || {}),
    ]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (variants.length > 0) {
    const seenIds = new Set<string>();
    for (const variant of variants) {
      if (seenIds.has(variant.id)) {
        throw new Error(`Duplicate variant id: ${variant.id}`);
      }
      seenIds.add(variant.id);
    }
  }
});


ProductSchema.index({ isVisible: 1, category: 1, createdAt: -1 });
ProductSchema.index({ isVisible: 1, createdAt: -1 });
ProductSchema.index({ isVisible: 1, isActive: 1, createdAt: -1 });
ProductSchema.index({ deletedAt: 1, createdAt: -1 });
ProductSchema.index({ isVisible: 1, isActive: 1, category: 1, createdAt: -1 });
ProductSchema.index({ isVisible: 1, category: 1, featuredListIndex: 1, createdAt: -1 });
ProductSchema.index({ isVisible: 1, displayMinGrossPrice: 1 });
ProductSchema.index({ isVisible: 1, hasDiscount: 1, createdAt: -1 });
ProductSchema.index({
  name: "text",
  slug: "text",
  description: "text",
  searchText: "text",
  "variantOptions.values": "text",
  "variants.nameOverride": "text",
  "variants.descriptionOverride": "text",
  "variants.sku": "text",
});

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
