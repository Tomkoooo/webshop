import { describe, expect, it, vi, beforeEach } from "vitest";
import { FoxpostApiClient } from "@wse/core/services/foxpost";

describe("FoxpostApiClient", () => {
  beforeEach(() => {
    vi.stubEnv("FOXPOST_API_USERNAME", "user");
    vi.stubEnv("FOXPOST_API_PASSWORD", "pass");
    vi.stubEnv("FOXPOST_API_KEY", "key");
    vi.stubEnv("FOXPOST_API_BASE_URL", "https://webapi-test.foxpost.hu/api");
  });

  it("calls tracking history endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ trackId: 1, status: "CREATE", statusDate: "2024-01-01T00:00:00Z" }],
    });
    vi.stubGlobal("fetch", fetchMock);

    const tracks = await FoxpostApiClient.getTrackingHistory("CLFOX123");
    expect(tracks[0]?.status).toBe("CREATE");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://webapi-test.foxpost.hu/api/tracking/tracks/CLFOX123",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("calls delete parcel endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal("fetch", fetchMock);

    await FoxpostApiClient.deleteParcel("CLFOX123");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://webapi-test.foxpost.hu/api/parcel/CLFOX123?isWeb=false",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("calls label info endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ barcode: "CLFOX123", recipientName: "Teszt" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const info = await FoxpostApiClient.getLabelInfo("CLFOX123");
    expect(info.recipientName).toBe("Teszt");
  });

  it("calls update parcel endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ clFoxId: "CLFOX123", valid: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await FoxpostApiClient.updateParcel("CLFOX123", { recipientName: "Új Név" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://webapi-test.foxpost.hu/api/parcel?isWeb=false",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify([{ barcode: "CLFOX123", recipientName: "Új Név" }]),
      })
    );
  });
});
