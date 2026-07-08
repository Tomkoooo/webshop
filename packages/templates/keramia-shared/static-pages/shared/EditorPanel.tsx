"use client"

import type { EditorProps } from "@wse/sdk/templates/types"
import type { CampaignPageContent } from "./schema"

/** Campaign pages are edited visually at `/admin/cms/{slug}` — this panel is a fallback. */
export function CampaignPageEditorPanel({ content }: EditorProps<CampaignPageContent>) {
  return (
    <div className="space-y-3 rounded-lg border border-border p-4 text-sm text-muted-foreground">
      <p>
        Szerkessze a kampány oldalt a vizuális CMS-ben:{" "}
        <strong>/admin/cms</strong> → válassza a kampányt, majd kattintson a szövegekre.
      </p>
      <p className="text-xs">
        SEO cím: {content.meta.seoTitle || "—"}
      </p>
    </div>
  )
}
