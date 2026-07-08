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
    <section className="py-20 border-b border-white/10 bg-black/20">
      <div className="container mx-auto px-4 space-y-4">
        <EditableHeading value={block.data.title} onChange={(value) => onPatch("title", value)} editMode className="text-3xl text-white font-black" />
        <EditableText value={block.data.subtitle} onChange={(value) => onPatch("subtitle", value)} editMode className="text-neutral-400" />
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-neutral-400">Vélemények</p>
          {items.map((item, index) => (
            <div key={`testimonial-${index}`} className="grid md:grid-cols-4 gap-2 border border-white/10 p-3">
              <input
                value={item.name}
                onChange={(event) =>
                  onPatch(
                    "items",
                    items.map((current, idx) => (idx === index ? { ...current, name: event.target.value } : current))
                  )
                }
                className="h-9 px-2 bg-black border border-white/20 text-sm text-white"
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
                className="h-9 px-2 bg-black border border-white/20 text-sm text-white"
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
                className="h-9 px-2 bg-black border border-white/20 text-sm text-white md:col-span-2"
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
                className="h-9 px-2 bg-black border border-white/20 text-sm text-white md:col-span-4"
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
                  className="h-9 w-24 px-2 bg-black border border-white/20 text-sm text-white"
                />
                <button
                  type="button"
                  onClick={() => onPatch("items", items.filter((_, idx) => idx !== index))}
                  className="px-3 h-9 border border-red-500/60 text-red-200 text-xs uppercase"
                >
                  Törlés
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onPatch("items", [...items, { quote: "Vásárlói idézet", name: "Vásárló", role: "Szerepkör", sourceUrl: "", rating: 5 }])}
            className="px-3 h-9 border border-white/20 text-white text-xs uppercase"
          >
            Vélemény hozzáadása
          </button>
        </div>
      </div>
    </section>
  )
}
