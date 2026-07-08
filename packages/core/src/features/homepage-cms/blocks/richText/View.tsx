import type { RichTextBlock } from "@wse/core/features/homepage-cms/types/block-types"

export function RichTextBlockView({ block }: { block: RichTextBlock }) {
  return (
    <section className="border-b border-border bg-background py-20">
      <div className="container mx-auto space-y-4 px-4">
        <h2 className="text-3xl font-black text-foreground">{block.data.title}</h2>
        <div
          className="prose prose-neutral max-w-none text-foreground prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary-foreground"
          dangerouslySetInnerHTML={{ __html: block.data.html }}
        />
      </div>
    </section>
  )
}
