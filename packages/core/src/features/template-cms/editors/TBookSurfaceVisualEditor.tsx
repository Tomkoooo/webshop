"use client"

import type { ComponentType, ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DefaultModernVisualCmsChrome } from "@wse/core/features/template-cms/components/DefaultModernVisualCmsChrome"
import { CmsEditorSubtoolbar } from "@wse/core/features/template-cms/components/CmsEditorSubtoolbar"
import { CmsNavChromeSidebar } from "@wse/core/features/template-cms/components/CmsNavChromeSidebar"
import { CmsTBookPageSidebar } from "@wse/core/features/template-cms/components/CmsTBookPageSidebar"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { SurfaceDocEditProvider } from "@wse/core/features/template-cms/surface-doc-edit-context"
import { useUndoableJsonDocument } from "@wse/core/features/template-cms/hooks/use-undoable-json-document"
import { useSurfaceDraftPersistence } from "@wse/core/features/template-cms/hooks/use-surface-draft-persistence"
import { useTemplateModule } from "@wse/core/features/template-cms/hooks/use-template-module"
import { CmsEditorTemplateLoading } from "@wse/core/features/template-cms/components/CmsEditorTemplateLoading"
import { CmsEditorErrorState } from "@wse/core/features/template-cms/components/CmsEditorErrorState"
import {
  discardTemplatePageDraft,
  publishTemplatePageContent,
} from "@wse/core/features/template-cms/api/template-page-client-api"
import { getHomepageRenderDependencies } from "@wse/core/features/homepage-cms/render/homepage-deps"
import { adminFieldLabel } from "@wse/core/lib/admin-ui"
import { extractTBookHomeChrome, navCtaFromTBookChrome, navItemsFromTBookChrome, tickerTextFromTBookChrome } from "@wse/plugin-t-book/lib/storefront-chrome"
import type { TemplateModule } from "@wse/sdk/templates/types"
import type { FooterSettings } from "@wse/core/services/footer-settings"
import type { SeoSettings } from "@wse/core/services/seo-settings"
import type { ThemeTokens } from "@wse/core/services/theme"

type Branding = {
  brandName: string
  logoNav: string
  logoFooter: string
  logoHero: string
}

type HomepageDeps = Awaited<ReturnType<typeof getHomepageRenderDependencies>>

type TBookPageKey = keyof NonNullable<TemplateModule["tBookPages"]>

const TBOOK_PAGE_KEY_MAP: Record<string, TBookPageKey> = {
  "page:jegyek": "jegyek",
  "page:tbook-foglalas": "foglalas",
  "page:tbook-foglalas-siker": "foglalasSiker",
}

