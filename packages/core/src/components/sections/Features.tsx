"use client"

import * as React from "react"
import { Reveal, REVEAL_DURATION_MS, REVEAL_STAGGER_MS } from "@wse/core/components/motion/css-reveal"
import { useCmsEdit } from "@wse/core/features/homepage-cms/components/editor/cms-edit-context"
import { EditableTextInline } from "@wse/core/features/homepage-cms/components/primitives/EditableTextInline"
import { DynamicLucideIcon, IconPicker } from "@wse/core/features/homepage-cms/components/primitives/IconPicker"
import { CmsEditableCard } from "@wse/core/features/template-cms/components/CmsEditableCard"
import {
  CmsListAddButton,
  CmsListItemToolbar,
  moveArrayItem,
} from "@wse/core/features/template-cms/primitives/CmsListItemToolbar"

type FeatureCard = {
  title: string
  description: string
  icon?: string
}

const COLLAPSE_AT = 220

const defaultFeatures: FeatureCard[] = [
  { title: "Lorem Ipsum", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
  { title: "Dolor Sit", description: "Sed do eiusmod tempor incididunt ut labore et dolore magna." },
  { title: "Amet Consectetur", description: "Ut enim ad minim veniam, quis nostrud exercitation ullamco." },
  { title: "Adipiscing Elit", description: "Duis aute irure dolor in reprehenderit in voluptate velit." },
  { title: "Tempor Incididunt", description: "Excepteur sint occaecat cupidatat non proident." },
  { title: "Labore Magna", description: "Sunt in culpa qui officia deserunt mollit anim id est." },
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

  const patchCards = (next: FeatureCard[]) => {
    cms.updateField("features", "cards", next)
  }

  const patchCard = (index: number, patch: Partial<FeatureCard>) => {
    patchCards(displayFeatures.map((row, i) => (i === index ? { ...row, ...patch } : row)))
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
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[150px] rounded-full -mr-64 -mb-64 pointer-events-none" />

      <div className={embedded ? "relative z-10" : "container mx-auto px-6 relative z-10"}>
        <div className="text-center mb-24">
          <Reveal
            as="h2"
            className="text-4xl md:text-7xl font-heading font-black mb-6 text-foreground uppercase tracking-tighter"
          >
            {cms.enabled ? (
              <EditableTextInline
                blockType="features"
                field="title"
                value={title ?? "LOREM ADVANTAGE"}
                className="text-center text-4xl md:text-7xl font-heading font-black uppercase tracking-tighter"
              />
            ) : (
              title ?? "LOREM ADVANTAGE"
            )}
          </Reveal>
          {cms.enabled ? (
            <EditableTextInline
              blockType="features"
              field="subtitle"
              value={subtitle ?? ""}
              className="text-neutral-400 text-lg max-w-2xl mx-auto text-center"
            />
          ) : subtitle ? (
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto">{subtitle}</p>
          ) : null}
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
              {cms.enabled ? (
                <CmsEditableCard
                  className="group"
                  toolbar={
                    <CmsListItemToolbar
                      canMoveUp={idx > 0}
                      canMoveDown={idx < displayFeatures.length - 1}
                      onMoveUp={() => patchCards(moveArrayItem(displayFeatures, idx, -1))}
                      onMoveDown={() => patchCards(moveArrayItem(displayFeatures, idx, 1))}
                      onRemove={() => patchCards(displayFeatures.filter((_, i) => i !== idx))}
                    />
                  }
                  footer={
                    <IconPicker
                      value={feature.icon || "Zap"}
                      triggerLabel="Ikon választás"
                      onChange={(iconName) => patchCard(idx, { icon: iconName })}
                    />
                  }
                >
                  <div className="text-primary-foreground mb-8 group-hover:scale-110 transition-transform duration-500 origin-left">
                    <DynamicLucideIcon name={feature.icon || "Zap"} className="w-10 h-10" />
                  </div>
                  <h3 className="text-foreground text-2xl font-heading font-black mb-4 tracking-tight uppercase group-hover:text-primary-foreground transition-colors">
                    <EditableTextInline
                      blockType="features"
                      field="cards"
                      value={feature.title}
                      placeholder="Cím"
                      onCommit={(value) => patchCard(idx, { title: value })}
                      className="text-2xl font-heading font-black uppercase tracking-tight"
                    />
                  </h3>
                  <EditableTextInline
                    blockType="features"
                    field="cards"
                    value={feature.description}
                    multiline
                    placeholder="Leírás"
                    onCommit={(value) => patchCard(idx, { description: value })}
                    className="text-base text-neutral-400 min-h-20"
                  />
                </CmsEditableCard>
              ) : (
                <>
                  <div className="text-primary-foreground mb-8 group-hover:scale-110 transition-transform duration-500 origin-left">
                    <DynamicLucideIcon name={feature.icon || "Zap"} className="w-10 h-10" />
                  </div>
                  <h3 className="text-foreground text-2xl font-heading font-black mb-4 tracking-tight uppercase group-hover:text-primary-foreground transition-colors">
                    {feature.title}
                  </h3>
                  <FeatureCardDescription text={feature.description} />
                </>
              )}
            </Reveal>
          ))}
        </div>

        {cms.enabled ? (
          <div className="mt-8">
            <CmsListAddButton
              label="Kártya hozzáadása"
              onClick={() =>
                patchCards([...displayFeatures, { title: "Új kártya", description: "Új leírás", icon: "Zap" }])
              }
            />
          </div>
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
        <button
          type="button"
          className="text-sm font-medium text-primary-foreground hover:underline"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Kevesebb" : "Teljes szöveg"}
        </button>
      ) : null}
    </div>
  )
}
