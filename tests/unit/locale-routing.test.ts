import { describe, expect, it } from "vitest"
import { localizeHref, LOCALE_COOKIE, BASE_CONTENT_LOCALE } from "@wse/sdk/i18n/constants"
import { stripLocalePrefix } from "@wse/core/lib/locale"

describe("localizeHref", () => {
  it("leaves base-locale and external hrefs unchanged", () => {
    expect(localizeHref("/jegyek", BASE_CONTENT_LOCALE)).toBe("/jegyek")
    expect(localizeHref("/jegyek", "en")).toBe("/jegyek")
    expect(localizeHref("https://example.com", "hu")).toBe("https://example.com")
    expect(localizeHref("//cdn.example.com/x", "hu")).toBe("//cdn.example.com/x")
    expect(localizeHref("#section", "hu")).toBe("#section")
  })

  it("prefixes site-relative hrefs for non-base locales without double-prefixing", () => {
    expect(localizeHref("/jegyek", "hu")).toBe("/hu/jegyek")
    expect(localizeHref("/", "hu")).toBe("/hu/")
    expect(localizeHref("/#venue", "hu")).toBe("/hu/#venue")
    expect(localizeHref("/hu/jegyek", "hu")).toBe("/hu/jegyek")
    expect(localizeHref("/hu", "hu")).toBe("/hu")
  })
})

describe("stripLocalePrefix", () => {
  const supported = ["en", "hu"] as const

  it("strips known locale prefixes", () => {
    expect(stripLocalePrefix("/hu", supported)).toEqual({ locale: "hu", rest: "/" })
    expect(stripLocalePrefix("/hu/jegyek", supported)).toEqual({ locale: "hu", rest: "/jegyek" })
    expect(stripLocalePrefix("/en/jegyek", supported)).toEqual({ locale: "en", rest: "/jegyek" })
  })

  it("returns null when there is no locale prefix", () => {
    expect(stripLocalePrefix("/", supported)).toBeNull()
    expect(stripLocalePrefix("/jegyek", supported)).toBeNull()
  })
})

describe("LOCALE_COOKIE", () => {
  it("uses a stable cookie name for middleware and the language switcher", () => {
    expect(LOCALE_COOKIE).toBe("wse_locale")
  })
})
