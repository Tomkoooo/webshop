import { describe, expect, it } from "vitest"
import { resolveCmsHref } from "@wse/core/lib/cms-href"

describe("resolveCmsHref", () => {
  it("keeps internal paths for Next Link", () => {
    expect(resolveCmsHref("/jegyek")).toEqual({ href: "/jegyek", external: false })
    expect(resolveCmsHref("/#venue")).toEqual({ href: "/#venue", external: false })
    expect(resolveCmsHref("#")).toEqual({ href: "#", external: false })
  })

  it("treats absolute http(s) URLs as external blank targets", () => {
    expect(resolveCmsHref("https://maps.google.com/?q=Budapest")).toEqual({
      href: "https://maps.google.com/?q=Budapest",
      external: true,
    })
    expect(resolveCmsHref("//maps.google.com/?q=Budapest")).toEqual({
      href: "https://maps.google.com/?q=Budapest",
      external: true,
    })
  })

  it("upgrades bare google.com-style hosts so they are not same-origin paths", () => {
    expect(resolveCmsHref("google.com/maps")).toEqual({
      href: "https://google.com/maps",
      external: true,
    })
    expect(resolveCmsHref("www.google.com/maps?q=Budapest")).toEqual({
      href: "https://www.google.com/maps?q=Budapest",
      external: true,
    })
    expect(resolveCmsHref("maps.google.com/?q=Gerevich")).toEqual({
      href: "https://maps.google.com/?q=Gerevich",
      external: true,
    })
  })

  it("keeps mailto/tel external", () => {
    expect(resolveCmsHref("mailto:hi@example.com").external).toBe(true)
    expect(resolveCmsHref("tel:+361234").external).toBe(true)
  })
})
