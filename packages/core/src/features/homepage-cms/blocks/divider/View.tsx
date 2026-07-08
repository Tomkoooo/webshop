import type { DividerBlock } from "@wse/core/features/homepage-cms/types/block-types"

export function DividerBlockView({ block }: { block: DividerBlock }) {
  return (
    <section className="border-b border-border bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="h-px bg-border" />
        {block.data.label ? (
          <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">{block.data.label}</p>
        ) : null}
      </div>
    </section>
  )
}
