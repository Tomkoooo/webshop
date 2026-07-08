import { describe, expect, it } from "vitest"
import { shouldOpenCheckoutSuggestionsModal } from "@wse/core/lib/checkout-suggestions-modal"

describe("shouldOpenCheckoutSuggestionsModal", () => {
  it("returns false when feature is disabled", () => {
    expect(
      shouldOpenCheckoutSuggestionsModal({
        enabled: false,
        suggestionCount: 3,
        showCartLinesInModal: true,
        cartLineCount: 2,
      })
    ).toBe(false)
  })

  it("returns true when enabled with suggestions", () => {
    expect(
      shouldOpenCheckoutSuggestionsModal({
        enabled: true,
        suggestionCount: 2,
        showCartLinesInModal: false,
        cartLineCount: 0,
      })
    ).toBe(true)
  })

  it("returns true when enabled with cart lines in modal", () => {
    expect(
      shouldOpenCheckoutSuggestionsModal({
        enabled: true,
        suggestionCount: 0,
        showCartLinesInModal: true,
        cartLineCount: 1,
      })
    ).toBe(true)
  })

  it("returns true when enabled even with no suggestions and no cart preview", () => {
    expect(
      shouldOpenCheckoutSuggestionsModal({
        enabled: true,
        suggestionCount: 0,
        showCartLinesInModal: false,
        cartLineCount: 3,
      })
    ).toBe(true)
  })
})
