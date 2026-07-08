"use client"

import type { EditorProps } from "@wse/sdk/templates/types"

export function CampSurfaceEditorPanel(props: EditorProps<unknown>) {
  void props
  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-6 text-sm text-neutral-400">
      Nyisd meg a megfelelő <code>/admin/cms/…</code> oldalt a vizuális szerkesztőhöz.
    </div>
  )
}
