import type { FeaturesBlock } from "@wse/core/features/homepage-cms/types/block-types"
import { Award, Hammer, Lightbulb, Shield, Star, Users } from "lucide-react"

const ICON_MAP = { Shield, Hammer, Users, Lightbulb, Star, Award } as const

export function FeaturesBlockView({ block }: { block: FeaturesBlock }) {
  return (
    <section className="border-b border-border bg-background py-20">
      <div className="container mx-auto space-y-8 px-4">
        <h2 className="text-3xl font-black text-foreground">{block.data.title}</h2>
        <p className="text-muted-foreground">{block.data.subtitle}</p>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {block.data.cards.map((card, idx) => {
            const Icon = card.icon && card.icon in ICON_MAP ? ICON_MAP[card.icon as keyof typeof ICON_MAP] : null
            return (
              <article key={idx} className="border border-border bg-muted/30 p-4">
                {Icon ? <Icon className="mb-2 h-5 w-5 text-primary-foreground" /> : null}
                <h3 className="font-bold text-foreground">{card.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{card.description}</p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
