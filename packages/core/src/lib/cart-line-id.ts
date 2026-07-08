/** Client cart line id: `productId` or `productId:variantId`. */
export function parseCartLineIdentity(item: {
  id?: string;
  productId?: string;
  variantId?: string;
}): { productId: string; variantId?: string; lineId: string } {
  const productId = String(item.productId || "").trim();
  const explicitVariant = String(item.variantId || "").trim();
  const rawId = String(item.id || "").trim();

  if (productId && explicitVariant) {
    return { productId, variantId: explicitVariant, lineId: `${productId}:${explicitVariant}` };
  }

  if (rawId.includes(":")) {
    const [pid, vid] = rawId.split(":", 2);
    if (pid && vid) {
      return { productId: pid, variantId: vid, lineId: rawId };
    }
  }

  const resolvedProductId = productId || rawId;
  return { productId: resolvedProductId, variantId: undefined, lineId: rawId || resolvedProductId };
}

export function cartLineSyncKey(item: { productId: string; variantId?: string }): string {
  return item.variantId ? `${item.productId}:${item.variantId}` : item.productId;
}
