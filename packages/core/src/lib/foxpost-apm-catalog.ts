import { unstable_cache } from "next/cache";
import type { FoxpostApmSelection, FoxpostParcelPoint } from "@wse/core/lib/foxpost";
import { resolveApmDestinationId } from "@wse/core/lib/parcel-locker";

export const FOXPOST_APM_JSON_URL = "https://cdn.foxpost.hu/foxplus.json";
export const FOXPOST_SANDBOX_APM_JSON_URL = "https://cdn.foxpost.hu/sandbox_foxplus.json";
/** Minimum refresh interval — list is re-fetched from CDN at most once per day. */
export const FOXPOST_APM_CACHE_REVALIDATE_SEC = 24 * 60 * 60;

export type FoxpostApmCatalogMode = "production" | "sandbox";

export type FoxpostApmCatalogSnapshot = {
  mode: FoxpostApmCatalogMode;
  fetchedAt: string;
  apms: FoxpostParcelPoint[];
};

type FoxpostApmJsonEntry = FoxpostApmSelection & {
  closeDate?: string;
  service?: string[];
};

type MemoryCacheEntry = {
  fetchedAt: number;
  apms: FoxpostParcelPoint[];
};

const memoryCache = new Map<FoxpostApmCatalogMode, MemoryCacheEntry>();

export function isSandboxApmOperatorId(operatorId: string): boolean {
  const match = operatorId.match(/^hu(\d+)$/i);
  if (!match) return false;
  return Number.parseInt(match[1], 10) < 1000;
}

function isApmClosed(entry: FoxpostApmJsonEntry): boolean {
  return Boolean(entry.closeDate?.trim());
}

function isParcelPickupApm(entry: FoxpostApmJsonEntry): boolean {
  const services = entry.service;
  if (!Array.isArray(services) || services.length === 0) return true;
  return services.some((service) => service === "pick up" || service === "dispatch");
}

export function mapProductionApmEntry(entry: FoxpostApmJsonEntry): FoxpostParcelPoint | null {
  const id = resolveApmDestinationId({
    operator_id: entry.operator_id,
    place_id: entry.place_id,
  });
  const name = entry.name?.trim();
  if (!id || !name) return null;
  if (isApmClosed(entry)) return null;
  if (!isParcelPickupApm(entry)) return null;

  const countryRaw = entry.country?.trim();
  const countryCode = countryRaw
    ? countryRaw.length === 2
      ? countryRaw.toUpperCase()
      : countryRaw.toLowerCase() === "hu"
        ? "HU"
        : undefined
    : "HU";

  return {
    id,
    name,
    address: entry.address?.trim() || entry.street?.trim() || undefined,
    zip: entry.zip?.trim() || undefined,
    city: entry.city?.trim() || undefined,
    findme: entry.findme?.trim() || undefined,
    load: entry.load?.trim() || undefined,
    countryCode,
  };
}

export function mapSandboxApmEntry(entry: FoxpostApmJsonEntry): FoxpostParcelPoint | null {
  const id = entry.operator_id?.trim();
  if (!id || !isSandboxApmOperatorId(id)) return null;

  return {
    id,
    name: entry.name?.trim() || id,
    address: entry.address?.trim() || entry.street?.trim(),
    zip: entry.zip?.trim(),
    city: entry.city?.trim(),
    findme: entry.findme?.trim(),
    load: entry.load?.trim(),
    countryCode: entry.country?.trim()?.toUpperCase() || "HU",
  };
}

function mapApmEntry(entry: FoxpostApmJsonEntry, mode: FoxpostApmCatalogMode): FoxpostParcelPoint | null {
  return mode === "sandbox" ? mapSandboxApmEntry(entry) : mapProductionApmEntry(entry);
}

function catalogUrlForMode(mode: FoxpostApmCatalogMode): string {
  return mode === "sandbox" ? FOXPOST_SANDBOX_APM_JSON_URL : FOXPOST_APM_JSON_URL;
}

async function fetchApmEntriesFromCdn(mode: FoxpostApmCatalogMode): Promise<FoxpostApmJsonEntry[]> {
  const response = await fetch(catalogUrlForMode(mode), {
    next: { revalidate: FOXPOST_APM_CACHE_REVALIDATE_SEC },
  });
  if (!response.ok) {
    throw new Error(`Foxpost automata lista betöltése sikertelen (${response.status}).`);
  }
  const data = await response.json();
  return Array.isArray(data) ? (data as FoxpostApmJsonEntry[]) : [];
}

