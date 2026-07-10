"use client"

import type { TestimonialsBlock } from "@wse/core/features/homepage-cms/types/block-types"
import { EditableHeading } from "@wse/core/features/homepage-cms/components/primitives/EditableHeading"
import { EditableText } from "@wse/core/features/homepage-cms/components/primitives/EditableText"

type Props = {
  block: TestimonialsBlock
  onPatch: (field: keyof TestimonialsBlock["data"], value: unknown) => void
}

export function TestimonialsBlockEditor({ block, onPatch }: Props) {
  const items = Array.isArray(block.data.items) ? block.data.items : []
  return (
    <section className="py-16 border-b border-border/40 bg-muted/20">
      <div className="container mx-auto px-4 space-y-4">
        <EditableHeading value={block.data.title} onChange={(value) => onPatch("title", value)} editMode className="text-3xl text-white font-black" />
        <EditableText value={block.data.subtitle} onChange={(value) => onPatch("subtitle", value)} editMode className="text-neutral-400" />
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Vélemények</p>
          {items.map((item, index) => (
            <div key={`testimonial-${index}`} className="grid md:grid-cols-4 gap-2 rounded-lg bg-muted/40 p-3 ring-1 ring-border/40">
              <input
                value={item.name}
                onChange={(event) =>
                  onPatch(
                    "items",
                    items.map((current, idx) => (idx === index ? { ...current, name: event.target.value } : current))
                  )
                }
                className="h-9 w-full rounded-md border-0 bg-background/90 px-3 text-sm text-foreground ring-1 ring-border/60"
                placeholder="Név"
              />
              <input
                value={item.role}
                onChange={(event) =>
                  onPatch(
                    "items",
                    items.map((current, idx) => (idx === index ? { ...current, role: event.target.value } : current))
                  )
                }
                className="h-9 w-full rounded-md border-0 bg-background/90 px-3 text-sm text-foreground ring-1 ring-border/60"
                placeholder="Szerepkör"
              />
              <input
                value={item.sourceUrl ?? ""}
                onChange={(event) =>
                  onPatch(
                    "items",
                    items.map((current, idx) =>
                      idx === index ? { ...current, sourceUrl: event.target.value } : current
                    )
                  )
                }
                className="h-9 w-full rounded-md border-0 bg-background/90 px-3 text-sm text-foreground ring-1 ring-border/60 md:col-span-2"
                placeholder="Forrás URL (opcionális)"
              />
              <input
                value={item.quote}
                onChange={(event) =>
                  onPatch(
                    "items",
                    items.map((current, idx) => (idx === index ? { ...current, quote: event.target.value } : current))
                  )
                }
                className="h-9 w-full rounded-md border-0 bg-background/90 px-3 text-sm text-foreground ring-1 ring-border/60 md:col-span-4"
                placeholder="Idézet"
              />
              <div className="flex gap-2 md:col-span-4">
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={item.rating}
                  onChange={(event) =>
                    onPatch(
                      "items",
                      items.map((current, idx) =>
                        idx === index ? { ...current, rating: Math.max(1, Math.min(5, Number(event.target.value) || 1)) } : current
                      )
                    )
                  }
                  className="h-9 w-24 rounded-md border-0 bg-background/90 px-3 text-sm text-foreground ring-1 ring-border/60"
                />
                <button
                  type="button"
                  onClick={() => onPatch("items", items.filter((_, idx) => idx !== index))}
                  className="inline-flex h-9 items-center rounded-md px-3 text-xs font-medium text-destructive ring-1 ring-destructive/40"
                >
                  Törlés
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onPatch("items", [...items, { quote: "Vásárlói idézet", name: "Vásárló", role: "Szerepkör", sourceUrl: "", rating: 5 }])}
            className="inline-flex h-9 items-center rounded-md bg-background px-3 text-xs font-medium text-foreground ring-1 ring-border/60"
          >
            Vélemény hozzáadása
          </button>
        </div>
      </div>
    </section>
  )
}
