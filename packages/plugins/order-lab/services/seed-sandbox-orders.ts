import mongoose from "mongoose";
import dbConnect from "@wse/core/lib/db";
import Product from "@wse/core/models/Product";
import SandboxOrder from "@wse/plugin-order-lab/models/SandboxOrder";
import { resolveSandboxApm } from "@wse/core/lib/foxpost-sandbox-apms";
import { netToGross, clampVatPercent, DEFAULT_VAT_PERCENT } from "@wse/core/lib/pricing";

const SEED_CUSTOMERS = [
  { name: "Teszt Elek", email: "teszt.elek@example.com", phone: "+36201234567" },
  { name: "Sandbox Anna", email: "sandbox.anna@example.com", phone: "+36301234567" },
  { name: "Foxpost Béla", email: "foxpost.bela@example.com", phone: "+36701234567" },
];

const DUMMY_STREET = "Teszt utca 1.";

type SeedLineItem = {
  productId?: mongoose.Types.ObjectId;
  variantId?: string;
  variantLabel?: string;
  selectedAttributes?: Record<string, string>;
  name: string;
  price: number;
  quantity: number;
  vatPercent?: number;
};

async function buildLineItemsFromCatalog(maxItems = 2): Promise<SeedLineItem[]> {
  const products = await Product.find({ isActive: { $ne: false } })
    .sort({ updatedAt: -1 })
    .limit(12)
    .lean();

  if (products.length === 0) {
    return [
      {
        name: "Sandbox teszt termék",
        price: 4990,
        quantity: 1,
        vatPercent: DEFAULT_VAT_PERCENT,
      },
    ];
  }

  const items: SeedLineItem[] = [];
  const usedProductIds = new Set<string>();

  for (const product of products) {
    if (items.length >= maxItems) break;
    const productId = String(product._id);
    if (usedProductIds.has(productId)) continue;

    const variants = Array.isArray(product.variants)
      ? product.variants.filter((variant) => variant.isActive !== false)
      : [];

    if (variants.length > 0) {
      const variant = variants[items.length % variants.length];
      const vatPercent = clampVatPercent(product.vatPercent ?? DEFAULT_VAT_PERCENT);
      const gross =
        variant.limitedPrice?.enabled &&
        Number(variant.limitedPrice.limitQuantity || 0) > Number(variant.limitedPrice.claimedCount || 0) &&
        Number(variant.limitedPrice.grossPrice || 0) > 0
          ? Number(variant.limitedPrice.grossPrice)
          : Number(variant.grossPrice) ||
            netToGross(Number(variant.netPrice ?? product.netPrice) || 0, vatPercent);

      items.push({
        productId: new mongoose.Types.ObjectId(productId),
        variantId: variant.id,
        variantLabel: variant.nameOverride || Object.values(variant.attributes || {}).join(" / ") || variant.sku,
        selectedAttributes: variant.attributes,
        name: variant.nameOverride || product.name,
        price: Math.round(gross),
        quantity: 1,
        vatPercent,
      });
    } else {
      const vatPercent = clampVatPercent(product.vatPercent ?? DEFAULT_VAT_PERCENT);
      const gross =
        Number(product.grossPrice) || netToGross(Number(product.netPrice) || 0, vatPercent);
      items.push({
        productId: new mongoose.Types.ObjectId(productId),
        name: product.name,
        price: Math.round(gross),
        quantity: 1,
        vatPercent,
      });
    }

    usedProductIds.add(productId);
  }

  return items;
}

function buildOrderNumber(index: number): string {
  const stamp = Date.now().toString(36).toUpperCase();
  return `SBOX-${stamp}-${String(index + 1).padStart(2, "0")}`;
}

export async function seedSandboxOrders(input: {
  count: number;
  apmId?: string;
  seededByUserId?: string;
}) {
  await dbConnect();

  const count = Math.min(Math.max(Math.floor(input.count), 1), 20);
  const apm = await resolveSandboxApm(input.apmId);
  const lineItemTemplate = await buildLineItemsFromCatalog(2);
  const createdIds: string[] = [];

  for (let i = 0; i < count; i += 1) {
    const customer = SEED_CUSTOMERS[i % SEED_CUSTOMERS.length];
    const items = lineItemTemplate.map((item, itemIndex) => ({
      ...item,
      quantity: itemIndex === 0 ? 1 : item.quantity,
    }));
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingFee = 990;
    const total = subtotal + shippingFee;

    const doc = await SandboxOrder.create({
      orderNumber: buildOrderNumber(i),
      status: "processing",
      items,
      shippingAddress: {
        name: customer.name,
        zip: apm.zip || "8200",
        city: apm.city || "Veszprém",
        street: DUMMY_STREET,
        email: customer.email,
        phone: customer.phone,
        comment: "Sandbox rendelés — order-lab plugin",
      },
      foxpostParcelPoint: apm,
      subtotal,
      shippingFee,
      total,
      notes: `Sandbox seed — automata ${apm.id}`,
      seededBy: input.seededByUserId
        ? new mongoose.Types.ObjectId(input.seededByUserId)
        : undefined,
    });

    createdIds.push(doc._id.toString());
  }

  return { createdCount: createdIds.length, orderIds: createdIds, apmId: apm.id };
}

export async function clearSandboxOrders() {
  await dbConnect();
  const result = await SandboxOrder.deleteMany({});
  return { deletedCount: result.deletedCount || 0 };
}

export async function listSandboxOrders(limit = 50) {
  await dbConnect();
  return SandboxOrder.find().sort({ createdAt: -1 }).limit(limit).lean();
}

export async function getSandboxOrderById(id: string) {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return SandboxOrder.findById(id).lean();
}

export async function countSandboxOrders() {
  await dbConnect();
  return SandboxOrder.countDocuments();
}
