/** Landscape threshold: wider images use 16:9 frame hints in grids. */
const LANDSCAPE_RATIO = 1.12;

export type MediaFrameVariant = "square" | "landscape";

export function mediaAspectVariant(width: number, height: number): MediaFrameVariant {
  if (!width || !height) return "square";
  return width / height >= LANDSCAPE_RATIO ? "landscape" : "square";
}

export function mediaFrameClassName(variant: MediaFrameVariant): string {
  return variant === "landscape" ? "aspect-video" : "aspect-square";
}

export function mediaAspectVariantFromRatio(ratio: number): MediaFrameVariant {
  if (!Number.isFinite(ratio) || ratio <= 0) return "square";
  return ratio >= LANDSCAPE_RATIO ? "landscape" : "square";
}
