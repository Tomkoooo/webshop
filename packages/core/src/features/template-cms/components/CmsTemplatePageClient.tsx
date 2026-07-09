"use client"

import dynamic from "next/dynamic"
import { CmsEditorLoading } from "@wse/core/features/template-cms/components/CmsEditorLoading"
import type { VisualHomepageEditor } from "@wse/core/features/homepage-cms/components/editor/VisualHomepageEditor"

const VisualHomepageEditorLazy = dynamic(
  () =>
    import("@wse/core/features/homepage-cms/components/editor/VisualHomepageEditor").then(
      (mod) => mod.VisualHomepageEditor
    ),
  {
    loading: () => <CmsEditorLoading label="Főoldal szerkesztő betöltése…" />,
  }
)

/** Homepage block CMS entry: delegates to {@link VisualHomepageEditor}. */
export type CmsTemplatePageClientProps = Parameters<typeof VisualHomepageEditor>[0] & {
  /** Remount when server-fed draft changes (e.g. after refresh). */
  hydrationKey: string
}

export function CmsTemplatePageClient({ hydrationKey, ...props }: CmsTemplatePageClientProps) {
  return <VisualHomepageEditorLazy key={hydrationKey} {...props} />
}
