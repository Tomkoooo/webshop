/**
 * Shared admin surface for plugin screens — mirrors tCrm / AdminAppShell styling.
 */
import { cn } from "@wse/core/lib/utils"
import {
  adminCard,
  adminCardPadding,
  adminFieldLabel,
  adminInputClass,
  adminKpiCard,
  adminLinkAccent,
  adminPage,
  adminPageDescription,
  adminPageHeader,
  adminPageTitle,
  adminPanel,
} from "@wse/core/lib/admin-ui"

export const pluginAdminPage = adminPage
export const pluginAdminPageHeader = adminPageHeader
export const pluginAdminPageTitle = adminPageTitle
export const pluginAdminPageDescription = adminPageDescription
export const pluginAdminCard = cn(adminCard, adminCardPadding)
export const pluginAdminPanel = adminPanel
export const pluginAdminKpiCard = adminKpiCard
export const pluginAdminFieldLabel = adminFieldLabel
export const pluginAdminInputClass = adminInputClass
export const pluginAdminLinkAccent = adminLinkAccent
export const pluginAdminSelectClass = cn(adminInputClass, "appearance-none pr-8")

export const tBookInputClass = adminInputClass
export const tBookSelectClass = cn(adminInputClass, "appearance-none pr-8")

export function pluginAdminCn(...classes: Array<string | false | null | undefined>) {
  return cn(...classes)
}
