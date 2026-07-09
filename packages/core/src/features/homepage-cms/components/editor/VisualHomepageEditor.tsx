"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { TopBar } from "@wse/core/features/homepage-cms/components/editor/TopBar"
import { Inserter } from "@wse/core/features/homepage-cms/components/editor/Inserter"
import { createDefaultBlock, useHomepageEditorStore } from "@wse/core/features/homepage-cms/store/editor-store"
import type { HeroBlock, HomepageBlockType, HomepageSnapshot } from "@wse/core/features/homepage-cms/types/block-types"
import { getDefinition } from "@wse/core/features/homepage-cms/registry/block-registry"
import {
  insertionIndexForHomepageBlockType,
  resolveAllowedHomepageBlockTypes,
} from "@wse/core/features/homepage-cms/utils/homepage-block-allowlist"
import { discardHomepageDraft, publishHomepageDraft } from "@wse/core/features/homepage-cms/api/publish-client"
import { saveHomepageDraft } from "@wse/core/features/homepage-cms/api/draft-client"
import { DevicePreview } from "@wse/core/features/homepage-cms/components/editor/DevicePreview"
import { Breadcrumb } from "@wse/core/features/homepage-cms/components/editor/Breadcrumb"
import { CmsChromeBrandingToolbar } from "@wse/core/features/template-cms/components/CmsChromeBrandingToolbar"
import { FALLBACK_TEMPLATE_ID, getTemplateById, loadTemplateModule } from "@wse/core/templates/registry"
import type { TemplateModule } from "@wse/sdk/templates/types"
import { themeTokensToCssVars } from "@wse/core/lib/theme-css-vars"
import type { FooterSettings } from "@wse/core/services/footer-settings"
import type { ThemeTokens } from "@wse/core/services/theme"
import { CmsEditProvider } from "@wse/core/features/homepage-cms/components/editor/cms-edit-context"
import type { HomePageDeps } from "@wse/sdk/templates/types"
import type { HomepageRenderDependencies } from "@wse/core/features/homepage-cms/render/homepage-deps"
import { resolveContactDisplayField } from "@wse/core/lib/contact-display"
import { CmsReviewOverlay } from "@wse/core/features/template-cms/components/CmsReviewOverlay"

type Props = {
  templateId: string
  /** Mirrors storefront chrome links (shop/cart) in the template Navbar/Footer. */
  shopEnabled?: boolean
  initialSnapshot: HomepageSnapshot
  initialBranding: {
    brandName: string
    logoNav: string
    logoFooter: string
    logoHero: string
  }
  initialFooter: FooterSettings
  initialTheme: ThemeTokens
  dependencies: HomepageRenderDependencies
}

