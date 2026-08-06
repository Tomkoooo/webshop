"use client"

import type { EditorProps } from "@wse/sdk/templates/types"
import type { HomeContent } from "./schema"

/** Home is edited visually at `/admin/cms/home`. */
export function HomeEditorPanel({ content }: EditorProps<HomeContent>) {
  return (
    <div className="space-y-3 rounded-lg border border-border p-4 text-sm text-muted-foreground">
      <p>
        Szerkessze a kezdőlapot a vizuális CMS-ben: <strong>/admin/cms/home</strong> — kattintson a
        szövegekre és képekre a szerkesztéshez.
      </p>
      <p className="text-xs">SEO cím: {content.meta.seoTitle || "—"}</p>
    </div>
  )
}
