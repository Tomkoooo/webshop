function normalizeBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

function isLocalhostHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

export function isLocalhostBaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url.includes("://") ? url : `https://${url}`);
    return isLocalhostHost(parsed.hostname);
  } catch {
    return /localhost|127\.0\.0\.1/i.test(url);
  }
}

/** Env-based public origin (sync). Skips localhost candidates when NODE_ENV is production. */
export function getPublicAppBaseUrl(): string {
  const candidates: string[] = [];

  for (const key of ["NEXT_PUBLIC_APP_URL", "NEXTAUTH_URL", "AUTH_URL"] as const) {
    const value = process.env[key]?.trim();
    if (value) candidates.push(value);
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    candidates.push(`https://${host}`);
  }

  const production = process.env.NODE_ENV === "production";

  for (const raw of candidates) {
    const base = normalizeBaseUrl(raw);
    if (production && isLocalhostBaseUrl(base)) continue;
    return base;
  }

  if (production) {
    throw new Error(
      "Missing public app URL for production. Set NEXT_PUBLIC_APP_URL (and NEXTAUTH_URL) to your HTTPS shop domain."
    );
  }

  return "http://localhost:3000";
}
