import { definePlugin } from "@wse/sdk/plugins/types"
import type { PluginApiContext } from "@wse/sdk/plugins/types"
import { PressKitAdminScreen } from "./admin/PressKitAdminScreen"
import { buildPressKitEmailTemplateSeeds } from "./lib/email-templates"

export const pressKit = definePlugin({
  manifest: {
    id: "press-kit",
    name: "Sajtóanyagok",
    version: "1.0.0",
    description:
      "Jelszóval védett sajtóportál, CMS szövegek, digitális képregény előnézet, meghívók és megnyitás-statisztika.",
    requiresShop: true,
    featureFlagKey: "pluginPressKit",
  },
  getEmailTemplates: async () => {
    const { BrandingSettingsService } = await import("@wse/core/services/branding-settings")
    const branding = await BrandingSettingsService.get()
    return buildPressKitEmailTemplateSeeds(branding.brandName)
  },
  admin: {
    statsSegment: "stats",
    navItems: [
      { label: "Áttekintés", segment: "" },
      { label: "Kapcsolatok", segment: "contacts" },
      { label: "Oldal szerkesztése", segment: "content" },
      { label: "Megnyitások", segment: "stats" },
    ],
    Screen: PressKitAdminScreen,
  },
  api: {
    handle: (context: PluginApiContext) =>
      import("./api/handlers").then((m) => m.handlePressKitApi(context)),
  },
})
