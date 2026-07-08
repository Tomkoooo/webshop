"use client"

import * as React from "react"
import { Reveal, REVEAL_DURATION_MS, REVEAL_STAGGER_MS } from "@wse/core/components/motion/css-reveal"
import { useCmsEdit } from "@wse/core/features/homepage-cms/components/editor/cms-edit-context"
import { EditableTextInline } from "@wse/core/features/homepage-cms/components/primitives/EditableTextInline"
import { Button } from "@wse/core/components/ui/button"
import { DynamicLucideIcon, IconPicker } from "@wse/core/features/homepage-cms/components/primitives/IconPicker"

type FeatureCard = {
  title: string
  description: string
  icon?: string
}

const COLLAPSE_AT = 220

const defaultFeatures: FeatureCard[] = [
  {
    title: "Lorem Ipsum",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
  },
  {
    title: "Dolor Sit",
    description: "Sed do eiusmod tempor incididunt ut labore et dolore magna."
  },
  {
    title: "Amet Consectetur",
    description: "Ut enim ad minim veniam, quis nostrud exercitation ullamco."
  },
  {
    title: "Adipiscing Elit",
    description: "Duis aute irure dolor in reprehenderit in voluptate velit."
  },
  {
    title: "Tempor Incididunt",
    description: "Excepteur sint occaecat cupidatat non proident."
  },
  {
    title: "Labore Magna",
    description: "Sunt in culpa qui officia deserunt mollit anim id est."
  }
]

export function Features({
  title,
  subtitle,
  cards,
  embedded = false,
}: {
  title?: string
  subtitle?: string
  cards?: FeatureCard[]
  embedded?: boolean
}) {
  const cms = useCmsEdit()
  const displayFeatures: FeatureCard[] = cards?.length ? cards : defaultFeatures
  const moveFeatureCard = (index: number, offset: -1 | 1) => {
    const nextIndex = index + offset
    if (nextIndex < 0 || nextIndex >= displayFeatures.length) return
    const nextCards = [...displayFeatures]
    const currentCard = nextCards[index]
    nextCards[index] = nextCards[nextIndex]
    nextCards[nextIndex] = currentCard
    cms.updateField("features", "cards", nextCards)
  }

  return (
    <section
      id="features"
      className={
        embedded
          ? "relative overflow-hidden border-y border-border/40 py-24"
          : "py-32 bg-background-dark relative overflow-hidden border-t border-border/40"
      }
    >
      {/* Accent blurs */}
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[150px] rounded-full -mr-64 -mb-64 pointer-events-none" />

      <div className={embedded ? "relative z-10" : "container mx-auto px-6 relative z-10"}>
        <div className="text-center mb-24">
          <Reveal
            as="h2"
            className="text-4xl md:text-7xl font-heading font-black mb-6 text-foreground uppercase tracking-tighter"
          >
            {cms.enabled ? (
              <EditableTextInline blockType="features" field="title" value={title ?? "LOREM ADVANTAGE"} className="text-4xl md:text-7xl font-heading font-black text-white uppercase tracking-tighter text-center" />
            ) : (
              title ?? "LOREM ADVANTAGE"
            )}
          </Reveal>
          {cms.enabled ? (
            <EditableTextInline blockType="features" field="subtitle" value={subtitle ?? ""} className="text-neutral-400 text-lg max-w-2xl mx-auto text-center" />
          ) : subtitle ? <p className="text-neutral-400 text-lg max-w-2xl mx-auto">{subtitle}</p> : null}
          <div className="w-24 h-2 bg-primary mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayFeatures.map((feature, idx) => (
            <Reveal
              key={idx}
              delayMs={idx * REVEAL_STAGGER_MS}
              durationMs={REVEAL_DURATION_MS}
              className="glass-card p-10 group hover:border-primary-foreground/40 transition-colors duration-500"
            >
              <div className="text-primary-foreground mb-8 group-hover:scale-110 transition-transform duration-500 origin-left">
                <DynamicLucideIcon name={feature.icon || "Zap"} className="w-10 h-10" />
              </div>
              <h3 className="text-foreground text-2xl font-heading font-black mb-4 tracking-tight uppercase group-hover:text-primary-foreground transition-colors">
                {cms.enabled ? (
                  <input
                    value={feature.title}
                    onChange={(event) =>
                      cms.updateField(
                        "features",
                        "cards",
                        displayFeatures.map((row, index) => (index === idx ? { ...row, title: event.target.value } : row))
                      )
                    }
                    className="h-8 w-full bg-black border border-white/20 px-2 text-white text-sm"
                  />
                ) : (
                  feature.title
                )}
              </h3>
              {cms.enabled ? (
                <div className="space-y-2">
                  <textarea
                    value={feature.description}
                    onChange={(event) =>
                      cms.updateField(
                        "features",
                        "cards",
                        displayFeatures.map((row, index) => (index === idx ? { ...row, description: event.target.value } : row))
                      )
                    }
                    className="w-full bg-black border border-white/20 px-2 py-1 text-sm text-white"
                  />
                  <IconPicker
                    value={feature.icon || "Zap"}
                    triggerLabel="Ikon választás"
                    onChange={(iconName) =>
                      cms.updateField(
                        "features",
                        "cards",
                        displayFeatures.map((row, index) => (index === idx ? { ...row, icon: iconName } : row))
                      )
                    }
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      disabled={idx === 0}
                      onClick={() => moveFeatureCard(idx, -1)}
                    >
                      Fel
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      disabled={idx === displayFeatures.length - 1}
                      onClick={() => moveFeatureCard(idx, 1)}
                    >
                      Le
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      variant="destructive"
                      onClick={() => cms.updateField("features", "cards", displayFeatures.filter((_, index) => index !== idx))}
                    >
                      Törlés
                    </Button>
                  </div>
                </div>
              ) : (
                <FeatureCardDescription text={feature.description} />
              )}
            </Reveal>
          ))}
        </div>
        {cms.enabled ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => cms.updateField("features", "cards", [...displayFeatures, { title: "Új kártya", description: "Új leírás" }])}
          >
            Kártya hozzáadása
          </Button>
        ) : null}
      </div>
    </section>
  )
}

function FeatureCardDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = React.useState(false)
  const shouldCollapse = text.length > COLLAPSE_AT
  const visibleText =
    shouldCollapse && !expanded ? `${text.slice(0, COLLAPSE_AT).trimEnd()}...` : text

  return (
    <div className="space-y-4">
      <p className="whitespace-pre-line text-base leading-relaxed text-neutral-400">{visibleText}</p>
      {shouldCollapse ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto px-0 text-primary-foreground hover:bg-transparent hover:text-primary"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Kevesebb" : "Teljes szöveg"}
        </Button>
      ) : null}
    </div>
  )
}
