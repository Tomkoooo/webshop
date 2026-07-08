import { describe, expect, it } from "vitest";
import { buildFoxpostAptFinderUrl } from "@wse/core/lib/foxpost";

describe("buildFoxpostAptFinderUrl", () => {
  it("includes cache-bust reload token when provided", () => {
    const url = buildFoxpostAptFinderUrl({ reloadToken: 1719234567890 });
    expect(url).toContain("_reload=1719234567890");
    expect(url).toContain("lang=hu");
    expect(url).toContain("noHeader=1");
    expect(url).toContain("noSearchTitle=1");
  });

  it("applies theme when provided", () => {
    const url = buildFoxpostAptFinderUrl({ theme: "dark", reloadToken: "abc" });
    expect(url).toContain("theme=dark");
    expect(url).toContain("_reload=abc");
  });

  it("omits reload param when token is empty", () => {
    const url = buildFoxpostAptFinderUrl({ reloadToken: "   " });
    expect(url).not.toContain("_reload=");
  });
});
