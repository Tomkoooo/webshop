import { describe, expect, it } from "vitest"
import { contactReplyHtmlToText } from "@wse/core/lib/contact-replies"

describe("contactReplyHtmlToText", () => {
  it("converts rich text reply HTML to readable plain text", () => {
    expect(
      contactReplyHtmlToText("<p>Hello&nbsp;<strong>World</strong></p><p>Second<br />line</p>")
    ).toBe("Hello World\nSecond\nline")
  })
})
