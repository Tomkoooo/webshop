"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { TopBar } from "@wse/core/features/homepage-cms/components/editor/TopBar"
import { DevicePreview } from "@wse/core/features/homepage-cms/components/editor/DevicePreview"
import { CmsChromeBrandingToolbar } from "@wse/core/features/template-cms/components/CmsChromeBrandingToolbar"
import { useTemplateModule } from "@wse/core/features/template-cms/hooks/use-template-module"
import type { TemplateModule } from "@wse/sdk/templates/types"
import { themeTokensToCssVars } from "@wse/core/lib/theme-css-vars"
import { pressStart2P } from "@wse/template-minecraft-camp/fonts"
import type { FooterSettings } from "@wse/core/services/footer-settings"
import type { ContactEmailEntry } from "@wse/core/lib/contact-emails"
import type { ThemeTokens } from "@wse/core/services/theme"

type Branding = {
  brandName: string
  logoNav: string
  logoFooter: string
  logoHero: string
}

type FooterCategory = { id: string; name: string; slug: string; depth: number }

export type VisualCmsChromeCtx = {
  /** Fullscreen review uses desktop width; inline edit uses DevicePreview device. */
  mode: "edit" | "review"
  Navbar: TemplateModule["chrome"]["Navbar"]
  Footer: TemplateModule["chrome"]["Footer"]
  branding: Branding
  footerSettings: FooterSettings
  themeSettings: ThemeTokens
  setBranding: React.Dispatch<React.SetStateAction<Branding>>
  setFooterSettings: React.Dispatch<React.SetStateAction<FooterSettings>>
}

