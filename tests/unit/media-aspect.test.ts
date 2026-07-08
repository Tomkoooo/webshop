import { describe, expect, it } from "vitest";
import {
  mediaAspectVariant,
  mediaFrameClassName,
  mediaAspectVariantFromRatio,
} from "@wse/core/lib/media-aspect";

describe("media-aspect", () => {
  it("classifies landscape vs square", () => {
    expect(mediaAspectVariant(1920, 1080)).toBe("landscape");
    expect(mediaAspectVariant(800, 800)).toBe("square");
    expect(mediaFrameClassName("landscape")).toBe("aspect-video");
    expect(mediaFrameClassName("square")).toBe("aspect-square");
  });

  it("supports ratio helper", () => {
    expect(mediaAspectVariantFromRatio(16 / 9)).toBe("landscape");
    expect(mediaAspectVariantFromRatio(1)).toBe("square");
  });
});
