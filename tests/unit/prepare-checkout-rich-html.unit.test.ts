import { describe, expect, it } from "vitest"
import { decodeHtmlEntities, prepareCheckoutRichHtml } from "@wse/core/lib/prepare-checkout-rich-html"

describe("prepareCheckoutRichHtml", () => {
  it("returns null for empty input", () => {
    expect(prepareCheckoutRichHtml("")).toBeNull()
    expect(prepareCheckoutRichHtml("   ")).toBeNull()
  })

  it("passes through raw HTML", () => {
    expect(prepareCheckoutRichHtml("<b>Fizetés</b><br/>Kártya")).toBe("<b>Fizetés</b><br/>Kártya")
  })

  it("decodes entity-encoded HTML (Foxpost findme style)", () => {
    const encoded = "HU1569&lt;br/&gt;&lt;b&gt;Fizetés&lt;/b&gt;"
    expect(prepareCheckoutRichHtml(encoded)).toBe("HU1569<br/><b>Fizetés</b>")
  })
})

describe("decodeHtmlEntities", () => {
  it("decodes common entities", () => {
    expect(decodeHtmlEntities("&lt;br/&gt; &amp; &quot;x&quot;")).toBe('<br/> & "x"')
  })
})
