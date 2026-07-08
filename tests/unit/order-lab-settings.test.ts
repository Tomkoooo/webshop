import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@wse/core/lib/db", () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

describe("OrderLabSettingsService", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("saves and loads foxpost sandbox connection from admin settings", async () => {
    let stored: Record<string, unknown> = {
      singletonKey: "default",
      foxpostApiBaseUrl: "https://webapi-test.foxpost.hu/api",
      foxpostIsWeb: false,
    };

    vi.doMock("@wse/plugin-order-lab/models/OrderLabSettings", () => ({
      default: {
        findOne: vi.fn(async () => ({
          ...stored,
          save: vi.fn(async function save(this: Record<string, unknown>) {
            stored = { ...this };
          }),
        })),
        create: vi.fn(async (doc: Record<string, unknown>) => {
          stored = { ...doc };
          return { ...stored, save: vi.fn() };
        }),
      },
    }));

    const { OrderLabSettingsService } = await import(
      "@wse/plugin-order-lab/services/order-lab-settings-service"
    );

    const saved = await OrderLabSettingsService.saveFoxpostConnection({
      apiBaseUrl: "https://webapi-test.foxpost.hu/api",
      username: "sandbox-user",
      password: "secret-pass",
      apiKey: "secret-key",
      isWeb: false,
    });

    expect(saved.isConfigured).toBe(true);
    expect(saved.username).toBe("sandbox-user");

    const config = await OrderLabSettingsService.getFoxpostConfig();
    expect(config.apiBaseUrl).toBe("https://webapi-test.foxpost.hu/api");
    expect(config.username).toBe("sandbox-user");
    expect(config.password).toBe("secret-pass");
    expect(config.apiKey).toBe("secret-key");
    expect(config.isSandbox).toBe(true);
  });

  it("throws when sandbox connection is incomplete", async () => {
    vi.doMock("@wse/plugin-order-lab/models/OrderLabSettings", () => ({
      default: {
        findOne: vi.fn(async () => ({
          singletonKey: "default",
          foxpostApiBaseUrl: "https://webapi-test.foxpost.hu/api",
          save: vi.fn(),
        })),
        create: vi.fn(),
      },
    }));

    const { OrderLabSettingsService } = await import(
      "@wse/plugin-order-lab/services/order-lab-settings-service"
    );

    await expect(OrderLabSettingsService.getFoxpostConfig()).rejects.toThrow(/nincs beállítva/i);
  });
});
