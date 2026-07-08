import { getPublicAppBaseUrl } from "@wse/core/lib/app-base-url";

export const ORDER_GUEST_ACCESS_TTL_MS = 1000 * 60 * 60 * 24 * 90; // 90 days

export function normalizeOrderEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function buildGuestOrderViewUrl(orderId: string, rawToken: string, baseUrl?: string): string {
  const base = (baseUrl ?? getPublicAppBaseUrl()).replace(/\/+$/, "");
  const params = new URLSearchParams({ token: rawToken });
  return `${base}/orders/guest/${orderId}?${params.toString()}`;
}

export function resolveAppBaseUrl(): string {
  return getPublicAppBaseUrl();
}

export function guestOrderPath(orderId: string, rawToken: string): string {
  const params = new URLSearchParams({ token: rawToken });
  return `/orders/guest/${orderId}?${params.toString()}`;
}

export function buildAuthLoginUrl(callbackUrl: string, baseUrl?: string): string {
  const base = (baseUrl ?? resolveAppBaseUrl()).replace(/\/+$/, "");
  const params = new URLSearchParams({ callbackUrl });
  return `${base}/auth/login?${params.toString()}`;
}