export function TBookSurfaceVisualEditor({
  hydrationKey,
  templateId,
  shopEnabled,
  pageKey,
  pageLabel,
  initialDraft,
  initialHomeDraft,
  branding,
  footer: initialFooter,
  seo,
  theme,
  themeResetBaseline,
  homepageDeps,
}: {
  hydrationKey: string
  templateId: string
  shopEnabled: boolean
  pageKey: string
  pageLabel: string
  initialDraft: Record<string, unknown>
  /** Published/draft home content — drives nav + Jegyek CTA in preview. */
  initialHomeDraft: Record<string, unknown>
  branding: Branding
  footer: FooterSettings
  seo: SeoSettings
  theme: ThemeTokens
  themeResetBaseline: ThemeTokens
  homepageDeps: HomepageDeps
}) {
  void seo
  void themeResetBaseline
  const router = useRouter()
  const { mod, error: templateLoadError } = useTemplateModule(templateId)

  const { draft, setPath, undo, redo, canUndo, canRedo, dirty, markSynced } = useUndoableJsonDocument(
    initialDraft,
    hydrationKey
  )

  const { persistDraft } = useSurfaceDraftPersistence({
    templateId,
    pageKey,
    draft,
    dirty,
    markSynced,
  })

  if (templateLoadError) {
    return (
      <CmsEditorErrorState title="tBook szerkesztő nem elérhető" description={templateLoadError} />
    )
  }

  if (!mod) {
    return <CmsEditorTemplateLoading />
  }

  const isTBookLanding = Boolean(mod.tBookPages)

  const tBookKey = TBOOK_PAGE_KEY_MAP[pageKey]
  const def = tBookKey ? mod.tBookPages?.[tBookKey] : undefined
  if (!def) {
    return (
      <CmsEditorErrorState
        title="tBook oldal nem szerkeszthető"
        description={`A '${pageKey}' oldal nincs regisztrálva a '${mod.manifest.id}' sablonon. Csak olyan sablonnál érhető el, amely támogatja a tBook foglalási oldalakat (pl. world-darts-festival).`}
      />
    )
  }

  const RenderCmp = def.Render as ComponentType<{ content: unknown; deps?: unknown }>

  const categoriesMapped = homepageDeps.categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    depth: 0,
  }))

  const homeChrome = isTBookLanding ? extractTBookHomeChrome(initialHomeDraft) : null
  const previewNavItems = homeChrome ? navItemsFromTBookChrome(homeChrome) : undefined
  const previewNavCta = homeChrome ? navCtaFromTBookChrome(homeChrome) : undefined
  const previewTickerText = homeChrome ? tickerTextFromTBookChrome(homeChrome) : undefined

  const meta = (draft as { meta?: { seoTitle?: string; seoDescription?: string } }).meta ?? {
    seoTitle: "",
    seoDescription: "",
  }

  const structureSidebar: ReactNode = (
    <div className="space-y-4">
      <CmsTBookPageSidebar pageKey={pageKey} draft={draft} setPath={setPath} />
      {isTBookLanding ? <CmsNavChromeSidebar draft={initialHomeDraft} setPath={() => {}} readOnly /> : null}
    </div>
  )

  const toolbar = (
    <CmsEditorSubtoolbar
      title={`tBook oldal: ${pageLabel}`}
      description="A szövegeket közvetlenül az előnézeten vagy a jobb oldali panelen szerkesztheted. Az előnézet a sablon színeit és navigációját használja."
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[180px] flex-1 space-y-1.5">
          <Label className={adminFieldLabel}>SEO cím</Label>
          <Input
            className="h-9"
            value={meta.seoTitle ?? ""}
            onChange={(e) => setPath("meta.seoTitle", e.target.value)}
          />
        </div>
        <div className="min-w-[220px] flex-1 space-y-1.5">
          <Label className={adminFieldLabel}>SEO leírás</Label>
          <Input
            className="h-9"
            value={meta.seoDescription ?? ""}
            onChange={(e) => setPath("meta.seoDescription", e.target.value)}
          />
        </div>
        {isTBookLanding ? (
          <Link
            href="/admin/cms/home"
            className="inline-flex h-9 items-center rounded-md border border-border/60 bg-background px-3 text-xs font-medium text-foreground hover:bg-muted"
          >
            Navigáció szerkesztése →
          </Link>
        ) : null}
      </div>
    </CmsEditorSubtoolbar>
  )

  return (
    <DefaultModernVisualCmsChrome
      templateId={templateId}
      shopEnabled={shopEnabled}
      reviewTitle={pageLabel}
      branding={branding}
      initialFooter={initialFooter}
      initialTheme={theme}
      dirty={dirty}
      canUndo={canUndo}
      canRedo={canRedo}
      onUndo={undo}
      onRedo={redo}
      onSaveDraft={async () => {
        try {
          await persistDraft()
          toast.success("Piszkozat mentve")
        } catch {
          toast.error("Mentés sikertelen")
        }
      }}
      onPublish={async () => {
        try {
          await persistDraft()
          await publishTemplatePageContent(templateId, pageKey)
          toast.success("Közzétéve")
          router.refresh()
        } catch {
          toast.error("Közzététel sikertelen")
        }
      }}
      onDiscard={async () => {
        try {
          await discardTemplatePageDraft(templateId, pageKey)
          toast.success("Piszkozat elvetve")
          router.refresh()
        } catch {
          toast.error("Elvetés sikertelen")
        }
      }}
      contactEmail={homepageDeps.company.email}
      contactEmails={homepageDeps.siteContact.emails}
      contactPhone={homepageDeps.company.phone}
      contactAddress={homepageDeps.company.address}
      footerCategories={categoriesMapped}
      toolbarBelowBranding={toolbar}
      structureSidebar={structureSidebar}
      navItems={previewNavItems}
      navCta={previewNavCta}
      tickerText={previewTickerText}
      renderMain={(ctx) =>
        ctx.mode === "edit" ? (
          <SurfaceDocEditProvider enabled setPath={setPath}>
            <RenderCmp content={draft} deps={{}} />
          </SurfaceDocEditProvider>
        ) : (
          <RenderCmp content={draft} deps={{}} />
        )
      }
    />
  )
}
