import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  resolveApmDestinationId,
  normalizeHuMobilePhone,
  getOrderParcelProvider,
  getOrderShippingTypeLabel,
  orderNeedsParcelLabel,
  matchesOrderShippingTypeFilter,
} from "@wse/core/lib/parcel-locker";

describe("parcel-locker helpers", () => {
  it("resolves operator_id over place_id", () => {
    expect(resolveApmDestinationId({ operator_id: "hu5516", place_id: 1250198 })).toBe("hu5516");
  });

  it("falls back to place_id when operator_id empty", () => {
    expect(resolveApmDestinationId({ operator_id: "", place_id: 99 })).toBe("99");
  });

  it("normalizes Hungarian mobile numbers", () => {
    expect(normalizeHuMobilePhone("06201234567")).toBe("+36201234567");
    expect(normalizeHuMobilePhone("+36201234567")).toBe("+36201234567");
  });

  it("rejects invalid phone numbers", () => {
    expect(() => normalizeHuMobilePhone("06112223344")).toThrow();
  });

  it("detects parcel provider and label need", () => {
    expect(getOrderParcelProvider({ glsParcelPoint: { id: "g1" } })).toBe("gls");
    expect(getOrderParcelProvider({ foxpostParcelPoint: { id: "f1" } })).toBe("foxpost");
    expect(getOrderShippingTypeLabel({ foxpostParcelPoint: { id: "f1" } })).toBe("Foxpost");
    expect(
      orderNeedsParcelLabel({
        foxpostParcelPoint: { id: "f1" },
        foxpostShipment: {},
      })
    ).toBe(true);
    expect(matchesOrderShippingTypeFilter({ glsParcelPoint: { id: "g1" } }, "gls")).toBe(true);
    expect(matchesOrderShippingTypeFilter({ glsParcelPoint: { id: "g1" } }, "standard")).toBe(false);
  });
});

describe("FoxpostService", () => {
  beforeEach(() => {
    vi.stubEnv("FOXPOST_API_USERNAME", "user");
    vi.stubEnv("FOXPOST_API_PASSWORD", "pass");
    vi.stubEnv("FOXPOST_API_KEY", "key");
    vi.stubEnv("FOXPOST_API_BASE_URL", "https://webapi-test.foxpost.hu/api");
  });

  it("creates parcel and label for order", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ clFoxId: "CLFOX123", valid: true, refCode: "ref1" }],
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => new Uint8Array([37, 80, 68, 70]).buffer,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "CREATE" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const { FoxpostService } = await import("@wse/core/services/foxpost");
    const order = {
      _id: { toString: () => "507f1f77bcf86cd799439011" },
      foxpostParcelPoint: { id: "hu5516", name: "Automata" },
      shippingAddress: {
        name: "Teszt Elek",
        email: "test@example.com",
        phone: "+36201234567",
      },
    };

    const result = await FoxpostService.createShipmentForOrder(order as never);
    expect(result.clFoxId).toBe("CLFOX123");
    expect(result.labelDataBase64).toBeTruthy();
    expect(fetchMock).toHaveBeenCalled();
  });
});
