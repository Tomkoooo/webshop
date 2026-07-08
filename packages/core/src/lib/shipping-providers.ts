import { GLS_FIXED_SHIPPING_METHOD_ID } from "@wse/core/lib/gls";
import { FOXPOST_FIXED_SHIPPING_METHOD_ID } from "@wse/core/lib/foxpost";

export type ShippingProviderKind = "standard" | "gls" | "foxpost";

export function isParcelLockerShippingId(id: string): boolean {
  return id === GLS_FIXED_SHIPPING_METHOD_ID || id === FOXPOST_FIXED_SHIPPING_METHOD_ID;
}

export type CheckoutShippingMethodRow = {
  _id: string;
  name: string;
  grossPrice: number;
  isActive: boolean;
  provider?: ShippingProviderKind;
  isFixed?: boolean;
  descriptionHtml?: string;
};

export function isParcelProvider(method: { provider?: string; isFixed?: boolean }): boolean {
  return method.provider === "gls" || method.provider === "foxpost";
}

export function isGlsParcelShippingMethod(
  methodId: string,
  method?: { provider?: string } | null
): boolean {
  return methodId === GLS_FIXED_SHIPPING_METHOD_ID || method?.provider === "gls";
}

export function isFoxpostParcelShippingMethod(
  methodId: string,
  method?: { provider?: string } | null
): boolean {
  return methodId === FOXPOST_FIXED_SHIPPING_METHOD_ID || method?.provider === "foxpost";
}

export function isParcelShippingMethod(
  methodId: string,
  method?: { provider?: string } | null
): boolean {
  return isGlsParcelShippingMethod(methodId, method) || isFoxpostParcelShippingMethod(methodId, method);
}

/** True when every offered shipping option is GLS/Foxpost locker (no home delivery). */
export function offersOnlyParcelLockerShipping(
  methods: CheckoutShippingMethodRow[] | undefined
): boolean {
  if (!methods?.length) return false;
  return methods.every((m) => isParcelProvider(m) || isParcelLockerShippingId(m._id));
}
