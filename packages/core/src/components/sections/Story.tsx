"use client"

import * as React from "react"
import { Reveal, REVEAL_STAGGER_MS } from "@wse/core/components/motion/css-reveal"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@wse/core/components/ui/accordion"
import { useCmsEdit } from "@wse/core/features/homepage-cms/components/editor/cms-edit-context"
import { EditableTextInline } from "@wse/core/features/homepage-cms/components/primitives/EditableTextInline"
import { EditableListInline } from "@wse/core/features/homepage-cms/components/primitives/EditableListInline"
import { Button } from "@wse/core/components/ui/button"
import { cn } from "@wse/core/lib/utils"
import { DynamicLucideIcon, IconPicker } from "@wse/core/features/homepage-cms/components/primitives/IconPicker"
import { PlainTextWithLinks } from "@wse/core/lib/linkify-plain-text"
import { CmsEditableCard } from "@wse/core/features/template-cms/components/CmsEditableCard"
import {
  CmsListAddButton,
  CmsListItemToolbar,
  moveArrayItem,
} from "@wse/core/features/template-cms/primitives/CmsListItemToolbar"

interface StoryProps {
  title?: string
  content?: string
  accordions?: string | Array<{ title: string; content: string }>
  cards?: Array<{ title: string; description: string; icon?: string }>
}