export function DefaultModernVisualCmsChrome({
  templateId,
  shopEnabled = true,
  reviewTitle,
  branding: initialBranding,
  initialFooter,
  initialTheme,
  dirty,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSaveDraft,
  onPublish,
  onDiscard,
  contactEmail,
  contactEmails,
  contactPhone,
  contactAddress,
  footerCategories,
  toolbarBelowBranding,
  structureSidebar,
  renderMain,
}: {
  templateId: string
  shopEnabled?: boolean
  reviewTitle: string
  branding: Branding
  initialFooter: FooterSettings
  initialTheme: ThemeTokens
  dirty: boolean
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onSaveDraft: () => Promise<void>
  onPublish: () => Promise<void>
  onDiscard: () => Promise<void>
  contactEmail: string
  contactEmails: ContactEmailEntry[]
  contactPhone: string
  contactAddress: string
  footerCategories: FooterCategory[]
  toolbarBelowBranding?: React.ReactNode
  /** Structured editing panel (e.g. list managers) shown beside the canvas in edit mode. */
  structureSidebar?: React.ReactNode
  renderMain: (ctx: VisualCmsChromeCtx) => React.ReactNode
}) {
  const router = useRouter()
  const [branding, setBranding] = useState(initialBranding)
  const [footerSettings, setFooterSettings] = useState(initialFooter)
  const [themeSettings, setThemeSettings] = useState(initialTheme)
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop")
  const [reviewOpen, setReviewOpen] = useState(false)

  useEffect(() => {
    setThemeSettings(initialTheme)
  }, [initialTheme])

  useEffect(() => {
    if (!reviewOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        setReviewOpen(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [reviewOpen])

  const mod = useTemplateModule(templateId)

  if (!mod) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/40 px-6 py-10 text-sm text-neutral-400">
        Sablon betöltése…
      </div>
    )
  }

  const NavbarCmp = mod.chrome.Navbar
  const FooterCmp = mod.chrome.Footer
  const isMinecraftCamp = templateId === "minecraft-camp"
  const previewSurfaceClass = isMinecraftCamp
    ? `minecraft-camp-preview minecraft-page-mineshow ${pressStart2P.variable}`
    : ""
  const previewBgClass = isMinecraftCamp ? "bg-[#b8d88a]" : "bg-background"

  const wrapLayout = (mode: "edit" | "review", main: React.ReactNode) => (
    <>
      <NavbarCmp
        brandName={branding.brandName}
        logoSrc={branding.logoNav}
        shopEnabled={shopEnabled}
        cmsChromePreview
      />
      {/* Shop-style mains use pt-32 for a fixed storefront bar; shrink that under in-flow CMS preview. */}
      <div className="min-h-0 flex-1 overflow-x-hidden [&>main.min-h-screen]:!pt-8">{main}</div>
      <FooterCmp
        brandName={branding.brandName}
        logoSrc={branding.logoFooter}
        shopEnabled={shopEnabled}
        footerSettings={footerSettings}
        cmsEditable={mode === "edit"}
        onSettingsChange={
          mode === "edit"
            ? async (next) => {
                setFooterSettings(next)
                await fetch("/api/admin/footer", {
                  method: "PUT",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify(next),
                })
              }
            : undefined
        }
        categories={footerCategories}
        email={contactEmail}
        contactEmails={contactEmails}
        phone={contactPhone}
        address={contactAddress}
      />
    </>
  )

  const ctxEdit: VisualCmsChromeCtx = {
    mode: "edit",
    Navbar: NavbarCmp,
    Footer: FooterCmp,
    branding,
    footerSettings,
    themeSettings,
    setBranding,
    setFooterSettings,
  }

  const ctxReview: VisualCmsChromeCtx = {
    mode: "review",
    Navbar: NavbarCmp,
    Footer: FooterCmp,
    branding,
    footerSettings,
    themeSettings,
    setBranding,
    setFooterSettings,
  }

  const mainEdit = renderMain(ctxEdit)
  const mainReview = renderMain(ctxReview)

  return (
    <div className="cms-editor-chrome min-h-screen text-white">
      <TopBar
        dirty={dirty}
        device={device}
        onDeviceChange={setDevice}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={onUndo}
        onRedo={onRedo}
        onSave={onSaveDraft}
        onReview={() => setReviewOpen(true)}
        onOpenSettings={() => router.push("/admin/cms/settings?section=theme")}
        onPublish={onPublish}
        onDiscard={onDiscard}
        onExit={() => router.push("/admin/cms")}
      />

      <div className="flex-1 min-w-0">
        <CmsChromeBrandingToolbar branding={branding} setBranding={setBranding} />

        {toolbarBelowBranding}

        <div className="p-4 space-y-4">
          <div className={structureSidebar ? "flex items-start gap-4" : undefined}>
            <div className="min-w-0 flex-1">
              <DevicePreview device={device}>
                <div
                  className={`flex min-h-[480px] flex-col text-foreground selection:bg-primary selection:text-primary-foreground admin-storefront-preview ${previewBgClass} ${previewSurfaceClass}`}
                  style={themeTokensToCssVars(themeSettings)}
                >
                  {wrapLayout("edit", mainEdit)}
                </div>
              </DevicePreview>
            </div>
            {structureSidebar ? (
              <aside className="sticky top-4 hidden w-80 shrink-0 xl:block">{structureSidebar}</aside>
            ) : null}
          </div>
        </div>
      </div>

      {reviewOpen ? (
        <div className="fixed inset-0 z-200 bg-black overflow-y-auto">
          <div className="sticky top-0 z-210 px-4 py-3 border-b border-white/10 bg-black/95 backdrop-blur flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-neutral-300">{reviewTitle}</p>
            <button
              type="button"
              onClick={() => setReviewOpen(false)}
              className="px-3 h-9 border border-white/20 text-white text-xs uppercase cursor-pointer"
            >
              Vissza
            </button>
          </div>
            <div
              className={`flex min-h-screen flex-col overflow-x-hidden text-foreground admin-storefront-preview ${previewBgClass} ${previewSurfaceClass}`}
              style={themeTokensToCssVars(themeSettings)}
            >
            {wrapLayout("review", mainReview)}
          </div>
        </div>
      ) : null}
    </div>
  )
}
