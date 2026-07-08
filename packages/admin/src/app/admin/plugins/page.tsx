import Link from "next/link"
import { PluginService } from "@wse/core/services/plugin"
import { pluginAdminHref } from "@wse/sdk/plugins/types"
import { Puzzle } from "lucide-react"

export default async function AdminPluginsIndexPage() {
  const enabled = await PluginService.listEnabled()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-black uppercase italic tracking-tight text-white">
          Pluginok
        </h1>
        <p className="mt-2 text-sm text-neutral-400">
          Enabled for this deployment via <code className="text-neutral-300">deployments.config.json</code>{" "}
          and <code className="text-neutral-300">DEPLOYMENT_KEY</code>.
        </p>
      </div>

      {enabled.length === 0 ? (
        <p className="text-neutral-500 text-sm">No plugins are enabled for this deployment.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {enabled.map((plugin) => (
            <li
              key={plugin.id}
              className="border border-white/10 bg-white/[0.02] p-6 flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <Puzzle className="h-6 w-6 text-white" />
                <div>
                  <h2 className="text-lg font-bold text-white">{plugin.name}</h2>
                  <p className="text-xs text-neutral-500 font-mono">{plugin.id}</p>
                </div>
              </div>
              <p className="text-sm text-neutral-400 flex-1">{plugin.manifest.description}</p>
              <Link
                href={pluginAdminHref(plugin.id, "")}
                className="inline-flex text-xs font-black uppercase tracking-widest text-white hover:underline"
              >
                Megnyitás →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
