"use client"

import type { EditorProps } from "@wse/sdk/templates/types"
import type { HomeContent } from "./schema"

export function HomeEditorPanel({ content }: EditorProps<HomeContent>) {
  return (
    <div className="space-y-3 rounded-lg border border-border p-4 text-sm text-muted-foreground">
      <p>
        Edit the homepage in the visual CMS: <strong>/admin/cms/home</strong>
      </p>
      <p className="text-xs">SEO title: {content.meta.seoTitle || "—"}</p>
    </div>
  )
}