export function VisualHomepageEditor({
  templateId,
  shopEnabled = true,
  initialSnapshot,
  initialBranding,
  initialFooter,
  initialTheme,
  dependencies,
}: Props) {
  const router = useRouter()
  const [branding, setBranding] = useState(initialBranding)
  const [themeSettings, setThemeSettings] = useState(initialTheme)
  const [footerSettings, setFooterSettings] = useState(initialFooter)
  const [reviewOpen, setReviewOpen] = useState(false)
  const {
    snapshot,
    selectedBlockId,
    device,
    dirty,
    past,
    future,
    setSnapshot,
    setDevice,
    updateBlockField,
    updateBlockData,
    addBlock,
    markSaved,
    undo,
    redo,
  } = useHomepageEditorStore()

  useEffect(() => {
    setSnapshot(initialSnapshot)
  }, [initialSnapshot, setSnapshot])

  useEffect(() => {
    setThemeSettings(initialTheme)
  }, [initialTheme])

  const selectedBlock = useMemo(
    () => snapshot.blocks.find((block) => block.id === selectedBlockId) ?? null,
    [snapshot.blocks, selectedBlockId]
  )

  const [templateModule, setTemplateModule] = useState<TemplateModule>(() => {
    const loaded = getTemplateById(templateId)
    return loaded ?? getTemplateById(FALLBACK_TEMPLATE_ID)!
  })

  useEffect(() => {
    let cancelled = false
    const loaded = getTemplateById(templateId)
    if (loaded) {
      setTemplateModule(loaded)
      return
    }
    void loadTemplateModule(templateId).then((mod) => {
      if (!cancelled) setTemplateModule(mod)
    })
    return () => {
      cancelled = true
    }
  }, [templateId])
  const allowedHomepageBlockTypes = useMemo(
    () => resolveAllowedHomepageBlockTypes(templateModule.pages.home),
    [templateModule]
  )
  const insertableBlockTypes = useMemo(
    () => allowedHomepageBlockTypes.filter((t) => !snapshot.blocks.some((b) => b.type === t)),
    [allowedHomepageBlockTypes, snapshot.blocks]
  )
  const [minecraftCampExtras, setMinecraftCampExtras] = useState<{
    fontVariable: string
    venueBadge?: string
  } | null>(null)

  useEffect(() => {
    if (templateId !== "minecraft-camp") {
      setMinecraftCampExtras(null)
      return
    }
    let cancelled = false
    void Promise.all([
      import("@wse/template-minecraft-camp/lib/site-config"),
      import("@wse/template-minecraft-camp/fonts"),
    ]).then(([siteConfigMod, fontsMod]) => {
      if (cancelled) return
      setMinecraftCampExtras({
        fontVariable: fontsMod.pressStart2P.variable,
        venueBadge: siteConfigMod.extractMineshowSiteConfig(snapshot).venueShort,
      })
    })
    return () => {
      cancelled = true
    }
  }, [templateId, snapshot])

  const NavbarCmp = templateModule.chrome.Navbar
  const FooterCmp = templateModule.chrome.Footer
  const HomeRender = templateModule.pages.home.Render
  const isMinecraftCamp = templateId === "minecraft-camp"
  const mineshowVenueBadge = isMinecraftCamp ? minecraftCampExtras?.venueBadge : undefined
  const previewSurfaceClass =
    isMinecraftCamp && minecraftCampExtras
      ? `admin-storefront-preview minecraft-camp-preview minecraft-page-mineshow ${minecraftCampExtras.fontVariable}`
      : "admin-storefront-preview"
  const patchHeroTopLevelField = (
    data: HeroBlock["data"],
    field: string,
    value: unknown
  ): Record<string, unknown> | null => {
    const slideKeys = new Set([
      "title",
      "description",
      "primaryCtaLabel",
      "primaryCtaHref",
      "secondaryCtaLabel",
      "secondaryCtaHref",
    ])
    if (!slideKeys.has(field)) return null
    const patch: Record<string, unknown> = { [field]: value }
    if (Array.isArray(data.heroSlides) && data.heroSlides.length > 0) {
      patch.heroSlides = data.heroSlides.map((slide) => ({ ...slide, [field]: value }))
    }
    return patch
  }

  const contactData = useMemo(() => {
    const block = snapshot.blocks.find((item) => item.type === "contact" && item.enabled !== false)
    const data = block?.data as
      | { email?: string; phone?: string; address?: string }
      | undefined
    return {
      blockId: block?.id,
      email: resolveContactDisplayField(
        data?.email,
        dependencies.siteContact.emails[0]?.email || dependencies.company.email
      ),
      phone: resolveContactDisplayField(data?.phone, dependencies.company.phone),
      address: resolveContactDisplayField(data?.address, dependencies.company.address),
    }
  }, [
    dependencies.company.address,
    dependencies.company.email,
    dependencies.company.phone,
    dependencies.siteContact.emails,
    snapshot.blocks,
  ])

  const homePageDeps = useMemo(
    (): HomePageDeps => ({ ...dependencies, templateId }),
    [dependencies, templateId]
  )

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault()
        saveHomepageDraft(snapshot, templateId).then(() => {
          markSaved()
          toast.success("Piszkozat mentve")
        })
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [markSaved, redo, snapshot, templateId, undo])

  useEffect(() => {
    if (!dirty) return
    const timer = setTimeout(async () => {
      try {
        await saveHomepageDraft(snapshot, templateId)
        markSaved()
      } catch {
        toast.error("Automatikus mentés sikertelen")
      }
    }, 1500)
    return () => clearTimeout(timer)
  }, [dirty, markSaved, snapshot, templateId])

  useEffect(() => {
    if (!reviewOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        setReviewOpen(false)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [reviewOpen])

  return (
    <div className="cms-editor-chrome min-h-screen">
      <TopBar
        dirty={dirty}
        device={device}
        onDeviceChange={setDevice}
        canUndo={past.length > 0}
        canRedo={future.length > 0}
        onUndo={undo}
        onRedo={redo}
        onSave={async () => {
          try {
            await saveHomepageDraft(snapshot, templateId)
            markSaved()
            toast.success("Piszkozat mentve")
          } catch {
            toast.error("Piszkozat mentése sikertelen")
          }
        }}
        onReview={() => setReviewOpen(true)}
        onOpenSettings={() => router.push("/admin/cms/settings?section=theme")}
        onPublish={async () => {
          try {
            await saveHomepageDraft(snapshot, templateId)
            markSaved()
            await publishHomepageDraft(templateId)
            toast.success("Közzétéve")
            router.refresh()
          } catch {
            toast.error("Közzététel sikertelen")
          }
        }}
        onDiscard={async () => {
          try {
            await discardHomepageDraft(templateId)
            router.refresh()
            toast.success("Piszkozat elvetve")
          } catch {
            toast.error("Elvetés sikertelen")
          }
        }}
        onExit={() => router.push("/admin/cms")}
      />
      <div className="flex items-start">
        <div className="flex-1 min-w-0">
          <CmsChromeBrandingToolbar branding={branding} setBranding={setBranding} />
          <Breadcrumb block={selectedBlock} />
          <div className="cms-editor-subtoolbar space-y-3 border-b border-border/40 bg-muted/30 p-4">
            <p className="text-sm font-medium text-foreground">Szekciók megjelenítése</p>
            <div className="flex flex-wrap gap-2">
              {allowedHomepageBlockTypes.map((sectionType) => {
                const block = snapshot.blocks.find((b) => b.type === sectionType)
                const label = getDefinition(sectionType).label
                return (
                  <label
                    key={sectionType}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-background px-3 py-1.5 text-xs text-foreground shadow-sm ring-1 ring-border/50"
                  >
                    <input
                      type="checkbox"
                      checked={block ? block.enabled !== false : false}
                      onChange={(event) => {
                        const on = event.target.checked
                        if (!block && on) {
                          const idx = insertionIndexForHomepageBlockType(
                            snapshot.blocks,
                            sectionType,
                            allowedHomepageBlockTypes
                          )
                          addBlock(createDefaultBlock(sectionType), idx)
                          return
                        }
                        if (block) {
                          updateBlockField(block.id, "enabled", on)
                        }
                      }}
                    />
                    <span>{label}</span>
                  </label>
                )
              })}
            </div>
            <Inserter
              allowedTypes={insertableBlockTypes}
              onInsert={(type: HomepageBlockType) => {
                if (snapshot.blocks.some((b) => b.type === type)) {
                  toast("Ez a szekció már szerepel az oldalon.")
                  return
                }
                const idx = insertionIndexForHomepageBlockType(
                  snapshot.blocks,
                  type,
                  allowedHomepageBlockTypes
                )
                addBlock(createDefaultBlock(type), idx)
              }}
            />
          </div>
          <div className="p-4 space-y-4">
            <DevicePreview device={device}>
              <div
                className={`flex min-h-[480px] flex-col text-foreground selection:bg-primary selection:text-primary-foreground ${isMinecraftCamp ? "bg-[#b8d88a]" : "bg-background"} ${previewSurfaceClass}`}
                style={themeTokensToCssVars(themeSettings)}
              >
                <NavbarCmp
                  brandName={branding.brandName}
                  logoSrc={branding.logoNav}
                  shopEnabled={shopEnabled}
                  cmsChromePreview
                  venueBadge={mineshowVenueBadge}
                />
                <main className="min-h-0 flex-1 overflow-x-hidden pt-6">
                  <CmsEditProvider
                    enabled
                    snapshot={snapshot}
                    updateField={(blockType, field, value, blockId) => {
                      const target = blockId
                        ? snapshot.blocks.find(
                            (item) => item.id === blockId && item.enabled !== false
                          )
                        : snapshot.blocks.find(
                            (item) => item.type === blockType && item.enabled !== false
                          )
                      if (!target) return
                      if (blockType === "hero" && target.type === "hero") {
                        const heroPatch = patchHeroTopLevelField(
                          target.data as HeroBlock["data"],
                          field,
                          value
                        )
                        if (heroPatch) {
                          updateBlockData(target.id, heroPatch)
                          return
                        }
                      }
                      updateBlockField(target.id, field, value)
                    }}
                    patchBlockData={(blockType, patch, blockId) => {
                      const target = blockId
                        ? snapshot.blocks.find(
                            (item) => item.id === blockId && item.enabled !== false
                          )
                        : snapshot.blocks.find(
                            (item) => item.type === blockType && item.enabled !== false
                          )
                      if (!target) return
                      updateBlockData(target.id, patch)
                    }}
                  >
                    <HomeRender content={snapshot} deps={homePageDeps} />
                  </CmsEditProvider>
                </main>
                <FooterCmp
                  brandName={branding.brandName}
                  logoSrc={branding.logoFooter}
                  shopEnabled={shopEnabled}
                  footerSettings={footerSettings}
                  cmsEditable
                  email={contactData.email}
                  contactVenueAddress={contactData.address}
                  onContactVenueChange={(value) => {
                    if (!contactData.blockId) return
                    updateBlockField(contactData.blockId, "address", value)
                  }}
                  onContactEmailChange={(value) => {
                    if (!contactData.blockId) return
                    updateBlockField(contactData.blockId, "email", value)
                  }}
                  onSettingsChange={async (next) => {
                    setFooterSettings(next)
                    await fetch("/api/admin/footer", {
                      method: "PUT",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify(next),
                    })
                  }}
                  categories={dependencies.categories.map((category) => ({
                    id: category.id,
                    name: category.name,
                    slug: category.slug,
                    depth: 0,
                  }))}
                  contactEmails={dependencies.siteContact.emails}
                  phone={contactData.phone}
                  address={contactData.address}
                />
              </div>
            </DevicePreview>
          </div>
        </div>
      </div>
      {reviewOpen ? (
        <CmsReviewOverlay
          title="Főoldal előnézet"
          description="Így jelenik meg a főoldal az aktuális CMS piszkozattal."
          onClose={() => setReviewOpen(false)}
        >
          <div
            className={`min-h-screen overflow-x-hidden bg-background text-foreground selection:bg-primary selection:text-primary-foreground ${previewSurfaceClass}`}
            style={themeTokensToCssVars(themeSettings)}
          >
            <NavbarCmp
              brandName={branding.brandName}
              logoSrc={branding.logoNav}
              shopEnabled={shopEnabled}
              cmsChromePreview
              venueBadge={mineshowVenueBadge}
            />
            <main className="overflow-x-hidden pt-6">
              <CmsEditProvider
                enabled={false}
                snapshot={snapshot}
                updateField={(blockType, field, value) => {
                  void blockType
                  void field
                  void value
                }}
                patchBlockData={() => undefined}
              >
                <HomeRender content={snapshot} deps={homePageDeps} />
              </CmsEditProvider>
            </main>
            <FooterCmp
              brandName={branding.brandName}
              logoSrc={branding.logoFooter}
              shopEnabled={shopEnabled}
              footerSettings={footerSettings}
              email={contactData.email}
              contactVenueAddress={contactData.address}
              categories={dependencies.categories.map((category) => ({
                id: category.id,
                name: category.name,
                slug: category.slug,
                depth: 0,
              }))}
              contactEmails={dependencies.siteContact.emails}
              phone={contactData.phone}
              address={contactData.address}
            />
          </div>
        </CmsReviewOverlay>
      ) : null}
    </div>
  )
}