function sortApms(apms: FoxpostParcelPoint[]): FoxpostParcelPoint[] {
  return [...apms].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
}

async function loadApmsFromCdn(mode: FoxpostApmCatalogMode): Promise<FoxpostParcelPoint[]> {
  const entries = await fetchApmEntriesFromCdn(mode);
  const apms = entries
    .map((entry) => mapApmEntry(entry, mode))
    .filter((apm): apm is FoxpostParcelPoint => apm !== null);
  return sortApms(apms);
}

type ApmLoader = () => Promise<FoxpostParcelPoint[]>;

let productionApmLoader: ApmLoader | null = null;
let sandboxApmLoader: ApmLoader | null = null;

function createApmLoader(mode: FoxpostApmCatalogMode): ApmLoader {
  const load = () => loadApmsFromCdn(mode);
  if (process.env.VITEST === "true") {
    return load;
  }
  const cacheKey =
    mode === "sandbox" ? "foxpost-apm-catalog-sandbox" : "foxpost-apm-catalog-production";
  return unstable_cache(load, [cacheKey], { revalidate: FOXPOST_APM_CACHE_REVALIDATE_SEC });
}

function getProductionApmLoader(): ApmLoader {
  productionApmLoader ??= createApmLoader("production");
  return productionApmLoader;
}

function getSandboxApmLoader(): ApmLoader {
  sandboxApmLoader ??= createApmLoader("sandbox");
  return sandboxApmLoader;
}

export function clearFoxpostApmCatalogMemoryCache(mode?: FoxpostApmCatalogMode): void {
  if (mode) {
    memoryCache.delete(mode);
    return;
  }
  memoryCache.clear();
}

export async function listFoxpostApms(options?: {
  mode?: FoxpostApmCatalogMode;
  forceRefresh?: boolean;
}): Promise<FoxpostApmCatalogSnapshot> {
  const mode = options?.mode ?? "production";
  const now = Date.now();

  if (!options?.forceRefresh) {
    const cached = memoryCache.get(mode);
    if (cached && now - cached.fetchedAt < FOXPOST_APM_CACHE_REVALIDATE_SEC * 1000) {
      return {
        mode,
        fetchedAt: new Date(cached.fetchedAt).toISOString(),
        apms: cached.apms,
      };
    }
  }

  const apms = options?.forceRefresh
    ? await loadApmsFromCdn(mode)
    : mode === "sandbox"
      ? await getSandboxApmLoader()()
      : await getProductionApmLoader()();

  memoryCache.set(mode, { fetchedAt: now, apms });
  return {
    mode,
    fetchedAt: new Date(now).toISOString(),
    apms,
  };
}

export async function findFoxpostApmById(
  apmId: string,
  options?: { mode?: FoxpostApmCatalogMode; forceRefresh?: boolean }
): Promise<FoxpostParcelPoint | null> {
  const normalized = apmId.trim().toLowerCase();
  if (!normalized) return null;
  const snapshot = await listFoxpostApms(options);
  return snapshot.apms.find((apm) => apm.id.toLowerCase() === normalized) ?? null;
}

export async function resolveFoxpostApmCatalogMode(): Promise<FoxpostApmCatalogMode> {
  try {
    const { getFoxpostConfig } = await import("@wse/core/services/foxpost");
    return getFoxpostConfig().isSandbox ? "sandbox" : "production";
  } catch {
    return "production";
  }
}

export async function resolveFoxpostParcelPointForCheckout(
  point: FoxpostParcelPoint,
  options?: { forceRefresh?: boolean }
): Promise<FoxpostParcelPoint> {
  const id = point.id?.trim();
  if (!id) {
    throw new Error("A Foxpost csomagautomata kiválasztása kötelező.");
  }

  const mode = await resolveFoxpostApmCatalogMode();
  const canonical = await findFoxpostApmById(id, {
    mode,
    forceRefresh: options?.forceRefresh ?? true,
  });
  if (!canonical) {
    throw new Error(
      "A kiválasztott Foxpost automata már nem elérhető. Kérjük, válassz másik pontot a térképen."
    );
  }
  return canonical;
}
