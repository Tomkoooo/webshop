"use client"

import { use, useState } from "react"
import { coreAdminFetch, useCoreAdminGet } from "../../../lib/use-core-admin-api"
import { TokenGate } from "../../TokenGate"

type SiteDetail = {
  site: {
    siteId: string
    label: string
    baseUrl: string
    templateId: string
    plugins: string[]
    hasManagementSecret: boolean
    deployRepo: string | null
    deployWorkflow: string | null
  }
  live: { ok?: boolean; activeTemplateId?: string; enabledPlugins?: string[]; error?: string } | null
}

/** JSON editor for one remote management resource (branding / seo / theme). */
function ResourceEditor({ siteId, resource }: { siteId: string; resource: "branding" | "seo" | "theme" }) {
  const [value, setValue] = useState("")
  const [status, setStatus] = useState<string | null>(null)

  const load = async () => {
    setStatus("Loading…")
    const res = await coreAdminFetch(`/api/sites/${siteId}/manage/${resource}`)
    const body = await res.json()
    if (!res.ok) {
      setStatus(`Load failed: ${(body as { error?: string }).error ?? res.status}`)
      return
    }
    setValue(JSON.stringify(body, null, 2))
    setStatus(null)
  }

  const save = async () => {
    let parsed: unknown
    try {
      parsed = JSON.parse(value)
    } catch {
      setStatus("Invalid JSON")
      return
    }
    setStatus("Saving…")
    const res = await coreAdminFetch(`/api/sites/${siteId}/manage/${resource}`, {
      method: "PUT",
      body: JSON.stringify(parsed),
    })
    const body = await res.json()
    setStatus(res.ok ? "Saved" : `Save failed: ${(body as { error?: string }).error ?? res.status}`)
  }

  return (
    <section className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white">{resource}</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={load}
            className="rounded border border-white/20 px-3 py-1 text-xs text-neutral-200 hover:bg-white/10"
          >
            Load
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!value}
            className="rounded bg-white px-3 py-1 text-xs font-semibold text-black hover:bg-neutral-200 disabled:opacity-40"
          >
            Save to site
          </button>
        </div>
      </header>
      {status ? <p className="text-xs text-neutral-400">{status}</p> : null}
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={value ? 14 : 3}
        spellCheck={false}
        placeholder={`Press Load to fetch ${resource} from the site`}
        className="w-full rounded border border-white/15 bg-black/50 p-3 font-mono text-xs text-emerald-100"
      />
    </section>
  )
}

export default function SiteDetailPage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = use(params)
  const { data, error, unauthorized, reload } = useCoreAdminGet<SiteDetail>(`/api/sites/${siteId}`)
  const [deployStatus, setDeployStatus] = useState<string | null>(null)

  if (unauthorized) return <TokenGate onSaved={reload} />
  if (error) return <p className="text-sm text-red-400">{error}</p>
  if (!data) return <p className="text-sm text-neutral-400">Loading…</p>

  const { site, live } = data

  const triggerDeploy = async () => {
    setDeployStatus("Dispatching…")
    const res = await coreAdminFetch(`/api/sites/${siteId}/deploy`, {
      method: "POST",
      body: JSON.stringify({}),
    })
    const body = await res.json()
    setDeployStatus(
      res.ok ? "Workflow dispatched" : `Failed: ${(body as { error?: string }).error ?? res.status}`
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">{site.label}</h1>
          <p className="text-sm text-neutral-500">
            {site.baseUrl} — template <span className="text-neutral-300">{site.templateId}</span>
            {site.plugins.length > 0 ? <> — plugins {site.plugins.join(", ")}</> : null}
          </p>
        </div>
        {site.deployRepo ? (
          <div className="text-right">
            <button
              type="button"
              onClick={triggerDeploy}
              className="rounded bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-black hover:bg-emerald-400"
            >
              Trigger deploy
            </button>
            {deployStatus ? <p className="mt-1 text-xs text-neutral-400">{deployStatus}</p> : null}
          </div>
        ) : null}
      </div>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">Live status</h2>
        {!site.hasManagementSecret ? (
          <p className="text-neutral-500">No management secret configured — remote editing disabled.</p>
        ) : live?.ok ? (
          <p className="text-neutral-200">
            Reachable — active template <span className="font-mono">{live.activeTemplateId}</span>, plugins{" "}
            {live.enabledPlugins?.join(", ") || "none"}
          </p>
        ) : (
          <p className="text-red-400">Unreachable: {live?.error ?? "unknown error"}</p>
        )}
      </section>

      {site.hasManagementSecret ? (
        <>
          <ResourceEditor siteId={siteId} resource="branding" />
          <ResourceEditor siteId={siteId} resource="seo" />
          <ResourceEditor siteId={siteId} resource="theme" />
        </>
      ) : null}
    </div>
  )
}
