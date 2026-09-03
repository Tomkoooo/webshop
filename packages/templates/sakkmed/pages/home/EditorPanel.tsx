"use client"

import type { EditorProps } from "@wse/sdk/templates/types"
import type { HomeContent } from "./schema"

// default-modern mounts VisualHomepageEditor from /admin/cms/home (see CmsPageEditor).

export function HomeEditorPanel(props: EditorProps<HomeContent>) {
  void props
  return (
    <div className="rounded-md border border-border/40 bg-foreground/5 p-6 text-sm text-muted-foreground">
      Nyisd meg a <code>/admin/cms/home</code> oldalt a blokk‑szerkesztőhöz.
    </div>
  )
}
