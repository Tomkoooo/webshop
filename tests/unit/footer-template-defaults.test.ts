import { describe, expect, it } from "vitest"
import {
  ENGINE_SHOP_FOOTER_DEFAULTS,
  isLegacyShopOrCampFooter,
  resolveFooterDefaults,
  shouldMigrateLegacyFooter,
} from "@wse/core/lib/resolve-footer-defaults"
import { wdfFooterDefaults } from "@wse/template-world-darts-festival/footer-defaults"

describe("resolve-footer-defaults", () => {
  it("uses WDF festival defaults instead of shop/KockaKemp baselines", () => {
    const resolved = resolveFooterDefaults({
      manifest: { id: "world-darts-festival" },
      footerDefaults: wdfFooterDefaults,
    } as never)

    expect(resolved.quickLinks[0]?.href).toBe("/jegyek")
    expect(resolved.organizerSection?.title).toBe("")
    expect(resolved.paymentMethodsNote).toBe("")
    expect(resolved.tagline).toContain("darts")
  })

  it("detects legacy shop seed footer rows", () => {
    expect(isLegacyShopOrCampFooter(ENGINE_SHOP_FOOTER_DEFAULTS)).toBe(true)
    expect(
      isLegacyShopOrCampFooter({
        organizerSection: {
          title: "A KockaKemp tábor szervezője az Eseményszervezés.hu",
          companyName: "",
          registeredAddress: "",
          mailingAddress: "",
          openingHours: "",
        },
      })
    ).toBe(true)
  })

  it("allows WDF migration when legacy footer was customized for the festival", () => {
    expect(
      shouldMigrateLegacyFooter("world-darts-festival", {
        tagline: "World Darts Festival Budapest",
        quickLinks: [{ label: "Tickets", href: "/jegyek" }],
      })
    ).toBe(true)
    expect(shouldMigrateLegacyFooter("world-darts-festival", ENGINE_SHOP_FOOTER_DEFAULTS)).toBe(
      false
    )
  })

  it("always migrates legacy footer for minecraft-camp", () => {
    expect(
      shouldMigrateLegacyFooter("minecraft-camp", {
        organizerSection: {
          title: "A KockaKemp tábor szervezője",
          companyName: "",
          registeredAddress: "",
          mailingAddress: "",
          openingHours: "",
        },
      })
    ).toBe(true)
  })
})
