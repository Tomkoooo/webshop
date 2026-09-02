/**
 * Site identity for Event Structure v2 (`es2`). This file — not a DEPLOYMENT_KEY — declares
 * which template and plugins this deployment ships. `wse sync` reads
 * wse.config.json (kept in step with the plugins listed here) to generate
 * route stubs.
 */
export const siteConfig = {
  id: "es2",
  templateId: "eventstructure-v2",
  plugins: [] as const,
}
