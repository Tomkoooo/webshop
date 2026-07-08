/** Whether the pre-checkout suggestions dialog should open (client-side gate). */
export function shouldOpenCheckoutSuggestionsModal(opts: {
  enabled: boolean
  suggestionCount: number
  showCartLinesInModal: boolean
  cartLineCount: number
}): boolean {
  if (!opts.enabled) return false
  if (opts.suggestionCount > 0) return true
  if (opts.showCartLinesInModal && opts.cartLineCount > 0) return true
  return true
}
