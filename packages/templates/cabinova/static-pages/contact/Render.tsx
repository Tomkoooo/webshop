"use client"

import { ContactInquiryForm } from "@wse/core/components/site-contact/ContactInquiryForm"
import { Reveal, REVEAL_STAGGER_MS } from "@wse/core/components/motion/css-reveal"
import { EditableDocText } from "@wse/core/features/template-cms/primitives/EditableDocText"
import { useSurfaceDocEdit } from "@wse/core/features/template-cms/surface-doc-edit-context"
import { CabinovaHeadline } from "../../components/CabinovaMotion"
import type { RenderProps, StaticPageDeps } from "@wse/sdk/templates/types"
import type { ContactContent } from "./schema"

export function ContactRender({ content, deps }: RenderProps<ContactContent, StaticPageDeps>) {
  const cms = useSurfaceDocEdit()
  const emails = deps.contactEmails ?? []

  return (
    <div className="cabinova-root pb-32 pt-28 md:pt-40">
      <section className="border-b border-border pb-16 md:pb-24">
        <div className="cabinova-page">
          <Reveal>
            <p className="cabinova-eyebrow mb-6">
              <EditableDocText path="hero.eyebrow" value={content.hero.eyebrow} />
            </p>
          </Reveal>
          <h1 className="font-[family-name:var(--font-display)] text-5xl md:text-7xl lg:text-[clamp(3rem,9vw,7rem)] leading-[0.95] tracking-[-0.04em] max-w-5xl">
            <CabinovaHeadline text={content.hero.title} as="span" />
          </h1>
          <Reveal delayMs={REVEAL_STAGGER_MS}>
            <p className="mt-10 max-w-xl text-lg text-muted-foreground leading-relaxed">
              <EditableDocText path="hero.subtitle" value={content.hero.subtitle} multiline />
            </p>
          </Reveal>
        </div>
      </section>

      <section className="py-24 md:py-32">
        <div className="cabinova-page grid md:grid-cols-12 gap-12 lg:gap-20">
          <Reveal className="md:col-span-4 space-y-10">
            <div>
              <p className="cabinova-eyebrow mb-4">
                <EditableDocText path="studioTitle" value={content.studioTitle} />
              </p>
              {content.studioLines.map((line, i) => (
                <p key={i} className="text-lg">
                  <EditableDocText path={`studioLines.${i}`} value={line} />
                </p>
              ))}
              <p className="text-muted-foreground mt-2 text-sm">
                <EditableDocText path="studioNote" value={content.studioNote} />
              </p>
            </div>
            <div>
              <p className="cabinova-eyebrow mb-4">Direct</p>
              <EditableDocText path="directEmail" value={content.directEmail} />
              <p className="text-muted-foreground mt-3 text-sm">
                <EditableDocText path="directPhone" value={content.directPhone} />
              </p>
            </div>
            <div>
              <p className="cabinova-eyebrow mb-4">
                <EditableDocText path="openingLabel" value={content.openingLabel} />
              </p>
              <p className="font-[family-name:var(--font-display)] text-4xl text-accent">
                <EditableDocText path="openingValue" value={content.openingValue} />
              </p>
              <p className="text-muted-foreground mt-2 text-sm max-w-[28ch]">
                <EditableDocText path="openingNote" value={content.openingNote} multiline />
              </p>
            </div>
          </Reveal>
          <div className="md:col-span-8">
            <ContactInquiryForm
              contactEmails={emails}
              nameLabel={content.nameLabel}
              emailLabel={content.emailLabel}
              messageLabel={content.messageLabel}
              sendButtonLabel={content.sendButtonLabel}
              cmsSendButton={
                cms.enabled
                  ? {
                      enabled: true,
                      onLabelCommit: (value) => cms.setPath("sendButtonLabel", value),
                    }
                  : undefined
              }
            />
          </div>
        </div>
      </section>
    </div>
  )
}
