"use client"

import { VisualHomepageEditor } from "@wse/core/features/homepage-cms/components/editor/VisualHomepageEditor"

/** Homepage block CMS entry: delegates to {@link VisualHomepageEditor}. */
export type CmsTemplatePageClientProps = Parameters<typeof VisualHomepageEditor>[0] & {
  /** Remount when server-fed draft changes (e.g. after refresh). */
  hydrationKey: string
}

export function CmsTemplatePageClient({ hydrationKey, ...props }: CmsTemplatePageClientProps) {
  return <VisualHomepageEditor key={hydrationKey} {...props} />
}
