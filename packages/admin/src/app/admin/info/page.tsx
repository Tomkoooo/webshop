import Link from "next/link"
import { AdminPageScaffold } from "@wse/core/components/admin/AdminPageScaffold"
import { AdminPluginSettingsSection } from "@wse/core/components/admin/AdminPluginSettingsSection"
import { Badge } from "@wse/core/components/ui/badge"
import { Button } from "@wse/core/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@wse/core/components/ui/card"
import { getAdminFeatureFlags, updateFeatureFlag } from "@wse/core/actions/admin-flags"
import { getAdminLegalDocuments, uploadLegalDocument } from "@wse/core/actions/admin-legal"
import { isShopEnabled } from "@wse/core/lib/features/shop"
import {
  getAccessiblePluginFeatureFlagKeys,
  getAccessiblePluginSettings,
  getDeploymentForAdmin,
  isAdminFlagKeyAccessible,
} from "@wse/core/lib/admin-settings-access"
import { PluginService } from "@wse/core/services/plugin"

type FeatureFlagRow = {
  _id: string
  key: string
  label: string
  description?: string
  enabled: boolean
}

type LegalDocumentRow = {
  _id: string
  key: "impresszum" | "terms" | "gdpr"
  title: string
  fileName: string
  uploadedAt?: string | Date
}

const LEGAL_LABELS: Record<LegalDocumentRow["key"], string> = {
  impresszum: "Impresszum",
  terms: "ÁSZF",
  gdpr: "GDPR",
}

export default async function AdminInfoPage() {
  const host = await PluginService.getHost()
  const deployment = getDeploymentForAdmin(host)
  const shopEnabled = isShopEnabled()
  const pluginFlagKeys = new Set(getAccessiblePluginFeatureFlagKeys(deployment))

  const allFlags = (await getAdminFeatureFlags()) as FeatureFlagRow[]
  const flags = allFlags.filter(
    (flag) =>
      isAdminFlagKeyAccessible(flag.key, deployment, shopEnabled) &&
      !pluginFlagKeys.has(flag.key)
  )
  const flagEnabledByKey = Object.fromEntries(allFlags.map((f) => [f.key, f.enabled]))

  const pluginSettings = getAccessiblePluginSettings(deployment, flagEnabledByKey, host)
  const legalDocs = (await getAdminLegalDocuments()) as LegalDocumentRow[]
  const docsByKey = new Map(legalDocs.map((doc) => [doc.key, doc]))

  return (
    <AdminPageScaffold
      title="Rendszerbeállítások"
      description={
        <>
          Deployment: <code className="rounded bg-muted px-1.5 py-0.5 text-sm">{deployment.key}</code>
          {shopEnabled ? " · webshop aktív" : " · tartalom / plugin üzemmód"}
        </>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Funkciókapcsolók</CardTitle>
          <CardDescription>
            Csak azok a modulok látszanak, amelyek ehhez a telepítéshez tartoznak. A technikai kulcsok rejtve
            maradnak.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {flags.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nincs ehhez a telepítéshez kapcsolódó kapcsoló.</p>
          ) : (
            flags.map((flag) => (
              <div
                key={flag._id}
                className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{flag.label}</p>
                    <Badge variant={flag.enabled ? "default" : "secondary"}>
                      {flag.enabled ? "Bekapcsolva" : "Kikapcsolva"}
                    </Badge>
                  </div>
                  {flag.description ? (
                    <p className="text-muted-foreground text-sm">{flag.description}</p>
                  ) : null}
                </div>
                <form action={updateFeatureFlag.bind(null, flag.key, !flag.enabled)}>
                  <Button type="submit" variant={flag.enabled ? "outline" : "default"}>
                    {flag.enabled ? "Kikapcsolás" : "Bekapcsolás"}
                  </Button>
                </form>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <AdminPluginSettingsSection plugins={pluginSettings} deploymentKey={deployment.key} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Jogi dokumentumok</CardTitle>
          <CardDescription>
            Ezek linkje megjelenik a láblécben. Egy fájl feltöltése felülírja az előző verziót.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(["impresszum", "terms", "gdpr"] as const).map((docKey) => {
            const existing = docsByKey.get(docKey)
            return (
              <div
                key={docKey}
                className="flex flex-col gap-4 rounded-lg border p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="space-y-1">
                  <p className="font-medium">{LEGAL_LABELS[docKey]}</p>
                  {existing ? (
                    <div className="text-muted-foreground text-sm">
                      <p>
                        Feltöltve:{" "}
                        {existing.uploadedAt
                          ? new Date(existing.uploadedAt).toLocaleString("hu-HU")
                          : "—"}
                      </p>
                      <Link
                        href={`/api/media/${existing.fileName}`}
                        className="text-primary hover:underline"
                        target="_blank"
                      >
                        Jelenlegi fájl megnyitása
                      </Link>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">Még nincs feltöltve.</p>
                  )}
                </div>
                <form action={uploadLegalDocument.bind(null, docKey)} className="flex flex-wrap items-center gap-3">
                  <input type="file" name="file" accept=".pdf,.doc,.docx,.txt" required className="text-sm" />
                  <Button type="submit" size="sm">
                    Feltöltés
                  </Button>
                </form>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-xs">
        Fejlesztői eszköz:{" "}
        <Link href="/admin/dev/spinners" className="text-primary hover:underline">
          spinner előnézet
        </Link>
      </p>
    </AdminPageScaffold>
  )
}
