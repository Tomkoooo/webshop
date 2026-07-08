/**
 * Server-side reservation TTL clamping (never trust client).
 * Stripe Checkout `expires_at` must be at least ~30 minutes in the future when set;
 * we align defaults so DB reservation and Stripe session stay in sync.
 */

import { ShopTradingSettingsService } from "@wse/core/services/shop-trading-settings";

const THIRTY_MIN_MS = 30 * 60 * 1000;
const DEFAULT_MIN_MS = THIRTY_MIN_MS;
const DEFAULT_MAX_MS = 60 * 60 * 1000;
let settingsMaxCache: { value: number | null; expiresAt: number } | null = null;

export function parseEnvMs(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Effective hold duration in ms after clamping. */
export function clampReservationTtlMs(requestedTtlMs?: number | null): number {
  const minMs = parseEnvMs("RESERVATION_TTL_MIN_MS", DEFAULT_MIN_MS);
  const maxMinutes = Number(process.env.RESERVATION_TTL_MAX_MINUTES);
  const maxFallback = Number.isFinite(maxMinutes) && maxMinutes > 0
    ? maxMinutes * 60 * 1000
    : parseEnvMs("RESERVATION_TTL_MAX_MS", DEFAULT_MAX_MS);
  const maxMs = Math.max(minMs, maxFallback);
  const requested = requestedTtlMs != null && requestedTtlMs > 0 ? requestedTtlMs : minMs;
  return Math.min(Math.max(requested, minMs), maxMs);
}

export async function resolveReservationTtlMs(requestedTtlMs?: number | null): Promise<number> {
  const minMs = parseEnvMs("RESERVATION_TTL_MIN_MS", DEFAULT_MIN_MS);
  let maxMs = clampReservationTtlMs(requestedTtlMs ?? undefined);
  try {
    const now = Date.now();
    if (!settingsMaxCache || settingsMaxCache.expiresAt < now) {
      const settings = await ShopTradingSettingsService.get();
      settingsMaxCache = {
        value: settings.maxReservationMinutes,
        expiresAt: now + 10_000,
      };
    }
    if (settingsMaxCache.value != null) {
      maxMs = Math.max(minMs, settingsMaxCache.value * 60 * 1000);
    }
  } catch {
    // If settings storage is unavailable, keep env/default clamping.
  }
  const requested = requestedTtlMs != null && requestedTtlMs > 0 ? requestedTtlMs : minMs;
  return Math.min(Math.max(requested, minMs), maxMs);
}

/** Seconds to subtract from DB reservation end so Stripe session expires first (safety). */
export function stripeSessionBufferSec(): number {
  const n = Number(process.env.RESERVATION_STRIPE_SESSION_BUFFER_SEC);
  return Number.isFinite(n) && n >= 0 && n < 3600 ? Math.floor(n) : 60;
}

export function reservationEndsAt(now: Date, ttlMs: number): Date {
  return new Date(now.getTime() + ttlMs);
}

/** Unix seconds for Stripe Checkout `expires_at` (Stripe requires >= 30 min when set). */
export function stripeCheckoutExpiresAtUnix(now: Date, reservationEndsAt: Date): number {
  const bufferMs = stripeSessionBufferSec() * 1000;
  const candidate = Math.floor((reservationEndsAt.getTime() - bufferMs) / 1000);
  const minStripe = Math.floor((now.getTime() + THIRTY_MIN_MS) / 1000);
  return Math.max(candidate, minStripe);
}
