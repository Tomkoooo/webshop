import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  isSandboxApmOperatorId,
  mapSandboxApmEntry,
  FOXPOST_SANDBOX_DEFAULT_APM_ID,
  clearSandboxApmCache,
} from "@wse/core/lib/foxpost-sandbox-apms";
import { clearFoxpostApmCatalogMemoryCache } from "@wse/core/lib/foxpost-apm-catalog";

describe("foxpost-sandbox-apms", () => {
  beforeEach(() => {
    clearSandboxApmCache();
    clearFoxpostApmCatalogMemoryCache("sandbox");
  });

  it("accepts hu350 and rejects hu5264", () => {
    expect(isSandboxApmOperatorId("hu350")).toBe(true);
    expect(isSandboxApmOperatorId("hu999")).toBe(true);
    expect(isSandboxApmOperatorId("hu1000")).toBe(false);
    expect(isSandboxApmOperatorId("hu5264")).toBe(false);
    expect(isSandboxApmOperatorId("nikitest-3")).toBe(false);
  });

  it("maps sandbox APM entry to parcel point", () => {
    const mapped = mapSandboxApmEntry({
      operator_id: "hu350",
      name: "FOXPOST A-BOX Veszprém",
      address: "8200 Veszprém, Mártírok útja 13.",
      zip: "8200",
      city: "Veszprém",
      findme: "HU350 ...",
      load: "normal loaded",
    });
    expect(mapped).toEqual({
      id: "hu350",
      name: "FOXPOST A-BOX Veszprém",
      address: "8200 Veszprém, Mártírok útja 13.",
      zip: "8200",
      city: "Veszprém",
      findme: "HU350 ...",
      load: "normal loaded",
      countryCode: "HU",
    });
  });

  it("filters invalid operator ids when mapping", () => {
    expect(mapSandboxApmEntry({ operator_id: "hu5264", name: "X" })).toBeNull();
  });

  it("lists sandbox apms from CDN with hu<1000 filter", async () => {
    const sample = [
      { operator_id: "hu350", name: "A", address: "x", zip: "1", city: "B" },
      { operator_id: "hu5264", name: "B", address: "y", zip: "2", city: "C" },
      { operator_id: "hu404", name: "C", address: "z", zip: "3", city: "D" },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => sample,
      })
    );

    const { listSandboxApms, getDefaultSandboxApm } = await import("@wse/core/lib/foxpost-sandbox-apms");
    const apms = await listSandboxApms({ forceRefresh: true });
    expect(apms.map((a) => a.id)).toEqual(["hu350", "hu404"]);

    const defaultApm = await getDefaultSandboxApm();
    expect(defaultApm.id).toBe(FOXPOST_SANDBOX_DEFAULT_APM_ID);
  });
});
