/** Client-safe parcel helpers only — feature flags live in `@/lib/parcel-feature-flags` (server). */

export type ParcelLockerProvider = "gls" | "foxpost";

export type ParcelLockerDisplayPoint = {
  id: string;
  name: string;
  address?: string;
  city?: string;
  zip?: string;
  findme?: string;
  provider: ParcelLockerProvider;
};

const HU_MOBILE_REGEX = /^(\+36|36)(20|30|31|70|50|51)\d{7}$/;

export function resolveApmDestinationId(input: {
  operator_id?: string | number | null;
  place_id?: string | number | null;
}): string {
  const operator = input.operator_id != null ? String(input.operator_id).trim() : "";
  if (operator) return operator;
  const place = input.place_id != null ? String(input.place_id).trim() : "";
  if (place) return place;
  return "";
}

export function normalizeHuMobilePhone(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  let normalized = digits;
  if (normalized.startsWith("06")) {
    normalized = `+36${normalized.slice(2)}`;
  } else if (normalized.startsWith("36") && !normalized.startsWith("+")) {
    normalized = `+${normalized}`;
  } else if (!normalized.startsWith("+") && normalized.length === 9) {
    normalized = `+36${normalized}`;
  }

  if (!HU_MOBILE_REGEX.test(normalized)) {
    throw new Error(
      "A Foxpost csomaghoz érvényes magyar mobiltelefonszám szükséges (+36 20/30/31/70/50/51 …)."
    );
  }
  return normalized;
}

export function getOrderParcelProvider(order: {
  glsParcelPoint?: { id?: string } | null;
  foxpostParcelPoint?: { id?: string } | null;
}): ParcelLockerProvider | null {
  if (order.glsParcelPoint?.id) return "gls";
  if (order.foxpostParcelPoint?.id) return "foxpost";
  return null;
}

export function orderHasParcelShipping(order: {
  glsParcelPoint?: { id?: string } | null;
  foxpostParcelPoint?: { id?: string } | null;
}): boolean {
  return Boolean(order.glsParcelPoint?.id || order.foxpostParcelPoint?.id);
}

export type OrderShippingTypeFilter = "all" | "gls" | "foxpost" | "standard";

export function getOrderShippingTypeLabel(order: {
  glsParcelPoint?: { id?: string; name?: string } | null;
  foxpostParcelPoint?: { id?: string; name?: string } | null;
}): string {
  if (order.glsParcelPoint?.id) return "GLS csomagpont";
  if (order.foxpostParcelPoint?.id) return "Foxpost";
  return "Standard";
}

export function matchesOrderShippingTypeFilter(
  order: {
    glsParcelPoint?: { id?: string } | null;
    foxpostParcelPoint?: { id?: string } | null;
  },
  filter: OrderShippingTypeFilter
): boolean {
  if (filter === "all") return true;
  if (filter === "gls") return Boolean(order.glsParcelPoint?.id);
  if (filter === "foxpost") return Boolean(order.foxpostParcelPoint?.id);
  return !order.glsParcelPoint?.id && !order.foxpostParcelPoint?.id;
}

export function getOrderShippingLabelError(order: {
  glsParcelPoint?: { id?: string } | null;
  foxpostParcelPoint?: { id?: string } | null;
  glsLabel?: { lastError?: string } | null;
  foxpostShipment?: { lastError?: string } | null;
  standardShippingLabel?: { lastError?: string } | null;
}): string | undefined {
  const error =
    order.glsParcelPoint?.id
      ? order.glsLabel?.lastError
      : order.foxpostParcelPoint?.id
        ? order.foxpostShipment?.lastError
        : order.standardShippingLabel?.lastError;
  const trimmed = error?.trim();
  return trimmed || undefined;
}

export function orderHasStandardShippingLabel(order: {
  standardShippingLabel?: { status?: string; labelDataBase64?: string } | null;
}): boolean {
  return Boolean(
    order.standardShippingLabel?.status === "ready" && order.standardShippingLabel?.labelDataBase64
  );
}

export function orderIsGeneratingStandardShippingLabel(order: {
  standardShippingLabel?: { status?: string } | null;
}): boolean {
  return order.standardShippingLabel?.status === "generating";
}

export function orderNeedsStandardShippingLabel(order: {
  glsParcelPoint?: { id?: string } | null;
  foxpostParcelPoint?: { id?: string } | null;
  standardShippingLabel?: { status?: string; labelDataBase64?: string } | null;
}): boolean {
  if (order.glsParcelPoint?.id || order.foxpostParcelPoint?.id) return false;
  return !orderHasStandardShippingLabel(order);
}

export function orderNeedsParcelLabel(order: {
  glsParcelPoint?: { id?: string } | null;
  foxpostParcelPoint?: { id?: string } | null;
  glsLabel?: { parcelNumber?: string; labelDataBase64?: string } | null;
  foxpostShipment?: { clFoxId?: string; labelDataBase64?: string } | null;
}): boolean {
  if (order.glsParcelPoint?.id && !order.glsLabel?.parcelNumber && !order.glsLabel?.labelDataBase64) {
    return true;
  }
  if (
    order.foxpostParcelPoint?.id &&
    !order.foxpostShipment?.clFoxId &&
    !order.foxpostShipment?.labelDataBase64
  ) {
    return true;
  }
  return false;
}

export function orderNeedsAnyShippingLabel(order: {
  glsParcelPoint?: { id?: string } | null;
  foxpostParcelPoint?: { id?: string } | null;
  glsLabel?: { parcelNumber?: string; labelDataBase64?: string } | null;
  foxpostShipment?: { clFoxId?: string; labelDataBase64?: string } | null;
  standardShippingLabel?: { status?: string; labelDataBase64?: string } | null;
}): boolean {
  return orderNeedsParcelLabel(order) || orderNeedsStandardShippingLabel(order);
}

export function orderIsGeneratingShippingLabel(order: {
  standardShippingLabel?: { status?: string } | null;
}): boolean {
  return orderIsGeneratingStandardShippingLabel(order);
}

export function orderHasAnyShippingLabel(order: {
  glsParcelPoint?: { id?: string } | null;
  foxpostParcelPoint?: { id?: string } | null;
  glsLabel?: { parcelNumber?: string; labelDataBase64?: string } | null;
  foxpostShipment?: { clFoxId?: string; labelDataBase64?: string } | null;
  standardShippingLabel?: { status?: string; labelDataBase64?: string } | null;
}): boolean {
  if (order.glsLabel?.parcelNumber || order.glsLabel?.labelDataBase64) return true;
  if (order.foxpostShipment?.clFoxId || order.foxpostShipment?.labelDataBase64) return true;
  return orderHasStandardShippingLabel(order);
}
