export const FOXPOST_FIXED_SHIPPING_METHOD_ID = "foxpost_fixed";
export const FOXPOST_APT_FINDER_ORIGIN = "https://cdn.foxpost.hu";
/** @deprecated Prefer buildFoxpostAptFinderUrl() so each embed can bust browser/CDN cache. */
export const FOXPOST_APT_FINDER_URL = `${FOXPOST_APT_FINDER_ORIGIN}/apt-finder/v1/app/?lang=hu`;

export type FoxpostAptFinderUrlOptions = {
  lang?: string;
  theme?: "dark" | "default";
  /** Unique per dialog open — forces a fresh iframe navigation. */
  reloadToken?: string | number;
};

/** Foxpost-hosted APT finder iframe URL (see cdn.foxpost.hu/apt-finder/v1/documentation/). */
export function buildFoxpostAptFinderUrl(options?: FoxpostAptFinderUrlOptions): string {
  const params = new URLSearchParams({
    lang: options?.lang ?? "hu",
    noHeader: "1",
    noSearchTitle: "1",
  });
  if (options?.theme) {
    params.set("theme", options.theme);
  }
  if (options?.reloadToken != null && String(options.reloadToken).trim()) {
    params.set("_reload", String(options.reloadToken));
  }
  return `${FOXPOST_APT_FINDER_ORIGIN}/apt-finder/v1/app/?${params.toString()}`;
}

/** Raw APT selection payload from Foxpost iframe postMessage. */
export type FoxpostApmSelection = {
  place_id?: number | string;
  operator_id?: string;
  name?: string;
  address?: string;
  zip?: string;
  city?: string;
  street?: string;
  findme?: string;
  geolat?: number;
  geolng?: number;
  country?: string;
  load?: string;
  service?: string;
  serviceString?: string;
};

export type FoxpostParcelPoint = {
  id: string;
  name: string;
  address?: string;
  zip?: string;
  city?: string;
  findme?: string;
  load?: string;
  countryCode?: string;
};

export type FoxpostShipment = {
  clFoxId?: string;
  refCode?: string;
  labelUrl?: string;
  labelDataBase64?: string;
  labelPageSize?: string;
  trackingStatus?: string;
  generatedAt?: Date | string;
  generatedBy?: string;
  lastError?: string;
  returnBarcode?: string;
};

export type FoxpostTrack = {
  trackId?: number;
  status?: string;
  statusDate?: string;
};

export type FoxpostTrackingDetail = {
  clFox?: string;
  parcelType?: string;
  sendType?: string;
  relatedParcel?: string;
  estimatedDelivery?: string;
  traces?: Array<{
    statusDate?: string;
    status?: string;
    shortName?: string;
    longName?: string;
  }>;
};

export type FoxpostLabelInfo = {
  senderName?: string;
  senderZip?: string;
  senderCity?: string;
  senderAddress?: string;
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientZip?: string;
  recipientCity?: string;
  recipientAddress?: string;
  apm?: string;
  cod?: number;
  isFragile?: boolean;
  barcode?: string;
  refCode?: string;
  depoCode?: string;
  courierCode?: string;
  sendType?: string;
};

export type FoxpostConnectionStatus = {
  apiBaseUrl: string;
  isSandbox: boolean;
  isWeb: boolean;
  username: string;
  usernameMasked: string;
  hasPassword: boolean;
  hasApiKey: boolean;
  parcelSize: string;
  labelPageSize: string;
};

export type FoxpostUpdateParcelPatch = {
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  size?: string;
  comment?: string;
  cod?: number;
};

export type FoxpostReturnAddress = {
  name?: string;
  zip?: string;
  city?: string;
  address?: string;
  country?: string;
  type?: string;
};
