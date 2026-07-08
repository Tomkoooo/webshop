import { ResolvedTemplateProductDetail } from "@wse/core/components/shop/ResolvedTemplateProductDetail"
import type { RenderProps, PdpPageDeps } from "@wse/sdk/templates/types"
import type { PdpContent } from "./schema"

function trimEditorial(e: PdpContent["editorial"]) {
  const has =
    e.eyebrow?.trim() ||
    e.title?.trim() ||
    e.body?.trim() ||
    e.highlights?.some((h) => h.label?.trim() || h.detail?.trim()) ||
    e.supportTitle?.trim() ||
    e.supportBody?.trim() ||
    e.faq?.some((f) => f.question?.trim() && f.answer?.trim()) ||
    e.ctaLabel?.trim() ||
    e.addedLabel?.trim()
  if (!has) return undefined
  return {
    eyebrow: e.eyebrow || undefined,
    title: e.title || undefined,
    body: e.body || undefined,
    highlights: e.highlights?.filter((h) => h.label || h.detail),
    supportTitle: e.supportTitle || undefined,
    supportBody: e.supportBody || undefined,
    faq: e.faq?.filter((f) => f.question?.trim() && f.answer?.trim()),
    ctaLabel: e.ctaLabel || undefined,
    addedLabel: e.addedLabel || undefined,
  }
}

export function PdpRender({ content, deps }: RenderProps<PdpContent, PdpPageDeps>) {
  const trimmed = trimEditorial(content.editorial)
  const editorial = {
    ...(trimmed ?? {}),
    ctaLabel: trimmed?.ctaLabel?.trim() || content.ctaLabel,
    addedLabel: trimmed?.addedLabel?.trim() || undefined,
  }
  return (
    <ResolvedTemplateProductDetail
      templateId={deps.templateId}
      product={deps.product}
      initialVariantId={deps.selectedVariantId}
      shopEnabled={deps.shopEnabled}
      editorial={editorial}
      introPlacement={content.introPlacement}
    />
  )
}

