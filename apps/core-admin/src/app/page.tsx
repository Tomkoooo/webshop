"use client"

import { useState } from "react"
import { coreAdminFetch, useCoreAdminGet } from "../lib/use-core-admin-api"
import { TokenGate } from "./TokenGate"

type SiteRow = {
  siteId: string
  label: string
  baseUrl: string
  templateId: string
  plugins: string[]
  engineVersion: string | null
  hasManagementSecret: boolean
}

export default function SitesPage() {
  const { data, error, unauthorized, reload } = useCoreAdminGet<{ sites: SiteRow[] }>("/api/sites")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    siteId: "",
    label: "",
    baseUrl: "",
    templateId: "",
    plugins: "",
    managementSecret: "",
    deployRepo: "",
  })
  const [formError, setFormError] = useState<string | null>(null)

  if (unauthorized) return <TokenGate onSaved={reload} />

  const submit = async () => {
    setFormError(null)
    const res = await coreAdminFetch("/api/sites", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        plugins: form.plugins.split(",").map((p) => p.trim()).filter(Boolean),
        managementSecret: form.managementSecret || undefined,
        deployRepo: form.deployRepo || undefined,
      }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setFormError(String((body as { error?: string }).error ?? res.status))
      return
    }
    setShowForm(false)
    setForm({ siteId: "", label: "", baseUrl: "", templateId: "", plugins: "", managementSecret: "", deployRepo: "" })
    reload()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Site registry</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded bg-white px-3 py-1.5 text-sm font-semibold text-black hover:bg-neutral-200"
        >
          {showForm ? "Cancel" : "Register site"}
        </button>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {showForm ? (
        <div className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-4 sm:grid-cols-2">
          {(
            [
              ["siteId", "Site id (e.g. sakkmed)"],
              ["label", "Label"],
              ["baseUrl", "Base URL (https://…)"],
              ["templateId", "Template id"],
              ["plugins", "Plugins (comma separated)"],
              ["managementSecret", "Management secret"],
              ["deployRepo", "Deploy repo (owner/repo)"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="space-y-1 text-xs text-neutral-400">
              <span>{label}</span>
              <input
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full rounded border border-white/15 bg-black/40 px-2 py-1.5 text-sm text-white"
              />
            </label>
          ))}
          {formError ? <p className="text-xs text-red-400 sm:col-span-2">{formError}</p> : null}
          <button
            type="button"
            onClick={submit}
            className="rounded bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-black hover:bg-emerald-400 sm:col-span-2"
          >
            Create
          </button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-neutral-400">
            <tr>
              <th className="px-4 py-2">Site</th>
              <th className="px-4 py-2">Template</th>
              <th className="px-4 py-2">Plugins</th>
              <th className="px-4 py-2">Managed</th>
            </tr>
          </thead>
          <tbody>
            {(data?.sites ?? []).map((site) => (
              <tr key={site.siteId} className="border-t border-white/10 hover:bg-white/5">
                <td className="px-4 py-2">
                  <a href={`/sites/${site.siteId}`} className="font-medium text-white hover:underline">
                    {site.label}
                  </a>
                  <div className="text-xs text-neutral-500">{site.baseUrl}</div>
                </td>
                <td className="px-4 py-2 text-neutral-300">{site.templateId}</td>
                <td className="px-4 py-2 text-neutral-300">{site.plugins.join(", ") || "—"}</td>
                <td className="px-4 py-2">{site.hasManagementSecret ? "yes" : "no"}</td>
              </tr>
            ))}
            {data && data.sites.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-neutral-500">
                  No sites registered yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
