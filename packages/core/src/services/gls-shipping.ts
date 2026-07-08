import ShippingMethod from "@wse/core/models/ShippingMethod";
export const GLS_DEFAULT_SHIPPING_METHOD_NAME = "GLS Csomagpont";

export function getGlsShippingMethodName(): string {
  return (process.env.GLS_SHIPPING_METHOD_NAME || GLS_DEFAULT_SHIPPING_METHOD_NAME).trim();
}

export async function resolveConfiguredGlsShippingMethod(options?: { requireActive?: boolean }) {
  const name = getGlsShippingMethodName();
  const query: Record<string, unknown> = {
    $or: [{ provider: "gls" }, { name }],
  };
  if (options?.requireActive !== false) {
    query.isActive = true;
  }

  let method = await ShippingMethod.findOne({
    ...(options?.requireActive !== false ? { isActive: true } : {}),
    provider: "gls",
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
