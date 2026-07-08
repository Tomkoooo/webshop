"use client"

import Link from "next/link"
import { Puzzle, Settings2, ToggleLeft, ToggleRight } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import { cn } from "@wse/core/lib/utils"
import { getConfigFieldLabel, type AdminPluginSettingsEntry } from "@wse/core/lib/admin-settings-access"
import { updateFeatureFlag } from "@wse/core/actions/admin-flags"

type Props = {
  plugins: AdminPluginSettingsEntry[]
  deploymentKey: string
}

export function AdminPluginSettingsSection({ plugins, deploymentKey }: Props) {
  if (plugins.length === 0) return null

  return (
    <section className="space-y-4 pt-6 border-t border-white/10">
      <div>
        <h2 className="text-2xl font-heading font-black uppercase tracking-wider text-white flex items-center gap-2">
          <Puzzle className="w-5 h-5 admin-icon-accent" />
          Plugin beállítások
        </h2>
        <p className="text-neutral-400 text-sm mt-2 max-w-2xl">
          A <code className="text-neutral-300">{deploymentKey}</code> deployment által engedélyezett
          pluginok. A konfigurációs értékek a <code className="text-neutral-300">deployments.config.json</code>{" "}
          fájlban állíthatók; a futtatáshoz kapcsolja be a plugint alább.
        </p>
      </div>

      <div className="space-y-4">
        {plugins.map((plugin) => (
          <div
            key={plugin.pluginId}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5"
          >
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Settings2 className="w-4 h-4 admin-icon-accent" />
                  <h3 className="text-lg font-black uppercase tracking-wider text-white">
                    {plugin.name}
                  </h3>
                  <span className="text-[10px] uppercase tracking-widest text-neutral-600 font-mono">
                    {plugin.pluginId}
                  </span>
                  {plugin.featureFlagKey ? (
                    <span
                      className={cn(
                        "text-[10px] uppercase tracking-widest font-black px-2 py-1 border",
                        plugin.featureEnabled
                          ? "text-emerald-400 border-emerald-400/40 bg-emerald-500/10"
                          : "text-neutral-400 border-white/20 bg-white/5"
                      )}
                    >
                      {plugin.featureEnabled ? "Fut" : "Kikapcsolva"}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-neutral-400">{plugin.description}</p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                {plugin.featureFlagKey ? (
                  <form
                    action={updateFeatureFlag.bind(
                      null,
                      plugin.featureFlagKey,
                      !plugin.featureEnabled
                    )}
                  >
                    <Button
                      type="submit"
                      className={cn(
                        "rounded-none min-w-[150px] h-11 font-black uppercase tracking-widest text-[10px]",
                        plugin.featureEnabled
                          ? "bg-rose-700 hover:bg-rose-800 text-white"
                          : "bg-emerald-700 hover:bg-emerald-800 text-white"
                      )}
                    >
                      {plugin.featureEnabled ? (
                        <ToggleRight className="w-4 h-4 mr-2" />
                      ) : (
                        <ToggleLeft className="w-4 h-4 mr-2" />
                      )}
                      {plugin.featureEnabled ? "Kikapcsolás" : "Bekapcsolás"}
                    </Button>
                  </form>
                ) : null}
                <Button
                  asChild
                  variant="outline"
                  className="rounded-none h-11 border-white/10 text-white text-[10px] font-black uppercase tracking-widest"
                >
                  <Link href={plugin.adminHref}>Plugin admin →</Link>
                </Button>
              </div>
            </div>

            {Object.keys(plugin.config).length > 0 ? (
              <dl className="grid gap-3 sm:grid-cols-2 border-t border-white/10 pt-4">
                {Object.entries(plugin.config).map(([key, value]) => (
                  <div key={key} className="bg-black/30 border border-white/5 px-4 py-3">
                    <dt className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                      {getConfigFieldLabel(plugin.pluginId, key)}
                    </dt>
                    <dd className="mt-1 text-sm font-mono text-white">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-xs text-neutral-500 border-t border-white/10 pt-4">
                Nincs deployment-specifikus pluginConfig ehhez a pluginhoz.
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
