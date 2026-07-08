import { FeatureFlagService } from "@wse/core/services/feature-flags";

export const GLS_PARCEL_PICKER_FLAG = "glsParcelPicker";
export const GLS_PARCEL_MANAGER_FLAG = "glsParcelManager";
export const FOXPOST_PARCEL_PICKER_FLAG = "foxpostParcelPicker";
export const FOXPOST_PARCEL_MANAGER_FLAG = "foxpostParcelManager";

/** @deprecated Use provider-specific flags; kept for imports that expected a single key. */
export const PARCEL_PICKER_FEATURE_FLAG = GLS_PARCEL_PICKER_FLAG;

export const SHOP_PARCEL_FEATURE_FLAG_KEYS = [
  GLS_PARCEL_PICKER_FLAG,
  GLS_PARCEL_MANAGER_FLAG,
  FOXPOST_PARCEL_PICKER_FLAG,
  FOXPOST_PARCEL_MANAGER_FLAG,
] as const;

export type ShopParcelFeatureFlagKey = (typeof SHOP_PARCEL_FEATURE_FLAG_KEYS)[number];

export async function isGlsParcelPickerEnabled(): Promise<boolean> {
  return FeatureFlagService.isEnabled(GLS_PARCEL_PICKER_FLAG, false);
}

export async function isGlsParcelManagerEnabled(): Promise<boolean> {
  return FeatureFlagService.isEnabled(GLS_PARCEL_MANAGER_FLAG, false);
}

export async function isFoxpostParcelPickerEnabled(): Promise<boolean> {
  return FeatureFlagService.isEnabled(FOXPOST_PARCEL_PICKER_FLAG, false);
}

export async function isFoxpostParcelManagerEnabled(): Promise<boolean> {
  return FeatureFlagService.isEnabled(FOXPOST_PARCEL_MANAGER_FLAG, false);
}
