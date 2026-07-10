"use client"

import type { FeaturesBlock } from "@wse/core/features/homepage-cms/types/block-types"
import { EditableHeading } from "@wse/core/features/homepage-cms/components/primitives/EditableHeading"
import { EditableText } from "@wse/core/features/homepage-cms/components/primitives/EditableText"

const ICON_OPTIONS = [
  "Star",
  "Zap",
  "Shield",
  "ShieldCheck",
  "Truck",
  "Heart",
  "Check",
  "Package",
  "Clock3",
  "Award",
  "ThumbsUp",
  "Sparkles",
]

type Props = {
  block: FeaturesBlock
  onPatch: (field: keyof FeaturesBlock["data"], value: unknown) => void
}

export function FeaturesBlockEditor({ block, onPatch }: Props) {
  const cards = Array.isArray(block.data.cards) ? block.data.cards : []
  const moveCard = (index: number, offset: -1 | 1) => {
    const nextIndex = index + offset
    if (nextIndex < 0 || nextIndex >= cards.length) return
    const nextCards = [...cards]
    const currentCard = nextCards[index]
    nextCards[index] = nextCards[nextIndex]
    nextCards[nextIndex] = currentCard
    onPatch("cards", nextCards)
  }

  return (
    <section className="py-16 border-b border-border/40 bg-muted/20">
      <div className="container mx-auto px-4 space-y-4">
        <EditableHeading value={block.data.title} onChange={(value) => onPatch("title", value)} editMode className="text-3xl text-white font-black" />
        <EditableText value={block.data.subtitle} onChange={(value) => onPatch("subtitle", value)} editMode className="text-neutral-400" />
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Előny kártyák</p>
          {cards.map((card, index) => (
            <div key={`feature-card-${index}`} className="grid md:grid-cols-4 gap-2 rounded-lg bg-muted/40 p-3 ring-1 ring-border/40">
              <input
                value={card.title}
                onChange={(event) =>
                  onPatch(
                    "cards",
                    cards.map((item, idx) => (idx === index ? { ...item, title: event.target.value } : item))
                  )
                }
                className="h-9 w-full rounded-md border-0 bg-background/90 px-3 text-sm text-foreground ring-1 ring-border/60"
                placeholder="Cím"
              />
              <input
                value={card.description}
                onChange={(event) =>
                  onPatch(
                    "cards",
                    cards.map((item, idx) => (idx === index ? { ...item, description: event.target.value } : item))
                  )
                }
                className="h-9 w-full rounded-md border-0 bg-background/90 px-3 text-sm text-foreground ring-1 ring-border/60 md:col-span-2"
                placeholder="Leírás"
              />
              <div className="flex gap-2">
                <select
                  value={card.icon ?? ""}
                  onChange={(event) =>
                    onPatch(
                      "cards",
                      cards.map((item, idx) => (idx === index ? { ...item, icon: event.target.value || undefined } : item))
                    )
                  }
                  className="flex-1 h-9 w-full rounded-md border-0 bg-background/90 px-3 text-sm text-foreground ring-1 ring-border/60"
                >
                  <option value="">Nincs ikon</option>
                  {ICON_OPTIONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => moveCard(index, -1)}
                  disabled={index === 0}
                  className="inline-flex h-9 items-center rounded-md bg-background px-3 text-xs font-medium text-foreground ring-1 ring-border/60 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Fel
                </button>
                <button
                  type="button"
                  onClick={() => moveCard(index, 1)}
                  disabled={index === cards.length - 1}
                  className="inline-flex h-9 items-center rounded-md bg-background px-3 text-xs font-medium text-foreground ring-1 ring-border/60 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Le
                </button>
                <button
                  type="button"
                  onClick={() => onPatch("cards", cards.filter((_, idx) => idx !== index))}
                  className="inline-flex h-9 items-center rounded-md px-3 text-xs font-medium text-destructive ring-1 ring-destructive/40"
                >
                  Törlés
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onPatch("cards", [...cards, { title: "Új előny", description: "Írd le röviden.", icon: "Star" }])}
            className="inline-flex h-9 items-center rounded-md bg-background px-3 text-xs font-medium text-foreground ring-1 ring-border/60"
          >
            Kártya hozzáadása
          </button>
        </div>
      </div>
    </section>
  )
}
