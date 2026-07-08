"use client"

import Link from "next/link"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { mediaImageSrc } from "@wse/core/lib/images"
import type { RenderProps, StaticPageDeps } from "@wse/sdk/templates/types"
import type { AboutContent } from "./schema"
import { EditableDocText } from "@wse/core/features/template-cms/primitives/EditableDocText"
import { useSurfaceDocEdit } from "@wse/core/features/template-cms/surface-doc-edit-context"

export function AboutRender({ content }: RenderProps<AboutContent, StaticPageDeps>) {
  const cms = useSurfaceDocEdit()
  return (
    <main className="bg-background-dark text-white">
      <section className="border-b border-white/10 pt-32 pb-20">
        <div className="container mx-auto grid gap-12 px-4 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight">
              <EditableDocText path="hero.title" value={content.hero.title} className="uppercase" />
            </h1>
            {(content.hero.subtitle || cms.enabled) && (
              <p className="max-w-xl text-lg text-neutral-300">
                <EditableDocText path="hero.subtitle" value={content.hero.subtitle} multiline />
              </p>
            )}
          </div>
          {content.hero.image ? (
            <div className="relative aspect-[4/3] overflow-hidden border border-white/10 bg-black/30">
              <FallbackImage
                src={content.hero.image}
                alt={content.hero.title}
                fill
                className="object-cover"
              />
            </div>
          ) : null}
        </div>
      </section>

      {(content.story.paragraphs.length > 0 || cms.enabled) ? (
        <section className="border-b border-white/10 py-20">
          <div className="container mx-auto max-w-3xl space-y-6 px-4">
            <h2 className="text-3xl font-black uppercase tracking-tight">
              <EditableDocText path="story.heading" value={content.story.heading} className="uppercase" />
            </h2>
            {content.story.paragraphs.map((paragraph, idx) => (
              <p key={idx} className="text-neutral-300 leading-relaxed">
                <EditableDocText path={`story.paragraphs.${idx}`} value={paragraph} multiline />
              </p>
            ))}
          </div>
        </section>
      ) : null}

      {(content.highlights.length > 0 || cms.enabled) ? (
        <section className="border-b border-white/10 py-20">
          <div className="container mx-auto grid gap-8 px-4 md:grid-cols-3">
            {(cms.enabled ? [0, 1, 2] : content.highlights.map((_, idx) => idx)).map((idx) => {
              const h = content.highlights[idx] ?? { title: "", body: "" }
              if (!cms.enabled && !(h.title?.trim() || h.body?.trim())) return null
              return (
                <div key={idx} className="space-y-3 border border-white/10 bg-white/5 p-6">
                  <p className="font-mono text-xs text-primary-foreground">
                    0{idx + 1}
                  </p>
                  <p className="text-lg font-black uppercase tracking-tight">
                    <EditableDocText path={`highlights.${idx}.title`} value={h.title} />
                  </p>
                  <p className="text-sm text-neutral-400">
                    <EditableDocText path={`highlights.${idx}.body`} value={h.body} multiline />
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      ) : null}

      {(content.team.length > 0 || cms.enabled) ? (
        <section className="border-b border-white/10 py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-10 text-3xl font-black uppercase tracking-tight">A csapat</h2>
            <div className="grid gap-8 md:grid-cols-3 lg:grid-cols-4">
              {(cms.enabled ? [0, 1] : content.team.map((_, idx) => idx)).map((idx) => {
                const member = content.team[idx] ?? { name: "", role: "", photo: "" }
                if (!cms.enabled && !member.name.trim() && !member.role.trim()) return null
                return (
                  <div key={idx} className="space-y-3">
                    {member.photo ? (
                      <div className="relative aspect-square overflow-hidden border border-white/10 bg-black/30">
                        <FallbackImage
                          src={mediaImageSrc(member.photo)}
                          alt={member.name || "Tag"}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : null}
                    <p className="text-sm font-black uppercase tracking-widest">
                      <EditableDocText path={`team.${idx}.name`} value={member.name} />
                    </p>
                    <p className="text-xs text-neutral-500 uppercase tracking-widest">
                      <EditableDocText path={`team.${idx}.role`} value={member.role} />
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      ) : null}

      {(content.cta.label || cms.enabled) ? (
        <section className="py-20 text-center">
          {cms.enabled ? (
            <div className="inline-flex items-center justify-center bg-primary px-8 py-4 text-sm font-black uppercase tracking-widest text-white">
              <EditableDocText path="cta.label" value={content.cta.label} placeholder="CTA felirat" />
            </div>
          ) : (
            <Link
              href={content.cta.href}
              className="inline-flex items-center justify-center bg-primary px-8 py-4 text-sm font-black uppercase tracking-widest text-white"
            >
              {content.cta.label}
            </Link>
          )}
        </section>
      ) : null}
    </main>
  )
}
