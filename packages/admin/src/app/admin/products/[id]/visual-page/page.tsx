import { createHash } from "crypto"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ProductService } from "@wse/core/services/product"
import { TemplateService } from "@wse/core/services/template"
import { BrandingSettingsService } from "@wse/core/services/branding-settings"
import { FooterSettingsService } from "@wse/core/services/footer-settings"
import { SeoSettingsService } from "@wse/core/services/seo-settings"
import { getEffectiveThemeBase, ThemeService } from "@wse/core/services/theme"
import { isShopEnabled } from "@wse/core/lib/features/shop"
import { getProductPdpDraft, productPdpPageKey, templateSupportsPerProductPdpCms } from "@wse/core/lib/product-page-content"
import { getHomepageRenderDependencies } from "@wse/core/features/homepage-cms/render/homepage-deps"
import { PdpVisualSurfaceEditor } from "@wse/core/features/template-cms/editors/PdpVisualSurfaceEditor"

export const dynamic = "force-dynamic"

function hydrationFingerprint(parts: unknown[]): string {
  const h = createHash("sha256")
  for (const p of parts) {
    h.update(JSON.stringify(p))
  }
  return h.digest("hex").slice(0, 22)
}

export default async function ProductVisualPageEditor({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  if (!isShopEnabled()) {
    redirect("/admin/products")
  }

  const { id } = await params
  const [product, template, dbActiveTemplate] = await Promise.all([
    ProductService.getById(id),
    TemplateService.getActive(),
    TemplateService.getDbActive(),
  ])

  if (!product) notFound()

  if (!templateSupportsPerProductPdpCms(template.manifest.capabilities)) {
    redirect(`/admin/products/${id}`)
  }

  const slug = String((product as { slug?: string }).slug ?? "")
  if (!slug) notFound()

  const pageKey = productPdpPageKey(slug)
  const [initialDraft, dependencies, branding, footer, seo, theme] = await Promise.all([
    getProductPdpDraft(template.manifest.id, slug),
    getHomepageRenderDependencies(),
    BrandingSettingsService.get(),
    FooterSettingsService.get(),
    SeoSettingsService.get(),
    ThemeService.getMergedForTemplate(dbActiveTemplate),
  ])

  const themeResetBaseline = getEffectiveThemeBase(dbActiveTemplate)
  const shopEnabled = isShopEnabled()
  const productName = String((product as { name?: string }).name ?? slug)
  const hydrationKey = hydrationFingerprint([template.manifest.id, pageKey, id, initialDraft])

  const pdpDeps = {
    product: JSON.parse(JSON.stringify(product)),
    selectedVariantId: undefined,
    shopEnabled,
    templateId: template.manifest.id,
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4">
        <Link
          href={`/admin/products/${id}`}
          className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white w-fit"
        >
          ← Termék szerkesztése
        </Link>
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">
            Vizuális oldal: {productName}
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            Termék: /products/{slug} · Piszkozat kulcs: {pageKey}
          </p>
        </div>
      </header>

      <PdpVisualSurfaceEditor
        hydrationKey={hydrationKey}
        templateId={template.manifest.id}
        shopEnabled={shopEnabled}
        pageKey={pageKey}
        initialDraft={initialDraft as never}
        pdpDeps={pdpDeps}
        branding={branding}
        footer={footer}
        seo={seo}
        theme={theme}
        themeResetBaseline={themeResetBaseline}
        homepageDeps={dependencies}
        editorTitle="Termék vizuális oldal"
        editorSubtitle={productName}
      />
    </div>
  )
}
