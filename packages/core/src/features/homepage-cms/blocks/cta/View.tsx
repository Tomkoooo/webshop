import type { CtaBlock } from "@wse/core/features/homepage-cms/types/block-types"
import { useCmsEdit } from "@wse/core/features/homepage-cms/components/editor/cms-edit-context"
import { EditableTextInline } from "@wse/core/features/homepage-cms/components/primitives/EditableTextInline"
import { EditableLinkInline } from "@wse/core/features/homepage-cms/components/primitives/EditableLinkInline"

export function CtaBlockView({ block }: { block: CtaBlock }) {
  const cms = useCmsEdit()
  return (
    <section id="cta" className="border-b border-border bg-background py-16 md:py-20">
      <div className="container mx-auto space-y-4 px-4 text-center">
        <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
          {cms.enabled ? (
            <EditableTextInline blockType="cta" field="title" value={block.data.title} />
          ) : (
            block.data.title
          )}
        </h2>
        {block.data.description || cms.enabled ? (
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            {cms.enabled ? (
              <EditableTextInline
                blockType="cta"
                field="description"
                value={block.data.description}
                multiline
                placeholder="Leírás (opcionális)"
              />
            ) : (
              block.data.description
            )}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <EditableLinkInline
            blockType="cta"
            labelField="primaryLabel"
            hrefField="primaryHref"
            label={block.data.primaryLabel}
            href={block.data.primaryHref}
            className="inline-flex min-h-14 min-w-[10rem] items-center justify-center rounded-full bg-primary px-10 text-base font-semibold text-primary-foreground transition hover:opacity-90"
          />
          <EditableLinkInline
            blockType="cta"
            labelField="secondaryLabel"
            hrefField="secondaryHref"
            label={block.data.secondaryLabel}
            href={block.data.secondaryHref}
            buttonVariant="outline"
            className="inline-flex min-h-14 min-w-[10rem] items-center justify-center rounded-full border-2 border-primary-foreground/30 bg-transparent px-10 text-base font-semibold text-foreground transition hover:bg-muted"
          />
        </div>
      </div>
    </section>
  )
}
