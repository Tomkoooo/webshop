import { notFound } from "next/navigation"
import { PluginService } from "@wse/core/services/plugin"
import { loadPluginModule } from "@wse/core/plugins/registry"

type PageProps = {
  params: Promise<{ pluginId: string; path?: string[] }>
}

export default async function AdminPluginScreenPage({ params }: PageProps) {
  const { pluginId, path: pathSegments } = await params
  const path = pathSegments ?? []

  const enabled = await PluginService.isEnabled(pluginId)
  if (!enabled) notFound()

  let plugin
  try {
    plugin = await loadPluginModule(pluginId)
  } catch {
    notFound()
  }
  if (!plugin.admin?.Screen) notFound()

  const config = await PluginService.getConfig(pluginId)
  const Screen = plugin.admin.Screen

  return <Screen path={path} config={config} />
}
