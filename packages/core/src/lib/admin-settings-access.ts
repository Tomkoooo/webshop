import {
  getDeploymentDefinition,
  getPluginConfigForDeployment,
  type DeploymentDefinition,
} from "@wse/core/config/deployments-registry"
import { isShopEnabled } from "@wse/core/lib/features/shop"
import { CMS_SITE_SETTINGS_SECTIONS } from "@wse/core/features/template-cms/cms-site-settings"

export type AdminFeatureFlagKey =
  | "newsletter"
  | "shopPage"
  | "maintenanceMode"
  | "glsParcelPicker"
  | "glsParcelManager"
  | "foxpostParcelPicker"
  | "foxpostParcelManager"
  | "stripePayments"
  | "szamlazzInvoicing"
  | "pluginCampBooking"
  | "pluginPressKit"
  | "pluginOrderLab"
  | "pluginTBook"

const SHOP_ONLY_FLAGS: AdminFeatureFlagKey[] = [
  "shopPage",
  "glsParcelPicker",
  "glsParcelManager",
  "foxpostParcelPicker",
  "foxpostParcelManager",
]

export function getDeploymentForAdmin(host?: string | null): DeploymentDefinition {
  return getDeploymentDefinition(host)
}

/** Feature flags shown on /admin/info for the current deployment. */
export function getAccessibleAdminFlagKeys(
  deployment: DeploymentDefinition,
  shopEnabled = isShopEnabled()
): AdminFeatureFlagKey[] {
  const keys: AdminFeatureFlagKey[] = ["maintenanceMode", "newsletter"]

  if (shopEnabled) {
    keys.push("shopPage", ...SHOP_ONLY_FLAGS)
  }

  const hasPaymentPlugin =
    deployment.enabledPlugins.includes("camp-booking") ||
    deployment.enabledPlugins.includes("t-book")
  if (shopEnabled || hasPaymentPlugin) {
    keys.push("stripePayments", "szamlazzInvoicing")
  }

  return keys
}

/** Plugin feature flags are toggled in the Plugin beállítások section, not under Funkciók. */
export function getAccessiblePluginFeatureFlagKeys(
  deployment: DeploymentDefinition
): string[] {
  return deployment.enabledPlugins
    .map((id) => PLUGIN_LABELS[id]?.featureFlagKey)
    .filter((key): key is string => Boolean(key))
}

export function isAdminFlagKeyAccessible(
  key: string,
  deployment: DeploymentDefinition,
  shopEnabled = isShopEnabled()
): boolean {
  return getAccessibleAdminFlagKeys(deployment, shopEnabled).includes(key as AdminFeatureFlagKey)
}

export type AdminPluginSettingsEntry = {
  pluginId: string
  name: string
  description: string
  featureFlagKey: string | null
  featureEnabled: boolean
  config: Record<string, unknown>
  adminHref: string
}

const PLUGIN_LABELS: Record<string, { name: string; description: string; featureFlagKey?: string }> =
  {
    "camp-booking": {
      name: "Tábor foglalás",
      description: "Turnus foglalás, Stripe checkout, Excel export.",
      featureFlagKey: "pluginCampBooking",
    },
    "press-kit": {
      name: "Sajtóanyagok",
      description: "Sajtóportál, CMS, PDF előnézet, meghívók és megnyitás-statisztika.",
      featureFlagKey: "pluginPressKit",
    },
    "order-lab": {
      name: "Order Lab",
      description: "Foxpost sandbox rendeléskezelés és csomag/címke teszt külön gyűjteményben.",
      featureFlagKey: "pluginOrderLab",
    },
    "t-book": {
      name: "tBook — esemény & szállás foglalás",
      description: "Események, hotelek dinamikus árazással, foglalások, Stripe + szamlazz.hu.",
      featureFlagKey: "pluginTBook",
    },
  }

const CONFIG_LABELS: Record<string, Record<string, string>> = {
  "camp-booking": {
    storefrontMode: "Storefront mód",
    currency: "Pénznem",
  },
  "press-kit": {
    routePrefix: "URL előtag",
    portalTitle: "Portál címe",
    analyticsOnPressPortal: "Analitika a sajtóportálon",
  },
}

export function getConfigFieldLabel(pluginId: string, key: string): string {
  return CONFIG_LABELS[pluginId]?.[key] ?? key
}

/** Plugins allowlisted on this deployment — shown under Plugin beállítások. */
export function getAccessiblePluginSettings(
  deployment: DeploymentDefinition,
  flagEnabledByKey: Record<string, boolean>,
  host?: string | null
): AdminPluginSettingsEntry[] {
  return deployment.enabledPlugins.map((pluginId) => {
    const meta = PLUGIN_LABELS[pluginId] ?? {
      name: pluginId,
      description: "Plugin konfiguráció ehhez a deploymenthez.",
    }
    const featureFlagKey = meta.featureFlagKey ?? null
    return {
      pluginId,
      name: meta.name,
      description: meta.description,
      featureFlagKey,
      featureEnabled: featureFlagKey ? Boolean(flagEnabledByKey[featureFlagKey]) : true,
      config: deployment.pluginConfig[pluginId] ?? getPluginConfigForDeployment(pluginId, host),
      adminHref: `/admin/plugins/${pluginId}`,
    }
  })
}

export function getAccessibleCmsSiteSettingsSections(
  shopEnabled = isShopEnabled()
): typeof CMS_SITE_SETTINGS_SECTIONS {
  return CMS_SITE_SETTINGS_SECTIONS.map((section) => {
    if (section.id === "branding" && !shopEnabled) {
      return {
        ...section,
        description: "Weboldal neve, navbar és lábléc logók.",
      }
    }
    if (section.id === "theme" && !shopEnabled) {
      return {
        ...section,
        description: "Színek, tipográfia — az egész honlap megjelenése.",
      }
    }
    if (section.id === "contact" && !shopEnabled) {
      return {
        ...section,
        description: "Megjelenő e-mailek, űrlap címzettek, számlázási hiba értesítések.",
      }
    }
    return section
  })
}

export function shouldShowShopOrderContactEmails(shopEnabled = isShopEnabled()): boolean {
  return shopEnabled
}
