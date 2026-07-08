import { NextResponse } from "next/server"
import { PluginService } from "@wse/core/services/plugin"
import { loadPluginModule } from "@wse/core/plugins/registry"
import type { PluginApiContext } from "@wse/sdk/plugins/types"

export async function dispatchPluginApi(
  pluginId: string,
  path: string[],
  request: Request
): Promise<Response> {
  const enabled = await PluginService.isEnabled(pluginId)
  if (!enabled) {
    return NextResponse.json(
      { error: "Plugin is not enabled for this deployment", code: "PLUGIN_DISABLED" },
      { status: 404 }
    )
  }

  let plugin
  try {
    plugin = await loadPluginModule(pluginId)
  } catch {
    return NextResponse.json(
      { error: "Unknown plugin", code: "PLUGIN_NOT_FOUND" },
      { status: 404 }
    )
  }
  if (!plugin.api?.handle) {
    return NextResponse.json(
      { error: "Plugin has no API handler", code: "PLUGIN_NO_API" },
      { status: 404 }
    )
  }

  const config = await PluginService.getConfig(pluginId)
  const context: PluginApiContext = {
    pluginId,
    path,
    request,
    config,
  }

  return plugin.api.handle(context)
}
