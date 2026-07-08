import type { AboutBlock } from "@wse/core/features/homepage-cms/types/block-types"
import { Award, Hammer, Lightbulb, Shield, Star, Users } from "lucide-react"

const ICON_MAP = { Shield, Hammer, Users, Lightbulb, Star, Award } as const

export function AboutBlockView({ block }: { block: AboutBlock }) {
  return (
    <section id="about" className="border-b border-border bg-background py-20">
      <div className="container mx-auto space-y-8 px-4">
        <h2 className="text-3xl font-black text-foreground">{block.data.title}</h2>
        <p className="text-muted-foreground">{block.data.paragraph}</p>
        <div className="space-y-2">
          {block.data.accordions.map((item, index) => (
            <details
              key={`${item.title}-${index}`}
              className="border border-border bg-muted/40 p-3"
            >
              <summary className="cursor-pointer text-foreground">{item.title}</summary>
              <p className="mt-2 text-muted-foreground">{item.content}</p>
            </details>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {block.data.cards.map((item, index) => {
            const Icon = item.icon && item.icon in ICON_MAP ? ICON_MAP[item.icon as keyof typeof ICON_MAP] : null
            return (
              <article
                key={`${item.title}-${index}`}
                className="space-y-2 border border-border bg-muted/30 p-4"
              >
                {Icon ? <Icon className="h-5 w-5 text-primary-foreground" /> : null}
                <h3 className="font-bold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
