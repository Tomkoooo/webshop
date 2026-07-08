import dbConnect from "@wse/core/lib/db";
import Cart, { ICart } from "@wse/core/models/Cart";
import Product from "@wse/core/models/Product";
import mongoose from "mongoose";
import { parseCartLineIdentity } from "@wse/core/lib/cart-line-id";
import { getVariantById, getVariantLabel } from "@wse/core/lib/product-variants";
import { grossFromNetWithDiscount, clampVatPercent } from "@wse/core/lib/pricing";
import { isUniqueNumberedProduct, maxQuantityForCartLine } from "@wse/core/lib/unique-numbered-variants";

type LocalCartInput = {
  id?: unknown;
  productId?: unknown;
  variantId?: unknown;
  variantLabel?: unknown;
  selectedAttributes?: Record<string, string>;
  quantity?: unknown;
};

function normalizedCartSignature(
  items: Array<{ product: unknown; variantId?: string; quantity: number }>
) {
  return JSON.stringify(
    items
      .map((item) => ({
        productId: item.product?.toString() ?? "",
        variantId: item.variantId || "",
        quantity: Math.max(1, Number(item.quantity) || 1),
      }))
      .sort((a, b) => {
        const keyA = `${a.productId}:${a.variantId}`;
        const keyB = `${b.productId}:${b.variantId}`;
        return keyA.localeCompare(keyB);
      })
  );
}

type ProductLean = {
  _id: mongoose.Types.ObjectId;
  stock?: number;
  isActive?: boolean;
  isVisible?: boolean;
  netPrice?: number;
  grossPrice?: number;
  discount?: number;
  vatPercent?: number;
  uniqueNumberedVariants?: { enabled?: boolean; maxQuantityPerLine?: number };
  variants?: Array<{
    id: string;
    isActive?: boolean;
    stock?: number;
    netPrice?: number;
    grossPrice?: number;
    discount?: number;
    attributes?: Record<string, string>;
  }>;
};

function resolveLineStockCap(product: ProductLean, variantId?: string): number {
  if (variantId) {
    const variant = product.variants?.find((v) => v.id === variantId);
    if (!variant || variant.isActive === false) return 0;
    return maxQuantityForCartLine(product, variant.stock, variantId);
  }
  return maxQuantityForCartLine(product, product.stock, variantId);
}

export class CartService {
  static async getCart(userId: string) {
    await dbConnect();
    let cart = await Cart.findOne({ user: new mongoose.Types.ObjectId(userId) })
      .populate("items.product")
      .lean();

    if (!cart) {
      cart = await Cart.create({
        user: new mongoose.Types.ObjectId(userId),
        items: [],
      });
    }

    return cart;
  }

  /** Replace server cart with validated client lines (per product + variant). */
  static async replaceCart(userId: string, localItems: LocalCartInput[]) {
    await dbConnect();
    const userObjectId = new mongoose.Types.ObjectId(userId);
    let cart = await Cart.findOne({ user: userObjectId });

    if (!cart) {
      cart = new Cart({ user: userObjectId, items: [] });
    }

    const requested = new Map<
      string,
      { productId: string; variantId?: string; quantity: number; variantLabel?: string; selectedAttributes?: Record<string, string> }
    >();

    for (const localItem of Array.isArray(localItems) ? localItems : []) {
      try {
        const { productId, variantId } = parseCartLineIdentity({
          id: String(localItem.id || ""),
          productId: String(localItem.productId || ""),
          variantId: localItem.variantId != null ? String(localItem.variantId) : undefined,
        });
        const objectId = new mongoose.Types.ObjectId(productId);
        const qty = Math.max(1, Number(localItem.quantity) || 1);
        const key = variantId ? `${objectId.toString()}:${variantId}` : objectId.toString();
        const prev = requested.get(key);
        requested.set(key, {
          productId: objectId.toString(),
          variantId,
          quantity: (prev?.quantity || 0) + qty,
          variantLabel:
            typeof localItem.variantLabel === "string" ? localItem.variantLabel : prev?.variantLabel,
          selectedAttributes:
            localItem.selectedAttributes && typeof localItem.selectedAttributes === "object"
              ? localItem.selectedAttributes
              : prev?.selectedAttributes,
        });
      } catch {
        continue;
      }
    }

    const objectIds = [...new Set([...requested.values()].map((r) => r.productId))].map(
      (id) => new mongoose.Types.ObjectId(id)
    );
    const products = objectIds.length
      ? await Product.find({
          _id: { $in: objectIds },
          isActive: true,
          isVisible: true,
          deletedAt: null,
        })
          .select(
            "stock netPrice grossPrice discount vatPercent variants uniqueNumberedVariants requireVariantSelection"
          )
          .lean()
      : [];

    const productById = new Map(products.map((p) => [p._id.toString(), p as ProductLean]));

    const nextItems: ICart["items"] = [];
    for (const line of requested.values()) {
      const product = productById.get(line.productId);
      if (!product) continue;

      const cap = resolveLineStockCap(product, line.variantId);
      if (cap <= 0) continue;

      const qty = Math.min(line.quantity, cap);
      if (qty < 1) continue;

      const variant = line.variantId
        ? product.variants?.find((v) => v.id === line.variantId)
        : undefined;
      const variantLabel =
        line.variantLabel?.trim() ||
        (variant ? getVariantLabel(variant as never) : undefined);

      nextItems.push({
        product: product._id,
        quantity: qty,
        variantId: line.variantId,
        variantLabel,
        selectedAttributes: line.selectedAttributes || variant?.attributes,
      });
    }

    if (normalizedCartSignature(cart.items) === normalizedCartSignature(nextItems)) {
      return await cart.populate("items.product");
    }

    cart.items = nextItems;
    await cart.save();
    return await cart.populate("items.product");
  }

  static async updateQuantity(userId: string, productId: string, quantity: number, variantId?: string) {
    await dbConnect();
    const cart = await Cart.findOne({ user: new mongoose.Types.ObjectId(userId) });
    if (!cart) throw new Error("Cart not found");

    const product = await Product.findById(productId).lean();
    if (!product) throw new Error("Product not found");

    const cap = resolveLineStockCap(product as ProductLean, variantId);
    const itemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        (variantId ? item.variantId === variantId : !item.variantId)
    );

    if (itemIndex > -1) {
      if (quantity <= 0 || cap <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = Math.min(quantity, cap);
      }
      await cart.save();
    }

    return await cart.populate("items.product");
  }

  static async removeItem(userId: string, productId: string, variantId?: string) {
    await dbConnect();
    const cart = await Cart.findOne({ user: new mongoose.Types.ObjectId(userId) });
    if (!cart) return null;

    cart.items = cart.items.filter((item) => {
      if (item.product.toString() !== productId) return true;
      if (variantId) return item.variantId !== variantId;
      return Boolean(item.variantId);
    });

    await cart.save();
    return await cart.populate("items.product");
  }
}
