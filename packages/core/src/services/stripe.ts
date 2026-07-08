import Stripe from "stripe";

/** Must match Stripe Dashboard webhook endpoint API version. */
export const STRIPE_API_VERSION = "2026-04-22.dahlia";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (stripeClient) return stripeClient;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
  stripeClient = new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION });
  return stripeClient;
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET");
  }
  return secret;
}

export { getPublicAppBaseUrl as getAppBaseUrl } from "@wse/core/lib/app-base-url";
