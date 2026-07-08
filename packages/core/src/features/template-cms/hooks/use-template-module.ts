"use client"

import { useEffect, useMemo, useState } from "react"
import { getTemplateById, loadTemplateModule } from "@wse/core/templates/registry"
import type { TemplateModule } from "@wse/sdk/templates/types"

function resolveTemplateModule(templateId: string): TemplateModule | null {
  return getTemplateById(templateId) ?? null
}

/**
 * Client-side template lookup. Lazy templates (e.g. sakkmed) are not in the sync
 * registry until `loadTemplateModule` runs — use this instead of `getTemplateById` alone.
 */
export function useTemplateModule(templateId: string): TemplateModule | null {
  const syncMod = useMemo(() => resolveTemplateModule(templateId), [templateId])
  const [loadedMod, setLoadedMod] = useState<TemplateModule | null>(null)
  const [loadedForId, setLoadedForId] = useState<string | null>(null)

  useEffect(() => {
    if (syncMod) return
    let cancelled = false
    void loadTemplateModule(templateId).then((next) => {
      if (!cancelled) {
        setLoadedMod(next)
        setLoadedForId(templateId)
      }
    })
    return () => {
      cancelled = true
    }
  }, [templateId, syncMod])

  if (syncMod) return syncMod
  if (loadedForId === templateId) return loadedMod
  return null
}
