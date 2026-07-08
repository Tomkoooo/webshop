/**
 * Site identity for 'keramia-implant'. This file — not a DEPLOYMENT_KEY — declares
 * which template and plugins this deployment ships. `wse sync` reads
 * wse.config.json (kept in step with the plugins listed here) to generate
 * route stubs.
 */
export const siteConfig = {
  id: "keramia-implant",
  templateId: "keramia-implant",
  plugins: [] as const,
}
