import mongoose from "mongoose";
import dbConnect from "@wse/core/lib/db";
import Order from "@wse/core/models/Order";
import Product from "@wse/core/models/Product";
import { canEditOrderItems } from "@wse/core/lib/order-items-edit";
import { roundHuf } from "@wse/core/lib/pricing";
import {
  getActiveVariants,
  getVariantById,
  getVariantLabel,
  hasVariants,
  resolveProductView,
} from "@wse/core/lib/product-variants";
import {
  decrementCheckoutLineStock,
  restoreCheckoutLineStock,
  type CheckoutStockAllocation,
} from "@wse/core/services/inventory-reservation";
import { InventoryReservationError } from "@wse/core/services/inventory-reservation";

import { type OrderAddableProduct } from "@wse/core/lib/order-items-edit";

function isLimitedPriceLineName(name: string): boolean {
  return name.toLowerCase().includes("limitált ár");
}

function productIdFromOrderItem(product: unknown): string {
  if (!product) return "";
  if (typeof product === "string") return product;
  if (typeof product === "object" && product !== null && "_id" in product) {
    return String((product as { _id: unknown })._id);
  }
  return String(product);
}

function recalculateOrderTotals(order: InstanceType<typeof Order>) {
  const subtotal = roundHuf(
    order.items.reduce(
      (sum: number, item: { price?: number; quantity?: number }) =>
        sum + Number(item.price || 0) * Number(item.quantity || 0),
      0
    )
  );
  const shippingFee = roundHuf(Number(order.shippingFee || 0));
  const paymentFee = roundHuf(Number(order.paymentFee || 0));
  const discount = Math.min(roundHuf(Number(order.discount || 0)), subtotal + shippingFee + paymentFee);
  const total = Math.max(0, roundHuf(subtotal + shippingFee + paymentFee - discount));

  order.subtotal = subtotal;
  order.discount = discount;
  order.total = total;
}

function allocationToOrderItems(
  productId: mongoose.Types.ObjectId,
  allocation: CheckoutStockAllocation,
  baseName: string,
  variantId?: string,
  variantLabel?: string,
  selectedAttributes?: Record<string, string>
) {
  const lines: Array<{
    product: mongoose.Types.ObjectId;
    variantId?: string;
    variantLabel?: string;
    selectedAttributes?: Record<string, string>;
    name: string;
    price: number;
    quantity: number;
    vatPercent?: number;
  }> = [];

  const vatPercent = allocation.vatPercent;

  if (allocation.promoQuantity > 0 && allocation.promoUnitPrice != null) {
    lines.push({
      product: productId,
      variantId,
      variantLabel,
      selectedAttributes,
      name: `${baseName} - limitált ár`,
      price: roundHuf(allocation.promoUnitPrice),
      quantity: allocation.promoQuantity,
      vatPercent,
    });
  }

  if (allocation.regularQuantity > 0 && allocation.regularUnitPrice != null) {
    lines.push({
      product: productId,
      variantId,
      variantLabel,
      selectedAttributes,
      name: baseName,
      price: roundHuf(allocation.regularUnitPrice),
      quantity: allocation.regularQuantity,
      vatPercent,
    });
  }

  return lines;
}

export async function getOrderAddableProducts(): Promise<OrderAddableProduct[]> {
  await dbConnect();
  const products = await Product.find({ deletedAt: null, isActive: true, isVisible: true })
    .select("name stock variants requireVariantSelection")
    .sort({ name: 1 })
    .lean();

  return products.map((product) => {
    const activeVariants = getActiveVariants(product as never);
    const requiresVariant =
      Boolean(product.requireVariantSelection) && activeVariants.length > 0;

    return {
      id: product._id.toString(),
      name: product.name,
      stock: Math.max(0, Number(product.stock) || 0),
      requiresVariant,
      variants: activeVariants.map((variant) => ({
        id: variant.id,
        label: getVariantLabel(variant),
        stock: Math.max(0, Number(variant.stock) || 0),
      })),
    };
  });
}

export async function removeOrderItem(orderId: string, itemIndex: number) {
  await dbConnect();

  const order = await Order.findById(orderId);
  if (!order) throw new Error("A rendelés nem található.");
  if (!canEditOrderItems(order)) {
    throw new Error("Ehhez a rendeléshez nem módosíthatók a tételek.");
  }
  if (order.items.length <= 1) {
    throw new Error("A rendelésnek legalább egy tétele maradnia kell.");
  }
  if (!Number.isInteger(itemIndex) || itemIndex < 0 || itemIndex >= order.items.length) {
    throw new Error("Érvénytelen tétel.");
  }

  const item = order.items[itemIndex];
  const productId = productIdFromOrderItem(item.product);
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error("A tétel termékazonosítója érvénytelen.");
  }

  const promoQuantity = isLimitedPriceLineName(item.name) ? item.quantity : 0;

  try {
    await restoreCheckoutLineStock({
      product: productId,
      variantId: item.variantId,
      quantity: item.quantity,
      promoQuantity,
      promoCounter: "sold",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "A készlet visszaállítása sikertelen.";
    throw new Error(message);
  }

  order.items.splice(itemIndex, 1);
  recalculateOrderTotals(order);
  await order.save();

  return { success: true as const };
}

export async function addOrderItem(
  orderId: string,
  input: { productId: string; variantId?: string; quantity: number }
) {
  await dbConnect();

  const order = await Order.findById(orderId);
  if (!order) throw new Error("A rendelés nem található.");
  if (!canEditOrderItems(order)) {
    throw new Error("Ehhez a rendeléshez nem módosíthatók a tételek.");
  }

  const productId = String(input.productId || "").trim();
  const quantity = Math.max(1, Math.round(Number(input.quantity || 0)));
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error("Érvénytelen termék.");
  }

  const product = await Product.findById(productId).lean();
  if (!product || product.deletedAt) throw new Error("A termék nem található.");
  if (!product.isActive || !product.isVisible) {
    throw new Error("A termék jelenleg nem rendelhető.");
  }

  const variantId = input.variantId?.trim() || undefined;
  const productHasVariants = hasVariants(product as never);
  const requiresVariant =
    Boolean(product.requireVariantSelection) && productHasVariants;

  if (requiresVariant && !variantId) {
    throw new Error("Válassz variánst a termékhez.");
  }
  if (variantId && !getVariantById(product as never, variantId)) {
    throw new Error("A kiválasztott variáns nem elérhető.");
  }

  const view = resolveProductView(product as never, variantId);
  const variant = variantId ? getVariantById(product as never, variantId) : null;
  const variantLabel = variant ? getVariantLabel(variant) : undefined;

  let allocation: CheckoutStockAllocation;
  try {
    allocation = await decrementCheckoutLineStock(undefined, {
      product: productId,
      variantId,
      quantity,
      promoCounter: "sold",
    });
  } catch (error) {
    if (error instanceof InventoryReservationError) {
      throw new Error(error.message);
    }
    const message = error instanceof Error ? error.message : "A készlet csökkentése sikertelen.";
    throw new Error(message);
  }

  const newLines = allocationToOrderItems(
    new mongoose.Types.ObjectId(productId),
    allocation,
    view.name,
    variantId,
    variantLabel,
    variant?.attributes
  );

  if (newLines.length === 0) {
    throw new Error("Nem sikerült tételsort létrehozni.");
  }

  order.items.push(...newLines);
  recalculateOrderTotals(order);
  await order.save();

  return { success: true as const };
}
