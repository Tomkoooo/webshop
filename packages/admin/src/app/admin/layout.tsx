import { AdminAppShell } from "@wse/core/components/admin/AdminAppShell"
import { AdminContainer } from "@wse/core/components/admin/AdminContainer"
import { AdminSidebar } from "@wse/core/components/admin/AdminSidebar"
import { auth } from "@wse/core/auth"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { BrandingSettingsService } from "@wse/core/services/branding-settings"
import { FeatureFlagService } from "@wse/core/services/feature-flags"
import { isShopEnabled } from "@wse/core/lib/features/shop"
import { ensureDeploymentPluginFeatureFlags } from "@wse/core/actions/admin-flags"
import { PluginService } from "@wse/core/services/plugin"
import { pluginAdminHref } from "@wse/sdk/plugins/types"
import type { PluginNavGroup } from "@wse/core/components/admin/AdminPluginNavSection"
import { resolveContentModeSidebarNav } from "@wse/core/lib/admin-plugin-navigation"
import { resolveAdminAccess } from "@wse/core/lib/admin-access"
import { isMultiTenantAdminEnabled } from "@wse/core/lib/site-features"
import { getActiveOrganizationIdFromCookie } from "@wse/plugin-t-book/lib/org-cookie"

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

  const multiTenantAdmin = isMultiTenantAdminEnabled()
  const access = await resolveAdminAccess()

  if (multiTenantAdmin) {
    if (!access.allowed) {
      redirect("/")
    }
  } else if (session.user.role !== "ADMIN") {
    redirect("/")
  }

  const pathname = (await headers()).get("x-pathname") ?? ""
  const activeOrganizationId =
    session.user.activeOrganizationId ?? (await getActiveOrganizationIdFromCookie()) ?? undefined

  const orgOnlyPaths =
    pathname.startsWith("/admin/plugins/t-book") ||
    pathname.startsWith("/admin/org/members") ||
    pathname.startsWith("/admin/org/roles") ||
    pathname.startsWith("/admin/org/settings")

  if (
    multiTenantAdmin &&
    orgOnlyPaths &&
    !pathname.startsWith("/admin/org/select") &&
    access.organizationIds.length > 0 &&
    !activeOrganizationId
  ) {
    redirect("/admin/org/select")
  }

  if (
    multiTenantAdmin &&
    pathname.startsWith("/admin/system") &&
    !access.isSystemAdmin
  ) {
    redirect("/admin")
  }

  await ensureDeploymentPluginFeatureFlags()

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
    <AdminAppShell
      multiTenantAdmin={multiTenantAdmin}
      activeOrganizationId={activeOrganizationId}
      organizationIds={access.organizationIds}
      sidebar={
        <AdminSidebar
          brandName={adminBrandName}
          enabledFeatures={enabledFeatures}
          shopEnabled={shopEnabled}
          pluginNavGroups={pluginNavGroups}
          contentModeNav={shopEnabled ? undefined : contentModeNav}
          multiTenantAdmin={multiTenantAdmin}
          isSystemAdmin={access.isSystemAdmin}
        />
      }
    >
      <AdminContainer className="flex flex-col gap-6 pb-8">{children}</AdminContainer>
    </AdminAppShell>
  )
}
