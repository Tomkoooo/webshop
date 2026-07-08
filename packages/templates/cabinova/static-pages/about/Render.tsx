"use client"

import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { Reveal, REVEAL_STAGGER_MS } from "@wse/core/components/motion/css-reveal"
import { EditableDocText } from "@wse/core/features/template-cms/primitives/EditableDocText"
import { EditableDocRichText } from "@wse/core/features/template-cms/primitives/EditableDocRichText"
import { useSurfaceDocEdit } from "@wse/core/features/template-cms/surface-doc-edit-context"
import { mediaImageSrc } from "@wse/core/lib/images"
import { cn } from "@wse/core/lib/utils"
import { Button } from "@wse/core/components/ui/button"
import { CabinovaHeadline } from "../../components/CabinovaMotion"
import type { RenderProps, StaticPageDeps } from "@wse/sdk/templates/types"
import type { AboutContent } from "./schema"

export function AboutRender({ content }: RenderProps<AboutContent, StaticPageDeps>) {
  const cms = useSurfaceDocEdit()
  const sectionSlots = cms.enabled
    ? Array.from({ length: Math.max(2, content.sections.length) }, (_, i) => i)
    : content.sections.map((_, i) => i)

  return (
    <div className="cabinova-root pb-32 pt-28 md:pt-40">
      <section className="border-b border-border pb-16 md:pb-24">
        <div className="cabinova-page">
          <Reveal>
            <p className="cabinova-eyebrow mb-6">Studio — Est. 2014</p>
          </Reveal>
          <h1 className="font-[family-name:var(--font-display)] text-5xl md:text-7xl lg:text-[clamp(3rem,9vw,7rem)] leading-[0.95] tracking-[-0.04em] max-w-5xl">
            <CabinovaHeadline text={content.hero.title} as="span" />
          </h1>
          {(content.hero.subtitle || cms.enabled) && (
            <Reveal delayMs={REVEAL_STAGGER_MS}>
              <p className="mt-10 max-w-xl text-lg text-muted-foreground leading-relaxed">
                <EditableDocText path="hero.subtitle" value={content.hero.subtitle} multiline />
              </p>
            </Reveal>
          )}
        </div>
      </section>

      {content.hero.image || cms.enabled ? (
        <section className="cabinova-page py-16">
          <Reveal>
            <div className="relative aspect-[16/10] overflow-hidden">
              {content.hero.image ? (
                <FallbackImage src={mediaImageSrc(content.hero.image)} alt="" fill className="object-cover" />
              ) : null}
            </div>
          </Reveal>
        </section>
      ) : null}

      <div className="cabinova-page space-y-24 py-12">
        {cms.enabled ? (
          <div className="flex flex-wrap gap-2 border-b border-border pb-6">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                cms.setPath("sections", [
                  ...content.sections,
                  { heading: "New section", body: "<p></p>", image: "", layout: "imageRight" as const },
                ])
              }
            >
              Add section
            </Button>
          </div>
        ) : null}

        {sectionSlots.map((idx) => {
          const s = content.sections[idx] ?? { heading: "", body: "", image: "", layout: "imageRight" as const }
          if (!cms.enabled && !s.heading?.trim() && !s.body?.trim()) return null
          const layout = s.layout ?? "imageRight"
          return (
            <Reveal key={idx} delayMs={idx * 80}>
              <div
                className={cn(
                  "grid gap-12 md:grid-cols-2 md:items-center",
                  layout === "imageLeft" && "md:[&>*:first-child]:order-2"
                )}
              >
                <div className="space-y-4">
                  <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl tracking-tight">
                    <EditableDocText path={`sections.${idx}.heading`} value={s.heading} />
                  </h2>
                  <div className="prose prose-neutral max-w-none text-muted-foreground">
                    <EditableDocRichText path={`sections.${idx}.body`} html={s.body || "<p></p>"} />
                  </div>
                </div>
                {(s.image || cms.enabled) && (
                  <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                    {s.image ? (
                      <FallbackImage src={mediaImageSrc(s.image)} alt="" fill className="object-cover" />
                    ) : null}
                  </div>
                )}
              </div>
            </Reveal>
          )
        })}
      </div>
    </div>
  )
}
