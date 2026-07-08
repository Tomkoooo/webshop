"use client"

import type { ReactNode } from "react"
import type { CmsListFieldSpec } from "@wse/sdk/templates/types"
import { CmsListField } from "@wse/core/features/template-cms/components/CmsListField"
import { getAtPath } from "@wse/core/lib/immutable-set-path"

/**
 * Container for structured editors (CmsListField sections) shown beside the
 * visual canvas. Pass it to the CMS chrome's `structureSidebar` slot.
 */
export function CmsStructureSidebar({
  title = "Tartalom szerkezet",
  children,
}: {
  title?: string
  children: ReactNode
}) {
  return (
    <div className="max-h-[calc(100vh-6rem)] space-y-4 overflow-y-auto rounded-xl border border-white/10 bg-black/40 p-3">
      <p className="text-[10px] uppercase tracking-widest text-neutral-500">{title}</p>
      {children}
    </div>
  )
}

/**
 * Renders a page's declared `listFields` as structured list managers bound to
 * the current draft. Returns null when the page declares no list fields, so
 * editors can pass the result straight to the chrome's `structureSidebar` slot.
 */
export function buildListFieldsSidebar({
  specs,
  draft,
  setPath,
}: {
  specs: CmsListFieldSpec[] | undefined
  draft: Record<string, unknown>
  setPath: (path: string, value: unknown) => void
}): ReactNode {
  if (!specs || specs.length === 0) return null
  return (
    <CmsStructureSidebar>
      {specs.map((spec) => {
        const raw = getAtPath(draft, spec.path)
        const items = Array.isArray(raw) ? (raw as Record<string, unknown>[]) : []
        return (
          <CmsListField
            key={spec.path}
            path={spec.path}
            label={spec.label}
            titleKey={spec.titleKey}
            fields={spec.fields}
            maxItems={spec.maxItems}
            items={items}
            onChange={(next) => setPath(spec.path, next)}
          />
        )
      })}
    </CmsStructureSidebar>
  )
}
