import { describe, expect, it } from "vitest"
import {
  localizeHref,
  localeSwitchPath,
  stripLocalePrefix,
  LOCALE_COOKIE,
  BASE_CONTENT_LOCALE,
} from "@wse/sdk/i18n/constants"

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
    expect(localizeHref("/", "hu")).toBe("/hu")
    expect(localizeHref("/#venue", "hu")).toBe("/hu/#venue")
    expect(localizeHref("/hu/jegyek", "hu")).toBe("/hu/jegyek")
    expect(localizeHref("/hu", "hu")).toBe("/hu")
    expect(localizeHref("/foglalas/abc?events=1,2", "hu")).toBe("/hu/foglalas/abc?events=1,2")
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

describe("localeSwitchPath", () => {
  const supported = ["en", "hu"] as const

  it("switches between default and prefixed locales from any path", () => {
    expect(localeSwitchPath("/", "hu", supported, "en")).toBe("/hu")
    expect(localeSwitchPath("/jegyek", "hu", supported, "en")).toBe("/hu/jegyek")
    expect(localeSwitchPath("/hu", "en", supported, "en")).toBe("/")
    expect(localeSwitchPath("/hu/jegyek", "en", supported, "en")).toBe("/jegyek")
    expect(localeSwitchPath("/hu/foglalas/x", "hu", supported, "en")).toBe("/hu/foglalas/x")
  })
})

describe("LOCALE_COOKIE", () => {
  it("uses a stable cookie name for middleware and the language switcher", () => {
    expect(LOCALE_COOKIE).toBe("wse_locale")
  })
})
