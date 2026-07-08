import type { TestimonialsBlock } from "@wse/core/features/homepage-cms/types/block-types"

export function TestimonialsBlockView({ block }: { block: TestimonialsBlock }) {
  return (
    <section className="border-b border-border bg-background py-20">
      <div className="container mx-auto space-y-8 px-4">
        <h2 className="text-3xl font-black text-foreground">{block.data.title}</h2>
        <p className="text-muted-foreground">{block.data.subtitle}</p>
        <div className="grid gap-3 md:grid-cols-2">
          {block.data.items.map((item, idx) => (
            <article key={idx} className="border border-border bg-muted/30 p-4">
              <p className="text-foreground">&ldquo;{item.quote}&rdquo;</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {item.name} - {item.role}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
