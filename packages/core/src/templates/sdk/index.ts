export { useTemplateCartActions } from "./use-template-cart-actions"

/** Cart → checkout with optional product-suggestions modal (configured in admin). Custom `RouteMain` should use this instead of linking to `/checkout`. Pass `dialogPresentation` on the hook or gate to match template typography. */
export {
  useCheckoutWithSuggestions,
  CheckoutSuggestionsGate,
  CheckoutSuggestionsDialog,
  type CheckoutSuggestionsDialogPresentation,
  type UseCheckoutWithSuggestionsOptions,
} from "@wse/core/components/checkout-suggestions/CheckoutSuggestionsDialog"

export type { CheckoutSuggestionItemDto } from "@wse/core/services/checkout-product-suggestions"

/** Default engine bodies — optional reuse inside a custom `RouteMain`. */
export {
  DefaultCartPageView,
  DefaultCheckoutPageView,
  DefaultProfilePageView,
} from "@wse/core/components/flow-routes/default-flow-views"

/** `/shop` preview + storefront: `ProductCard` + optional `CategoryPill` from `commerceSlots`. */
export { resolveCommerceShopRendering } from "@wse/core/templates/resolve-commerce-slots"

/** Checkout wizard: same validation + Stripe/COD submit as engine `CheckoutPageView`. */
export {
  useCheckoutWizardModel,
  CHECKOUT_WIZARD_STEPS,
  type CheckoutWizardFormState,
  type CheckoutWizardStepId,
} from "@wse/core/components/checkout/use-checkout-wizard-model"

/** Profile account tab: load/save `/api/user/profile`, newsletter, sign-out / delete. */
export {
  useProfileAccountModel,
  type ProfileAccountFormState,
} from "@wse/core/components/profile/use-profile-account-model"
