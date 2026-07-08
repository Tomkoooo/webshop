import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { getPublicAppBaseUrl, isLocalhostBaseUrl } from "@wse/core/lib/app-base-url";

describe("app-base-url", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  it("detects localhost URLs", () => {
    expect(isLocalhostBaseUrl("http://localhost:3000")).toBe(true);
    expect(isLocalhostBaseUrl("https://shop.example.com")).toBe(false);
  });

  it("skips localhost env in production", () => {
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    process.env.NEXTAUTH_URL = "https://shop.example.com";
    expect(getPublicAppBaseUrl()).toBe("https://shop.example.com");
  });

  it("falls back to localhost only in non-production", () => {
    process.env.NODE_ENV = "development";
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXTAUTH_URL;
    expect(getPublicAppBaseUrl()).toBe("http://localhost:3000");
  });
});
