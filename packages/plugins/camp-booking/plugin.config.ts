import { definePlugin } from "@wse/sdk/plugins/types"
import type { PluginApiContext } from "@wse/sdk/plugins/types"
import { CampBookingAdminScreen } from "./admin/CampBookingAdminScreen"
import { buildCampBookingEmailTemplateSeeds } from "./lib/email-templates"

export const campBooking = definePlugin({
  manifest: {
    id: "camp-booking",
    name: "Tábor foglalás",
    version: "1.0.0",
    description: "Minecraft tábor turnus foglalás, közvetlen Stripe fizetés, Excel export.",
    requiresShop: false,
    featureFlagKey: "pluginCampBooking",
  },
  getEmailTemplates: async () => {
    const { BrandingSettingsService } = await import("@wse/core/services/branding-settings")
    const branding = await BrandingSettingsService.get()
    return buildCampBookingEmailTemplateSeeds(branding.brandName)
  },
  admin: {
    primaryWhenShopDisabled: true,
    statsSegment: "stats",
    navItems: [
      { label: "Kezdőlap", segment: "" },
      { label: "Statisztikák", segment: "stats" },
      { label: "Táborok", segment: "camps" },
    ],
    Screen: CampBookingAdminScreen,
  },
  api: {
    handle: (context: PluginApiContext) =>
      import("./api/handlers").then((m) => m.handleCampBookingApi(context)),
  },
})
