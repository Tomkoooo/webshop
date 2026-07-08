import type { GuideSectionDef } from "@wse/core/lib/admin-guide/types"

/** Ordered admin user-guide sections. Visibility rules filter at runtime by deployment. */
export const ADMIN_GUIDE_SECTIONS: GuideSectionDef[] = [
  {
    id: "intro",
    title: "Bevezetés",
    file: "sections/00-bevezetes.md",
    visibility: { scope: "always" },
  },
  {
    id: "sidebar",
    title: "Oldalsáv — menüpontok",
    file: "sections/01-oldalsav.md",
    visibility: { scope: "always" },
  },
  {
    id: "cms-basics",
    title: "CMS alapok",
    file: "sections/02-cms-alapok.md",
    visibility: { scope: "always" },
  },
  {
    id: "site-settings",
    title: "Weboldal beállítások",
    file: "sections/03-weboldal-beallitasok.md",
    visibility: { scope: "always" },
  },
  {
    id: "templates",
    title: "Sablonok kezelése",
    file: "sections/04-sablonok.md",
    visibility: { scope: "always" },
  },
  {
    id: "popups-contact",
    title: "Popupok, kapcsolat, jogi dokumentumok",
    file: "sections/05-popupok-es-kapcsolat.md",
    visibility: { scope: "always" },
  },
  {
    id: "shop-basics",
    title: "Webshop alapok",
    file: "sections/10-webshop-alapok.md",
    visibility: { scope: "shop" },
  },
  {
    id: "product-editing",
    title: "Termék szerkesztése",
    file: "sections/11-termek-szerkesztes.md",
    visibility: { scope: "shop" },
  },
  {
    id: "camp-shop-disabled",
    title: "Tábor mód — admin navigáció",
    file: "sections/12-tabor-mod-navigacio.md",
    visibility: { scope: "shopDisabled", deploymentKeys: ["minecraft-camp"] },
  },
  {
    id: "template-default-modern",
    title: "Default Modern sablon",
    file: "sections/templates/default-modern.md",
    visibility: { scope: "always", templateIds: ["default-modern"] },
  },
  {
    id: "template-atelier-showcase",
    title: "Atelier Showcase sablon",
    file: "sections/templates/atelier-showcase.md",
    visibility: { scope: "always", templateIds: ["atelier-showcase"] },
  },
  {
    id: "template-cabinova",
    title: "Cabinova sablon",
    file: "sections/templates/cabinova.md",
    visibility: { scope: "always", templateIds: ["cabinova"] },
  },
  {
    id: "template-minecraft-camp",
    title: "Minecraft Camp sablon",
    file: "sections/templates/minecraft-camp.md",
    visibility: { scope: "always", templateIds: ["minecraft-camp"] },
  },
  {
    id: "template-sakkmed",
    title: "SAKKMED sablon",
    file: "sections/templates/sakkmed.md",
    visibility: { scope: "always", templateIds: ["sakkmed"] },
  },
  {
    id: "plugin-camp-booking",
    title: "Tábor foglalás plugin",
    file: "sections/plugins/camp-booking.md",
    visibility: { scope: "always", pluginIds: ["camp-booking"] },
  },
  {
    id: "plugin-press-kit",
    title: "Sajtóanyagok plugin",
    file: "sections/plugins/press-kit.md",
    visibility: { scope: "always", pluginIds: ["press-kit"] },
  },
  {
    id: "plugin-order-lab",
    title: "Order Lab plugin",
    file: "sections/plugins/order-lab.md",
    visibility: { scope: "always", pluginIds: ["order-lab"] },
  },
]
