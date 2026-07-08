export function formatOrderNumber(orderId: unknown): string {
  const raw = typeof orderId === "string" ? orderId : String(orderId || "");
  if (!raw) return "-";
  return raw.slice(-6).toUpperCase();
}

export function formatOrderNumberLabel(orderId: unknown): string {
  const code = formatOrderNumber(orderId);
  return code === "-" ? code : `#${code}`;
}
