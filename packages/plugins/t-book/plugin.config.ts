import { definePlugin } from "@wse/sdk/plugins/types"
import type { PluginApiContext } from "@wse/sdk/plugins/types"
import { TBookAdminScreen } from "./admin/TBookAdminScreen"
import { buildTBookEmailTemplateSeeds } from "./lib/email-templates"

export const tBook = definePlugin({
  manifest: {
    id: "t-book",
    name: "tBook — esemény & szállás foglalás",
    version: "1.0.0",
    description:
      "Események, eseménycsoportok, hotelek dinamikus árazással, foglalások, Stripe fizetés és szamlazz.hu számlázás — API kulcsos publikus végpontokkal.",
    requiresShop: false,
    featureFlagKey: "pluginTBook",
  },
  getEmailTemplates: async () => {
    const { BrandingSettingsService } = await import("@wse/core/services/branding-settings")
    const branding = await BrandingSettingsService.get()
    return buildTBookEmailTemplateSeeds(branding.brandName)
  },
  admin: {
    primaryWhenShopDisabled: true,
    statsSegment: "stats",
    navItems: [
      { label: "Kezdőlap", segment: "" },
      { label: "Eseménycsoportok", segment: "groups" },
      { label: "Események", segment: "events" },
      { label: "Foglalások", segment: "bookings" },
    ],
    Screen: TBookAdminScreen,
  },
  api: {
    handle: (context: PluginApiContext) =>
      import("./api/handlers").then((m) => m.handleTBookApi(context)),
  },
})
