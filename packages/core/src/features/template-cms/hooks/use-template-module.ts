"use client"

import { useEffect, useMemo, useState } from "react"
import { getTemplateById, loadTemplateModule } from "@wse/core/templates/registry"
import type { TemplateModule } from "@wse/sdk/templates/types"

function resolveTemplateModule(templateId: string): TemplateModule | null {
  return getTemplateById(templateId) ?? null
}

export type TemplateModuleState = {
  mod: TemplateModule | null
  loading: boolean
  error: string | null
}

/**
 * Client-side template lookup. Lazy templates (e.g. sakkmed) are not in the sync
 * registry until `loadTemplateModule` runs — use this instead of `getTemplateById` alone.
 */
export function useTemplateModule(templateId: string): TemplateModuleState {
  const syncMod = useMemo(() => resolveTemplateModule(templateId), [templateId])
  const [loadedMod, setLoadedMod] = useState<TemplateModule | null>(null)
  const [loadedForId, setLoadedForId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    setLoadError(null)
    if (syncMod) return
    let cancelled = false
    void loadTemplateModule(templateId)
      .then((next) => {
        if (cancelled) return
        if (next.manifest.id !== templateId) {
          setLoadError(
            `A '${templateId}' sablon nem érhető el ebben a buildben (betöltött: '${next.manifest.id}'). Építsd újra a megfelelő site app image-et.`
          )
          return
        }
        setLoadedMod(next)
        setLoadedForId(templateId)
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "A sablon betöltése sikertelen.")
        }
      })
    return () => {
      cancelled = true
    }
  }, [templateId, syncMod])

  if (loadError) {
    return { mod: null, loading: false, error: loadError }
  }

  if (syncMod) {
    return { mod: syncMod, loading: false, error: null }
  }

  if (loadedForId === templateId && loadedMod) {
    return { mod: loadedMod, loading: false, error: null }
  }

  return { mod: null, loading: true, error: null }
}
