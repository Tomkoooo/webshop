import type { FoxpostApmSelection, FoxpostParcelPoint } from "@wse/core/lib/foxpost";
import {
  FOXPOST_SANDBOX_APM_JSON_URL,
  findFoxpostApmById,
  isSandboxApmOperatorId,
  listFoxpostApms,
  mapSandboxApmEntry,
  clearFoxpostApmCatalogMemoryCache,
} from "@wse/core/lib/foxpost-apm-catalog";

export {
  FOXPOST_SANDBOX_APM_JSON_URL,
  isSandboxApmOperatorId,
  mapSandboxApmEntry,
};

export const FOXPOST_SANDBOX_DEFAULT_APM_ID = "hu350";

export async function listSandboxApms(options?: { forceRefresh?: boolean }): Promise<FoxpostParcelPoint[]> {
  const snapshot = await listFoxpostApms({ mode: "sandbox", forceRefresh: options?.forceRefresh });
  return snapshot.apms;
}

export async function getDefaultSandboxApm(): Promise<FoxpostParcelPoint> {
  const apms = await listSandboxApms();
  const preferred = apms.find((apm) => apm.id.toLowerCase() === FOXPOST_SANDBOX_DEFAULT_APM_ID);
  if (preferred) return preferred;
  if (apms[0]) return apms[0];
  throw new Error("Nincs elérhető sandbox automata (hu1000 alatti operator_id).");
}

export async function resolveSandboxApm(apmId?: string): Promise<FoxpostParcelPoint> {
  if (!apmId?.trim()) {
    return getDefaultSandboxApm();
  }

  const match = await findFoxpostApmById(apmId, { mode: "sandbox" });
  if (!match) {
    throw new Error(`Érvénytelen sandbox automata: ${apmId}. Használj hu1000 alatti operator_id-t (pl. hu350).`);
  }
  return match;
}

/** @deprecated Use clearFoxpostApmCatalogMemoryCache("sandbox") */
export function clearSandboxApmCache(): void {
  clearFoxpostApmCatalogMemoryCache("sandbox");
}

export type { FoxpostApmSelection };
