import type { PluginModule } from "@wse/sdk/plugins/types"

export type PluginRegistryEntry = {
  id: string
  module: PluginModule
}

const syncRegistry: Record<string, PluginModule> = {}

const pluginLoaders: Record<string, () => Promise<PluginModule>> = {
  "camp-booking": () => import("@wse/plugin-camp-booking/plugin.config").then((m) => m.campBooking),
  "press-kit": () => import("@wse/plugin-press-kit/plugin.config").then((m) => m.pressKit),
  "order-lab": () => import("@wse/plugin-order-lab/plugin.config").then((m) => m.orderLab),
  "t-book": () => import("@wse/plugin-t-book/plugin.config").then((m) => m.tBook),
}

export function listRegisteredPluginIds(): string[] {
  return Object.keys(pluginLoaders)
}

export async function loadPluginModule(id: string): Promise<PluginModule> {
  if (syncRegistry[id]) return syncRegistry[id]
  const loader = pluginLoaders[id]
  if (!loader) {
    throw new Error(`Unknown plugin id '${id}'. Register it in src/plugins/registry.ts.`)
  }
  const loaded = await loader()
  syncRegistry[id] = loaded
  return loaded
}

export function getPluginById(id: string): PluginModule | undefined {
  return syncRegistry[id]
}

export function listAllPlugins(): PluginRegistryEntry[] {
  return Object.entries(syncRegistry).map(([id, module]) => ({ id, module }))
}
