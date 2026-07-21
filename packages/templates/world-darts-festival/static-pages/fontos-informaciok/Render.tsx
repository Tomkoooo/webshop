"use client"

import { CmsRichText } from "@wse/cms-bridge"
import type { RenderProps, StaticPageDeps } from "@wse/sdk/templates/types"
import type { ImportantInfoContent } from "./schema"

/** Plain CMS strings → minimal HTML so TipTap and storefront render consistently. */
function asRichHtml(value: string | undefined): string {
  const trimmed = (value || "").trim()
  if (!trimmed) return "<p></p>"
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return trimmed
  return `<p>${trimmed
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")}</p>`
}

export function ImportantInfoRender({
  content,
}: RenderProps<ImportantInfoContent, StaticPageDeps>) {
  return (
    <div className="bg-background text-foreground">
      <section className="border-b border-border/60 bg-surface py-16">
        <div className="mx-auto max-w-3xl space-y-4 px-4">
          <div className="text-3xl font-bold tracking-tight sm:text-4xl [&_p]:mb-0">
            <CmsRichText
              path="title"
              html={asRichHtml(content.title)}
              toolbar="compact"
            />
          </div>
          <div className="text-lg text-muted-foreground [&_p]:mb-0 [&_span]:text-inherit">
            <CmsRichText
              path="subtitle"
              html={asRichHtml(content.subtitle)}
              toolbar="compact"
            />
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4">
          <div className="prose prose-invert max-w-none text-muted-foreground [&_p]:mb-4 [&_ul]:my-4 [&_ol]:my-4">
            <CmsRichText path="body" html={asRichHtml(content.body) || "<p></p>"} />
          </div>
        </div>
      </section>
    </div>
  )
}
