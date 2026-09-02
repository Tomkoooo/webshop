/**
 * Site identity for Event Structure (`es`). This file — not a DEPLOYMENT_KEY — declares
 * which template and plugins this deployment ships. `wse sync` reads
 * wse.config.json (kept in step with the plugins listed here) to generate
 * route stubs.
 */
export const siteConfig = {
  id: "es",
  templateId: "eventstructure-v2",
  plugins: [] as const,
}
