"use client"

import { CmsRichText } from "@wse/cms-bridge"
import { EditableDocText } from "@wse/core/features/template-cms/primitives/EditableDocText"
import { useSurfaceDocEdit } from "@wse/core/features/template-cms/surface-doc-edit-context"
import type { RenderProps, StaticPageDeps } from "@wse/sdk/templates/types"
import type { ImportantInfoContent } from "./schema"

export function ImportantInfoRender({
  content,
}: RenderProps<ImportantInfoContent, StaticPageDeps>) {
  const edit = useSurfaceDocEdit()

  return (
    <div className="bg-background text-foreground">
      <section className="border-b border-border/60 bg-surface py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            <EditableDocText path="title" value={content.title} />
          </h1>
          {content.subtitle || edit.enabled ? (
            <p className="mt-4 text-lg text-muted-foreground">
              <EditableDocText path="subtitle" value={content.subtitle} multiline />
            </p>
          ) : null}
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4">
          <div className="prose prose-invert max-w-none text-muted-foreground">
            <CmsRichText path="body" html={content.body || "<p></p>"} />
          </div>
        </div>
      </section>
    </div>
  )
}
