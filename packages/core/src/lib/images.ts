export const PLACEHOLDER_IMAGE = "/placeholder.png";

export function mediaImageSrc(filename: unknown): string {
  const value = typeof filename === "string" ? filename.trim() : "";
  if (!value) return PLACEHOLDER_IMAGE;
  if (value.startsWith("data:") || value.startsWith("/") || value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  return `/api/media/${value}`;
}
