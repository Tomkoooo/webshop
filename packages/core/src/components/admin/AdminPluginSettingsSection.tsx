"use client"

import Link from "next/link"
import { Puzzle, Settings2, ToggleLeft, ToggleRight } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import { Card, CardContent } from "@wse/core/components/ui/card"
import { AdminStatusBadge } from "@wse/core/components/admin/AdminStatusBadge"
import { getConfigFieldLabel, type AdminPluginSettingsEntry } from "@wse/core/lib/admin-settings-access"
import { updateFeatureFlag } from "@wse/core/actions/admin-flags"
import { adminSectionTitle } from "@wse/core/lib/admin-ui"

type Props = {
  plugins: AdminPluginSettingsEntry[]
  deploymentKey: string
}

export function AdminPluginSettingsSection({ plugins, deploymentKey }: Props) {
  if (plugins.length === 0) return null

  return (
    <section className="space-y-4 border-t border-border/50 pt-6">
      <div>
        <h2 className={adminSectionTitle}>
          <span className="inline-flex items-center gap-2">
            <Puzzle className="h-5 w-5 text-primary" />
            Plugin beállítások
          </span>
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          A <code className="text-foreground">{deploymentKey}</code> deployment által engedélyezett
          pluginok. A konfigurációs értékek a <code className="text-foreground">deployments.config.json</code>{" "}
          fájlban állíthatók; a futtatáshoz kapcsolja be a plugint alább.
        </p>
      </div>

      <div className="space-y-4">
        {plugins.map((plugin) => (
          <Card key={plugin.pluginId}>
            <CardContent className="space-y-5 p-6">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Settings2 className="h-4 w-4 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">{plugin.name}</h3>
                    <span className="font-mono text-xs text-muted-foreground">{plugin.pluginId}</span>
                    {plugin.featureFlagKey ? (
                      <AdminStatusBadge
                        status={plugin.featureEnabled ? "active" : "cancelled"}
                        label={plugin.featureEnabled ? "Fut" : "Kikapcsolva"}
                      />
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">{plugin.description}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
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
                        variant={plugin.featureEnabled ? "destructive" : "default"}
                        className="h-11 min-w-[150px] text-xs"
                      >
                        {plugin.featureEnabled ? (
                          <ToggleRight className="mr-2 h-4 w-4" />
                        ) : (
                          <ToggleLeft className="mr-2 h-4 w-4" />
                        )}
                        {plugin.featureEnabled ? "Kikapcsolás" : "Bekapcsolás"}
                      </Button>
                    </form>
                  ) : null}
                  <Button asChild variant="outline" className="h-11 text-xs">
                    <Link href={plugin.adminHref}>Plugin admin →</Link>
                  </Button>
                </div>
              </div>

              {Object.keys(plugin.config).length > 0 ? (
                <dl className="grid gap-3 border-t border-border/50 pt-4 sm:grid-cols-2">
                  {Object.entries(plugin.config).map(([key, value]) => (
                    <div key={key} className="rounded-lg bg-muted/40 px-4 py-3">
                      <dt className="text-xs font-medium text-muted-foreground">
                        {getConfigFieldLabel(plugin.pluginId, key)}
                      </dt>
                      <dd className="mt-1 font-mono text-sm text-foreground">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="border-t border-border/50 pt-4 text-xs text-muted-foreground">
                  Nincs deployment-specifikus pluginConfig ehhez a pluginhoz.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
