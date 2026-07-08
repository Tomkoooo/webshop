import "server-only";

import { getPublicAppBaseUrl, isLocalhostBaseUrl } from "@wse/core/lib/app-base-url";
import { SeoSettingsService } from "@wse/core/services/seo-settings";

/** Prefer SEO canonical URL from DB, then env (emails, guest order links). Server-only. */
export async function resolvePublicAppBaseUrl(): Promise<string> {
  try {
    const seo = await SeoSettingsService.get();
    const fromSeo = seo.canonicalBaseUrl?.trim();
    if (fromSeo) {
      const base = fromSeo.replace(/\/+$/, "");
      if (!(process.env.NODE_ENV === "production" && isLocalhostBaseUrl(base))) {
        return base;
      }
    }
  } catch {
    // fall through to env
  }
  return getPublicAppBaseUrl();
}
