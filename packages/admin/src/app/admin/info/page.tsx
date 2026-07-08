import { Settings2, ToggleLeft, ToggleRight } from "lucide-react"
import Link from "next/link"
import { getAdminFeatureFlags, updateFeatureFlag } from "@wse/core/actions/admin-flags"
import { getAdminLegalDocuments, uploadLegalDocument } from "@wse/core/actions/admin-legal"
import { AdminPluginSettingsSection } from "@wse/core/components/admin/AdminPluginSettingsSection"
import { Button } from "@wse/core/components/ui/button"
import { cn } from "@wse/core/lib/utils"
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
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight mb-2 uppercase italic text-white leading-[0.9]">
          Beállítások
        </h1>
        <p className="text-white/40 font-medium italic max-w-2xl">
          Deployment:{" "}
          <code className="text-neutral-300 not-italic">{deployment.key}</code>
          {shopEnabled ? " · webshop aktív" : " · tartalom / plugin üzemmód"}
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-heading font-black uppercase tracking-wider text-white">
          Funkciók
        </h2>
        {flags.length === 0 ? (
          <p className="text-sm text-neutral-500 italic">Nincs ehhez a deploymenthez kapcsolódó kapcsoló.</p>
        ) : (
          <div className="space-y-4">
            {flags.map((flag) => (
              <div
                key={flag._id}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Settings2 className="w-4 h-4 admin-icon-accent" />
                    <h3 className="text-lg font-black uppercase tracking-wider text-white">
                      {flag.label}
                    </h3>
                    <span
                      className={cn(
                        "text-[10px] uppercase tracking-widest font-black px-2 py-1 border",
                        flag.enabled
                          ? "text-emerald-400 border-emerald-400/40 bg-emerald-500/10"
                          : "text-neutral-400 border-white/20 bg-white/5"
                      )}
                    >
                      {flag.enabled ? "Aktív" : "Inaktív"}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-400">{flag.description || "Nincs leírás."}</p>
                  <p className="text-[10px] uppercase tracking-widest text-neutral-600">{flag.key}</p>
                </div>

                <form action={updateFeatureFlag.bind(null, flag.key, !flag.enabled)}>
                  <Button
                    className={cn(
                      "rounded-none min-w-[170px] h-12 font-black uppercase tracking-widest text-[10px]",
                      flag.enabled
                        ? "bg-rose-700 hover:bg-rose-800 text-white"
                        : "bg-emerald-700 hover:bg-emerald-800 text-white"
                    )}
                  >
                    {flag.enabled ? (
                      <ToggleRight className="w-4 h-4 mr-2" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 mr-2" />
                    )}
                    {flag.enabled ? "Kikapcsolás" : "Bekapcsolás"}
                  </Button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      <AdminPluginSettingsSection plugins={pluginSettings} deploymentKey={deployment.key} />

      <section className="space-y-4 pt-6 border-t border-white/10">
        <h2 className="text-2xl font-heading font-black uppercase tracking-wider text-white">
          Jogi dokumentumok
        </h2>
        <p className="text-neutral-400 text-sm">
          Töltsd fel az Impresszum, ÁSZF és GDPR dokumentumokat. Ezek linkje megjelenik a footerben.
        </p>

        {(["impresszum", "terms", "gdpr"] as const).map((docKey) => {
          const existing = docsByKey.get(docKey)
          return (
            <div
              key={docKey}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white uppercase tracking-wider">
                  {docKey === "impresszum" ? "Impresszum" : docKey === "terms" ? "ÁSZF" : "GDPR"}
                </h3>
                {existing ? (
                  <div className="text-xs text-neutral-400">
                    <p>
                      Feltöltve:{" "}
                      {existing.uploadedAt
                        ? new Date(existing.uploadedAt).toLocaleString("hu-HU")
                        : "-"}
                    </p>
                    <Link
                      href={`/api/media/${existing.fileName}`}
                      className="admin-link-accent"
                      target="_blank"
                    >
                      Jelenlegi dokumentum megnyitása
                    </Link>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500">Még nincs feltöltve.</p>
                )}
              </div>

              <form
                action={uploadLegalDocument.bind(null, docKey)}
                className="flex items-center gap-3"
              >
                <input
                  type="file"
                  name="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className="text-xs text-neutral-300"
                  required
                />
                <Button className="rounded-none bg-primary hover:bg-primary/85 text-white uppercase tracking-widest text-[10px] h-11">
                  Feltöltés
                </Button>
              </form>
            </div>
          )
        })}
      </section>

      <p className="pt-4 text-[10px] font-black uppercase tracking-widest text-neutral-600">
        Dev:{" "}
        <Link href="/admin/dev/spinners" className="admin-link-accent hover:underline">
          Loading spinner preview
        </Link>
      </p>
    </div>
  )
}
