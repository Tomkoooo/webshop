"use client"

import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { StorefrontRichHtml } from "@wse/core/components/common/StorefrontRichHtml"
import { Reveal, REVEAL_STAGGER_MS } from "@wse/core/components/motion/css-reveal"
import { EditableDocText } from "@wse/core/features/template-cms/primitives/EditableDocText"
import { EditableDocLink } from "@wse/core/features/template-cms/primitives/EditableDocLink"
import { useSurfaceDocEdit } from "@wse/core/features/template-cms/surface-doc-edit-context"
import { plainTextFromHtml } from "@wse/core/lib/plain-text-from-html"
import { mediaImageSrc } from "@wse/core/lib/images"
import { CabinovaHeadline } from "../components/CabinovaMotion"
import { CabinovaProductGallery } from "./CabinovaProductGallery"
import type { PdpContent } from "../pages/pdp/schema"

type StorefrontProduct = {
  _id?: { toString(): string }
  name: string
  slug: string
  description?: string
  images?: string[]
  displayMinGrossPrice?: number
  grossPrice?: number
}

function formatPrice(product: StorefrontProduct): string {
  const value = product.displayMinGrossPrice ?? product.grossPrice
  if (value == null) return ""
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value)
}

export function CabinovaProductDetail({
  product: rawProduct,
  content,
}: {
  product: unknown
  content: PdpContent
  initialVariantId?: string
  shopEnabled?: boolean
}) {
  const cms = useSurfaceDocEdit()
  const product = rawProduct as StorefrontProduct
  const productImages = (product.images ?? []).filter((img) => Boolean(img?.trim()))
  const heroImage = productImages[0] ?? "/template-assets/cabinova/hero-forest.jpg"
  const detailImage =
    content.detailImage?.trim() ||
    productImages[1] ||
    productImages[0] ||
    "/template-assets/cabinova/detail-timber.jpg"
  const tagline = content.tagline?.trim() || product.name
  const productDescriptionHtml = product.description?.trim() || ""
  const productDescriptionPlain = plainTextFromHtml(productDescriptionHtml)
  const cmsOverview = content.overviewBody?.trim() || ""
  const overviewPlain =
    cmsOverview ||
    productDescriptionPlain ||
    ""
  const showRichOverview = !cmsOverview && /<[^>]+>/.test(productDescriptionHtml)
  const eyebrow =
    content.heroEyebrow?.trim() ||
    [formatPrice(product) ? `From ${formatPrice(product)}` : "", product.slug].filter(Boolean).join(" · ")

  const specs = content.specs.map((s, i) => ({
    label: s.label,
    value:
      s.value?.trim() ||
      (i === 3 && formatPrice(product) ? formatPrice(product) : s.value),
  }))

  return (
    <div className="cabinova-root overflow-x-hidden">
      <section className="relative h-[100svh] overflow-hidden cabinova-grain">
        <FallbackImage
          src={mediaImageSrc(heroImage)}
          alt={product.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/30 via-transparent to-background" />
        <div className="absolute bottom-0 left-0 right-0 cabinova-page pb-16 z-10">
          <Reveal mode="mount" delayMs={200}>
            <p className="cabinova-eyebrow text-primary-foreground/80 mb-6">
              {cms.enabled ? (
                <EditableDocText path="heroEyebrow" value={content.heroEyebrow || eyebrow} />
              ) : (
                eyebrow
              )}
            </p>
          </Reveal>
          <Reveal mode="mount" delayMs={350}>
            <h1 className="font-[family-name:var(--font-display)] text-primary-foreground text-[clamp(3rem,12vw,12rem)] leading-[0.85] tracking-[-0.04em]">
              <CabinovaHeadline text={product.name} as="span" />
            </h1>
          </Reveal>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="cabinova-page py-24 md:py-40 grid md:grid-cols-12 gap-12">
          <Reveal className="md:col-span-4">
            <p className="cabinova-eyebrow">Overview</p>
          </Reveal>
          <Reveal delayMs={REVEAL_STAGGER_MS} className="md:col-span-8">
            <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl lg:text-6xl leading-[1.1] tracking-tight">
              {cms.enabled ? (
                <EditableDocText path="tagline" value={content.tagline || tagline} />
              ) : (
                tagline
              )}
            </h2>
            <div className="mt-10 text-lg text-muted-foreground leading-relaxed max-w-2xl">
              {cms.enabled ? (
                <EditableDocText path="overviewBody" value={content.overviewBody || overviewPlain} multiline />
              ) : showRichOverview ? (
                <StorefrontRichHtml html={productDescriptionHtml} />
              ) : overviewPlain ? (
                <p>{overviewPlain}</p>
              ) : null}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-surface border-b border-border">
        <div className="cabinova-page py-24">
          <Reveal>
            <p className="cabinova-eyebrow mb-12">Specification</p>
          </Reveal>
          <div className="grid md:grid-cols-4 gap-px bg-border">
            {specs.map((s, i) => (
              <Reveal key={s.label} delayMs={i * 80} className="bg-surface p-8">
                <div className="cabinova-eyebrow mb-4">
                  {cms.enabled ? (
                    <EditableDocText path={`specs.${i}.label`} value={s.label} />
                  ) : (
                    s.label
                  )}
                </div>
                <div className="font-[family-name:var(--font-display)] text-4xl md:text-5xl">
                  {cms.enabled ? (
                    <EditableDocText path={`specs.${i}.value`} value={s.value} />
                  ) : (
                    s.value
                  )}
                </div>
              </Reveal>
            ))}
          </div>

          {(content.materials.length > 0 || cms.enabled) && (
            <div className="mt-20 grid md:grid-cols-12 gap-12">
              <Reveal className="md:col-span-4">
                <p className="cabinova-eyebrow mb-6">Materials</p>
              </Reveal>
              <div className="md:col-span-8">
                <ul className="divide-y divide-border border-y border-border">
                  {(content.materials.length ? content.materials : ["Add materials in visual editor"]).map(
                    (m, i) => (
                      <Reveal key={`${m}-${i}`} delayMs={i * 60} as="li" className="py-6 flex items-baseline gap-6 list-none">
                        <span className="font-mono text-xs text-accent tracking-[0.2em]">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="font-[family-name:var(--font-display)] text-2xl md:text-3xl">
                          {cms.enabled ? (
                            <EditableDocText path={`materials.${i}`} value={m} />
                          ) : (
                            m
                          )}
                        </span>
                      </Reveal>
                    )
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>

      <CabinovaProductGallery productName={product.name} images={productImages} />

      {productImages.length < 2 ? (
        <section className="py-24 md:py-32">
          <div className="cabinova-page">
            <Reveal>
              <div className="relative aspect-[16/9] overflow-hidden">
                <FallbackImage
                  src={mediaImageSrc(detailImage)}
                  alt={`${product.name} detail`}
                  fill
                  className="object-cover"
                />
              </div>
              <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-accent">
                {cms.enabled ? (
                  <EditableDocText path="detailCaption" value={content.detailCaption || `Fig. — ${product.name}`} />
                ) : (
                  content.detailCaption || `Fig. — ${product.name}`
                )}
              </p>
            </Reveal>
          </div>
        </section>
      ) : null}

      <section className="bg-foreground text-background py-32 md:py-40 border-t border-border">
        <div className="cabinova-page grid md:grid-cols-2 gap-12 items-end">
          <Reveal>
            <h3 className="font-[family-name:var(--font-display)] text-5xl md:text-7xl tracking-tight leading-[0.95]">
              {cms.enabled ? (
                <EditableDocText path="ctaTitle" value={content.ctaTitle || `Reserve a build slot for ${product.name}.`} multiline />
              ) : (
                content.ctaTitle || (
                  <>
                    Reserve a build slot for <span className="italic text-accent">{product.name}.</span>
                  </>
                )
              )}
            </h3>
          </Reveal>
          <Reveal delayMs={REVEAL_STAGGER_MS}>
            <p className="text-background/70 leading-relaxed max-w-md">
              <EditableDocText path="ctaBody" value={content.ctaBody} multiline />
            </p>
            <EditableDocLink
              labelPath="ctaLabel"
              hrefPath="ctaHref"
              label={content.ctaLabel || "Begin a project"}
              href={content.ctaHref || "/contact"}
              className="mt-8 inline-block bg-background text-foreground px-10 py-5 text-sm uppercase tracking-[0.25em] hover:bg-accent hover:text-accent-foreground transition-colors duration-500"
            />
          </Reveal>
        </div>
      </section>
    </div>
  )
}
