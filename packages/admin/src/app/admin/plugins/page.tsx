import Link from "next/link"
import { PluginService } from "@wse/core/services/plugin"
import { pluginAdminHref } from "@wse/sdk/plugins/types"
import { Puzzle } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import { Card, CardContent } from "@wse/core/components/ui/card"
import { AdminPageScaffold } from "@wse/core/components/admin/AdminPageScaffold"

export default async function AdminPluginsIndexPage() {
  const enabled = await PluginService.listEnabled()

  return (
    <AdminPageScaffold
      title="Pluginok"
      description="Az aktív deploymenthez engedélyezett bővítmények."
    >
      {enabled.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ehhez a deploymenthez nincs engedélyezett plugin.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {enabled.map((plugin) => (
            <li key={plugin.id}>
              <Card className="shadow-sm">
                <CardContent className="flex flex-col gap-4 pt-6">
                  <div className="flex items-center gap-3">
                    <Puzzle className="size-6 text-primary" />
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">{plugin.name}</h2>
                      <p className="font-mono text-xs text-muted-foreground">{plugin.id}</p>
                    </div>
                  </div>
                  <p className="flex-1 text-sm text-muted-foreground">{plugin.manifest.description}</p>
                  <Button variant="outline" size="sm" asChild className="w-fit">
                    <Link href={pluginAdminHref(plugin.id, "")}>Megnyitás</Link>
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </AdminPageScaffold>
  )
}
