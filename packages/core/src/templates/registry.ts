import type { TemplateModule } from "@wse/sdk/templates/types"
import { defaultModern } from "@wse/template-default-modern/template.config"
import { cabinova } from "@wse/template-cabinova/template.config"

export const FALLBACK_TEMPLATE_ID = "default-modern" as const

const syncRegistry: Partial<Record<string, TemplateModule>> = {
  [FALLBACK_TEMPLATE_ID]: defaultModern,
  cabinova,
}

const templateLoaders: Record<string, () => Promise<TemplateModule>> = {
  sorfeszt: () => import("@wse/template-sorfeszt/template.config").then((m) => m.sorfeszt),
  "eventstructure-v2": () => import("@wse/template-eventstructure-v2/template.config").then((m) => m.eventstructureV2),
  "dr-zsanett": () => import("@wse/template-dr-zsanett/template.config").then((m) => m.drZsanett),
  eventstructure: () => import("@wse/template-eventstructure/template.config").then((m) => m.eventstructure),
  "world-darts-festival": () =>
    import("@wse/template-world-darts-festival/template.config").then((m) => m.worldDartsFestival),
  "atelier-showcase": () => import("@wse/template-atelier-showcase/template.config").then((m) => m.atelierShowcase),
  "minecraft-camp": () => import("@wse/template-minecraft-camp/template.config").then((m) => m.minecraftCamp),
  sakkmed: () => import("@wse/template-sakkmed/template.config").then((m) => m.sakkmed),
  erdweg: () => import("@wse/template-erdweg/template.config").then((m) => m.erdweg),
  cabinova: () => import("@wse/template-cabinova/template.config").then((m) => m.cabinova),
  "keramia-fogfeherites": () =>
    import("@wse/template-keramia-fogfeherites/template.config").then((m) => m.keramiaFogfeherites),
  "keramia-implant": () => import("@wse/template-keramia-implant/template.config").then((m) => m.keramiaImplant),
}

export async function loadTemplateModule(id: string): Promise<TemplateModule> {
  if (syncRegistry[id]) return syncRegistry[id]!
  const loader = templateLoaders[id]
  if (!loader) return syncRegistry[FALLBACK_TEMPLATE_ID]!
  const loaded = await loader()
  syncRegistry[id] = loaded
  return loaded
}

export function getTemplateById(id: string | undefined | null): TemplateModule | undefined {
  if (!id) return syncRegistry[FALLBACK_TEMPLATE_ID]
  return syncRegistry[id]
}

export function isRegisteredTemplateId(id: string | undefined | null): boolean {
  if (!id) return false
  return id === FALLBACK_TEMPLATE_ID || id in templateLoaders
}

export async function getTemplateByIdAsync(id: string | undefined | null): Promise<TemplateModule> {
  if (!id) return syncRegistry[FALLBACK_TEMPLATE_ID]!
  if (syncRegistry[id]) return syncRegistry[id]!
  return loadTemplateModule(id)
}

/** Sync registry for admin/scripts; inactive templates may be undefined until `loadTemplateModule`. */
export const TEMPLATE_REGISTRY: Record<string, TemplateModule | undefined> = new Proxy(
  {} as Record<string, TemplateModule | undefined>,
  {
    get(_target, prop: string) {
      if (prop === FALLBACK_TEMPLATE_ID || prop === "default-modern") {
        return syncRegistry[FALLBACK_TEMPLATE_ID]
      }
      return syncRegistry[prop]
    },
    has(_target, prop: string) {
      return prop === FALLBACK_TEMPLATE_ID || prop === "default-modern" || prop in syncRegistry
    },
    ownKeys() {
      return Object.keys(syncRegistry)
    },
  }
)

export function listTemplates(): TemplateModule[] {
  const fallback = syncRegistry[FALLBACK_TEMPLATE_ID]
  return fallback ? [fallback] : []
}

export async function listAllTemplates(): Promise<TemplateModule[]> {
  const ids = [FALLBACK_TEMPLATE_ID, ...Object.keys(templateLoaders)] as const
  return Promise.all(ids.map((id) => loadTemplateModule(id)))
}

export function listRegisteredTemplateIds(): string[] {
  return [FALLBACK_TEMPLATE_ID, ...Object.keys(templateLoaders)]
}
