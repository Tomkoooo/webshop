"use client"

import type { EditorProps } from "@wse/sdk/templates/types"
import type { HomeContent } from "./schema"

// default-modern mounts VisualHomepageEditor from /admin/cms/home (see CmsPageEditor).

export function HomeEditorPanel(props: EditorProps<HomeContent>) {
  void props
  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-6 text-sm text-neutral-400">
      Open <code>/admin/cms/home</code> for the visual block editor.
    </div>
  )
}
