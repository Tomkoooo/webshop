import ShippingMethod from "@wse/core/models/ShippingMethod";

export const FOXPOST_DEFAULT_SHIPPING_METHOD_NAME = "Foxpost Csomagautomata";

export function getFoxpostShippingMethodName(): string {
  return (process.env.FOXPOST_SHIPPING_METHOD_NAME || FOXPOST_DEFAULT_SHIPPING_METHOD_NAME).trim();
}

export async function resolveConfiguredFoxpostShippingMethod(options?: { requireActive?: boolean }) {
  const name = getFoxpostShippingMethodName();
  const query: Record<string, unknown> = {
    $or: [{ provider: "foxpost" }, { name }],
  };
  if (options?.requireActive !== false) {
    query.isActive = true;
  }

  let method = await ShippingMethod.findOne({
    ...(options?.requireActive !== false ? { isActive: true } : {}),
    provider: "foxpost",
  }).lean();
  if (!method?._id) {
    method = await ShippingMethod.findOne(query).lean();
  }
  if (!method?._id) {
    return null;
  }

  return {
    id: method._id.toString(),
    name: method.name,
    grossPrice: Number(method.grossPrice || 0),
    isActive: Boolean(method.isActive),
    descriptionHtml: String(method.descriptionHtml || "").trim() || undefined,
  };
}