export function Story({ title, content, accordions, cards }: StoryProps) {
  const displayCards = cards?.length
    ? cards
    : [
        { icon: "Shield", title: "LOREM", description: "Lorem ipsum dolor sit amet." },
        { icon: "Hammer", title: "IPSUM", description: "Consectetur adipiscing elit." },
        { icon: "Users", title: "DOLOR", description: "Sed do eiusmod tempor incididunt." },
        { icon: "Lightbulb", title: "AMET", description: "Ut labore et dolore magna aliqua." },
      ]
  const cms = useCmsEdit()
  const displayTitle = title ?? "LOREM IPSUM STORY"
  const displayContent = content ?? "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."

  const parsedAccordions = React.useMemo(() => {
    if (!accordions) return null
    if (Array.isArray(accordions)) return accordions.length > 0 ? accordions : null
    try {
      const parsed = JSON.parse(accordions)
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : null
    } catch (e) {
      return null
    }
  }, [accordions])

  const defaultAccordions = [
    {
      title: "LOREM IPSUM MISSION",
      content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
    },
    {
      title: "DOLOR SIT AMET",
      content: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris."
    },
    {
      title: "CONSECTETUR ELIT",
      content: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum."
    }
  ]

  const displayAccordions = parsedAccordions || defaultAccordions

  const patchAccordions = (next: Array<{ title: string; content: string }>) => {
    cms.updateField("about", "accordions", next)
  }

  const patchCards = (next: Array<{ title: string; description: string; icon?: string }>) => {
    cms.updateField("about", "cards", next)
  }

  const patchCard = (index: number, patch: Partial<{ title: string; description: string; icon?: string }>) => {
    patchCards(displayCards.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  return (
    <section id="about" className="py-32 bg-background-dark overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <Reveal>
            {cms.enabled ? (
              <div className="space-y-3">
                <EditableTextInline blockType="about" field="title" value={displayTitle} className="text-4xl md:text-7xl font-heading font-black text-foreground uppercase tracking-tighter" />
                <EditableTextInline blockType="about" field="paragraph" value={displayContent} multiline className="text-neutral-400 text-xl leading-relaxed max-w-xl" />
              </div>
            ) : (
              <>
                <h2 className="text-4xl md:text-7xl font-heading font-black mb-10 text-foreground uppercase tracking-tighter">
                  {displayTitle.includes("STORY") ? (
                    <>
                      LOREM <span className="text-primary-foreground">IPSUM STORY</span>
                    </>
                  ) : (
                    displayTitle
                  )}
                </h2>
                <p className="text-neutral-400 text-xl mb-12 leading-relaxed max-w-xl">
                  <PlainTextWithLinks text={displayContent} />
                </p>
              </>
            )}

            <Accordion type="single" collapsible className="w-full space-y-4">
              <EditableListInline
                blockType="about"
                field="accordions"
                items={displayAccordions}
                onCreateItem={() => ({ title: "Új lenyíló", content: "Új tartalom" })}
                onRenderItem={(item: any, index, helpers) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border-border/40 bg-surface/40 px-6 rounded-none">
                    <AccordionTrigger className="text-foreground hover:text-primary-foreground font-heading font-black uppercase tracking-widest text-left no-underline py-6">
                      {cms.enabled ? (
                        <EditableTextInline
                          blockType="about"
                          field="accordions"
                          value={item.title}
                          placeholder="Cím"
                          onCommit={(value) =>
                            patchAccordions(
                              displayAccordions.map((row, idx) =>
                                idx === index ? { ...row, title: value } : row
                              )
                            )
                          }
                          className="text-sm font-black uppercase tracking-widest"
                        />
                      ) : (
                        item.title
                      )}
                    </AccordionTrigger>
                    <AccordionContent className="text-neutral-400 text-lg leading-relaxed pb-6 whitespace-pre-wrap">
                      {cms.enabled ? (
                        <div className="space-y-2">
                          <EditableTextInline
                            blockType="about"
                            field="accordions"
                            value={item.content}
                            multiline
                            placeholder="Tartalom"
                            onCommit={(value) =>
                              patchAccordions(
                                displayAccordions.map((row, idx) =>
                                  idx === index ? { ...row, content: value } : row
                                )
                              )
                            }
                            className="text-sm text-neutral-400 min-h-20"
                          />
                          <Button type="button" size="xs" variant="destructive" onClick={helpers.remove}>
                            Törlés
                          </Button>
                        </div>
                      ) : (
                        <PlainTextWithLinks text={item.content} />
                      )}
                    </AccordionContent>
                  </AccordionItem>
                )}
              />
            </Accordion>
          </Reveal>

          {/* Cards with high-contrast blurs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {displayCards.map((item, i) => {
              return (
              <Reveal key={i} delayMs={i * REVEAL_STAGGER_MS}>
                <div className={cn(
                  "glass-card p-10 h-full flex flex-col items-center text-center group hover:border-primary-foreground/50 transition-all",
                  i % 2 === 1 ? "lg:mt-12" : ""
                )}>
                  <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-8 border border-border/40 group-hover:bg-primary/20 transition-all">
                    <div className="text-primary-foreground"><DynamicLucideIcon name={item.icon || "Shield"} className="w-10 h-10" /></div>
                  </div>
                  {cms.enabled ? (
                    <CmsEditableCard
                      className="w-full"
                      toolbar={
                        <CmsListItemToolbar
                          canMoveUp={i > 0}
                          canMoveDown={i < displayCards.length - 1}
                          onMoveUp={() => patchCards(moveArrayItem(displayCards, i, -1))}
                          onMoveDown={() => patchCards(moveArrayItem(displayCards, i, 1))}
                          onRemove={() => patchCards(displayCards.filter((_, idx) => idx !== i))}
                        />
                      }
                      footer={
                        <IconPicker
                          value={item.icon || "Shield"}
                          triggerLabel="Ikon választás"
                          onChange={(iconName) => patchCard(i, { icon: iconName })}
                        />
                      }
                    >
                      <EditableTextInline
                        blockType="about"
                        field="cards"
                        value={item.title}
                        placeholder="Cím"
                        onCommit={(value) => patchCard(i, { title: value })}
                        className="text-sm font-black uppercase tracking-widest text-center"
                      />
                      <EditableTextInline
                        blockType="about"
                        field="cards"
                        value={item.description}
                        multiline
                        placeholder="Leírás"
                        onCommit={(value) => patchCard(i, { description: value })}
                        className="text-sm text-neutral-500 min-h-16 text-center"
                      />
                    </CmsEditableCard>
                  ) : (
                    <>
                      <h3 className="text-foreground font-heading font-black mb-4 tracking-widest uppercase">{item.title}</h3>
                      <p className="text-neutral-500 text-sm leading-relaxed">
                        <PlainTextWithLinks text={item.description} />
                      </p>
                    </>
                  )}
                </div>
              </Reveal>
            )})}
          </div>
          {cms.enabled ? (
            <CmsListAddButton
              label="Kártya hozzáadása"
              onClick={() =>
                patchCards([...displayCards, { icon: "Shield", title: "Új kártya", description: "Új leírás" }])
              }
            />
          ) : null}
        </div>
      </div>
    </section>
  )
}
