"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { saveTemplatePageDraft } from "@wse/core/features/template-cms/api/template-page-client-api"

/** Cmd+S + debounced autosave for JSON surface editors (shop, PDP shell, …). */
export function useSurfaceDraftPersistence({
  templateId,
  pageKey,
  draft,
  dirty,
  markSynced,
  debounceMs = 1500,
}: {
  templateId: string
  pageKey: string
  draft: unknown
  dirty: boolean
  markSynced: () => void
  debounceMs?: number
}) {
  useEffect(() => {
    async function persist() {
      await saveTemplatePageDraft(templateId, pageKey, draft)
      markSynced()
    }

    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        void persist()
          .then(() => toast.success("Piszkozat mentve"))
          .catch(() => toast.error("Mentés sikertelen"))
      }
    }

    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [templateId, pageKey, draft, markSynced])

  useEffect(() => {
    if (!dirty) return

    async function persist() {
      await saveTemplatePageDraft(templateId, pageKey, draft)
      markSynced()
    }

    const t = window.setTimeout(() => {
      void persist().catch(() => toast.error("Automatikus mentés sikertelen"))
    }, debounceMs)

    return () => window.clearTimeout(t)
  }, [debounceMs, dirty, draft, templateId, pageKey, markSynced])

  return {
    persistDraft: async () => {
      await saveTemplatePageDraft(templateId, pageKey, draft)
      markSynced()
    },
  }
}
