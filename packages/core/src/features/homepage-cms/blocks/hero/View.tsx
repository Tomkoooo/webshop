import type { HeroBlock } from "@wse/core/features/homepage-cms/types/block-types"
import Link from "next/link"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { useCmsEdit } from "@wse/core/features/homepage-cms/components/editor/cms-edit-context"
import { EditableTextInline } from "@wse/core/features/homepage-cms/components/primitives/EditableTextInline"

export function HeroBlockView({ block }: { block: HeroBlock }) {
  const cms = useCmsEdit()
  return (
    <section className="border-b border-border bg-background py-20 md:py-24">
      <div className="container mx-auto space-y-6 px-4 text-center">
        <div className="relative mx-auto aspect-21/9 max-h-[min(52vh,420px)] w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-muted">
          <FallbackImage
            src={block.data.heroImage}
            alt={block.data.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
          {cms.enabled ? (
            <EditableTextInline blockType="hero" field="title" value={block.data.title} />
          ) : (
            block.data.title
          )}
        </h1>
        <div className="mx-auto max-w-lg text-sm text-muted-foreground md:text-base">
          {cms.enabled ? (
            <EditableTextInline
              blockType="hero"
              field="description"
              value={block.data.description}
              multiline
            />
          ) : (
            block.data.description
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href={block.data.primaryCtaHref || "/shop"}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            {cms.enabled ? (
              <EditableTextInline blockType="hero" field="primaryCtaLabel" value={block.data.primaryCtaLabel} />
            ) : (
              block.data.primaryCtaLabel
            )}
          </Link>
          <Link
            href={block.data.secondaryCtaHref || "/shop"}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-background px-8 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            {cms.enabled ? (
              <EditableTextInline
                blockType="hero"
                field="secondaryCtaLabel"
                value={block.data.secondaryCtaLabel}
              />
            ) : (
              block.data.secondaryCtaLabel
            )}
          </Link>
        </div>
      </div>
    </section>
  )
}
