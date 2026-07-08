import { AdminSidebar } from "@wse/core/components/admin/AdminSidebar"
import { Sheet, SheetContent, SheetTrigger } from "@wse/core/components/ui/sheet"
import { Menu, ArrowLeft } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import Link from "next/link"
import { auth } from "@wse/core/auth"
import { redirect } from "next/navigation"
import { BrandingSettingsService } from "@wse/core/services/branding-settings"
import { FeatureFlagService } from "@wse/core/services/feature-flags"
import { isShopEnabled } from "@wse/core/lib/features/shop"
import { listAllTemplates } from "@wse/core/templates/registry"
import { PluginService } from "@wse/core/services/plugin"
import { pluginAdminHref } from "@wse/sdk/plugins/types"
import type { PluginNavGroup } from "@wse/core/components/admin/AdminPluginNavSection"
import { resolveContentModeSidebarNav } from "@wse/core/lib/admin-plugin-navigation"

export const dynamic = "force-dynamic"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/admin-login?callbackUrl=%2Fadmin")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/")
  }

  await listAllTemplates()
  const [
    branding,
    newsletterEnabled,
    glsParcelPickerEnabled,
    stripePaymentsEnabled,
    pluginsWithAdmin,
    contentModeNav,
  ] = await Promise.all([
    BrandingSettingsService.get(),
    FeatureFlagService.isEnabled("newsletter", false),
    FeatureFlagService.isEnabled("glsParcelPicker", false),
    FeatureFlagService.isEnabled("stripePayments", false),
    PluginService.listEnabledWithAdmin(),
    resolveContentModeSidebarNav(),
  ])
  const shopEnabled = isShopEnabled()
  const adminBrandName = branding.brandName || "Generic"
  const enabledFeatures = {
    newsletter: newsletterEnabled,
    glsParcelPicker: glsParcelPickerEnabled,
    stripePayments: stripePaymentsEnabled,
  }
  const pluginNavGroups: PluginNavGroup[] = pluginsWithAdmin.map((entry) => ({
    pluginId: entry.id,
    pluginName: entry.name,
    items: [
      ...entry.navItems.map((item) => ({
        label: item.label,
        href: pluginAdminHref(entry.id, item.segment),
      })),
      ...(entry.id === "camp-booking" && !shopEnabled
        ? [{ label: "Adminok", href: "/admin/users" }]
        : []),
    ],
  }))

  return (
    <div className="admin-shell min-h-screen bg-[#0A0A0B] text-white">
      {/* Mobile Header */}
      <div className="lg:hidden h-20 border-b border-white/5 bg-black/50 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Bolt</span>
        </Link>
        
        <span className="text-sm font-heading font-black tracking-tight uppercase italic">
          {adminBrandName} <span className="admin-headline-accent admin-headline-accent-tight">Admin</span>
        </span>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-white/5 text-white">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 border-r border-white/10 w-72">
            <AdminSidebar
              brandName={adminBrandName}
              enabledFeatures={enabledFeatures}
              shopEnabled={shopEnabled}
              pluginNavGroups={pluginNavGroups}
              contentModeNav={shopEnabled ? undefined : contentModeNav}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-72 border-r border-white/5 flex-col z-50">
        <AdminSidebar
          brandName={adminBrandName}
          enabledFeatures={enabledFeatures}
          shopEnabled={shopEnabled}
          pluginNavGroups={pluginNavGroups}
          contentModeNav={shopEnabled ? undefined : contentModeNav}
        />
      </aside>

      <main className="lg:ml-72 min-h-screen">
        <div className="px-6 py-8 md:px-10 md:py-12 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
