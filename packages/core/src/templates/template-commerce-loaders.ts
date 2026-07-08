import type { TemplateModule } from "@wse/sdk/templates/types"

const FALLBACK_TEMPLATE_ID = "default-modern" as const

const templateModuleLoaders: Record<string, () => Promise<TemplateModule>> = {
  [FALLBACK_TEMPLATE_ID]: () =>
    import("@wse/template-default-modern/template.config").then((m) => m.defaultModern),
  "atelier-showcase": () =>
    import("@wse/template-atelier-showcase/template.config").then((m) => m.atelierShowcase),
  "minecraft-camp": () => import("@wse/template-minecraft-camp/template.config").then((m) => m.minecraftCamp),
}

const cache: Partial<Record<string, TemplateModule>> = {
  [FALLBACK_TEMPLATE_ID]: undefined,
}

/** Client-safe async template load (no full registry / plugin graph). */
export async function loadTemplateModuleForCommerce(templateId: string): Promise<TemplateModule> {
  const loader = templateModuleLoaders[templateId] ?? templateModuleLoaders[FALLBACK_TEMPLATE_ID]
  if (templateId === FALLBACK_TEMPLATE_ID && cache[FALLBACK_TEMPLATE_ID]) {
    return cache[FALLBACK_TEMPLATE_ID]!
  }
  const mod = await loader()
  if (templateModuleLoaders[templateId]) {
    cache[templateId] = mod
  }
  return mod
}
